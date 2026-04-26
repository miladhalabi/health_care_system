import AppError from '../utils/AppError.js';
import AuditService from './AuditService.js';
import { startOfDay, endOfDay } from 'date-fns';

class BookingService {
  /**
   * Book an appointment
   */
  static async bookAppointment(prisma, { 
    patientId, 
    clinicId, 
    doctorId, 
    startTime, 
    endTime, 
    bookingType = 'SCHEDULED' 
  }) {
    // 1. Validate inputs
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError('Invalid time format', 400);
    }

    const initialStatus = bookingType === 'SCHEDULED' ? 'BOOKED' : 'WAITING';

    // 2. Check for double booking (Doctor)
    const existingDoctorBooking = await prisma.appointment.findFirst({
      where: {
        userId: doctorId,
        status: { not: 'CANCELLED' },
        OR: [
          {
            startTime: { gte: start, lt: end }
          },
          {
            endTime: { gt: start, lte: end }
          }
        ]
      }
    });

    if (existingDoctorBooking) {
      throw new AppError('Doctor is already booked for this time slot', 409);
    }

    // 3. Check for overlapping booking (Patient)
    const existingPatientBooking = await prisma.appointment.findFirst({
      where: {
        patientId,
        status: { not: 'CANCELLED' },
        OR: [
          {
            startTime: { gte: start, lt: end }
          },
          {
            endTime: { gt: start, lte: end }
          }
        ]
      }
    });

    if (existingPatientBooking) {
      throw new AppError('Patient already has an appointment during this time', 409);
    }

    // 4. Calculate Queue Number for the day in that clinic
    const count = await prisma.appointment.count({
      where: {
        clinicId,
        date: {
          gte: startOfDay(start),
          lte: endOfDay(start)
        }
      }
    });

    const queueNumber = count + 1;

    // 5. Create the appointment in a transaction
    const appointment = await prisma.$transaction(async (tx) => {
      const app = await tx.appointment.create({
        data: {
          patientId,
          clinicId,
          userId: doctorId, // Doctor assigned
          date: startOfDay(start),
          startTime: start,
          endTime: end,
          queueNumber,
          bookingType,
          status: initialStatus,
          isConfirmed: bookingType !== 'SCHEDULED'
        },
        include: {
          clinic: true,
          patient: {
            include: { user: true }
          }
        }
      });

      // 6. Audit Log
      await AuditService.log(tx, {
        action: 'CREATE',
        entity: 'APPOINTMENT',
        entityId: app.id,
        userId: patientId, // Logged as patient or system
        details: { message: `New ${bookingType} appointment booked`, startTime, doctorId }
      });

      return app;
    });

    return appointment;
  }
}

export default BookingService;

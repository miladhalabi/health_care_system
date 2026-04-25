import { startOfDay, endOfDay, addMinutes, isBefore, parse, format, getDay } from 'date-fns';
import AppError from '../utils/AppError.js';

class SchedulingService {
  /**
   * Generate available time slots for a doctor on a specific date at a specific clinic
   * @param {Object} prisma - Prisma Client
   * @param {String} doctorId - ID of the doctor
   * @param {String} clinicId - ID of the clinic
   * @param {Date} date - The date to check availability for
   */
  static async getAvailableSlots(prisma, doctorId, clinicId, date) {
    console.log(`Generating slots for Doctor: ${doctorId} at Clinic: ${clinicId} on Date: ${format(date, 'yyyy-MM-dd')}`);
    const dayOfWeek = getDay(date); // 0 (Sun) to 6 (Sat)
    
    // 1. Check if doctor is absent on this date (Absence is doctor-wide)
    const absence = await prisma.doctorAbsence.findUnique({
      where: {
        doctorId_date: {
          doctorId,
          date: startOfDay(date)
        }
      }
    });

    if (absence) return [];

    // 2. Get doctor's recurring schedule for this day of week AT THIS CLINIC
    const schedules = await prisma.doctorSchedule.findMany({
      where: {
        doctorId,
        clinicId,
        dayOfWeek,
        isActive: true
      }
    });

    if (schedules.length === 0) return [];

    // 3. Get existing appointments for this doctor on this day (across all clinics to prevent double booking)
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: doctorId, 
        date: {
          gte: startOfDay(date),
          lte: endOfDay(date)
        },
        status: { not: 'CANCELLED' }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    // 4. Generate slots for each schedule window in this clinic
    const allSlots = [];
    
    for (const schedule of schedules) {
      let currentSlotStart = parse(schedule.startTime, 'HH:mm', date);
      const windowEnd = parse(schedule.endTime, 'HH:mm', date);

      while (isBefore(currentSlotStart, windowEnd)) {
        const currentSlotEnd = addMinutes(currentSlotStart, schedule.slotDuration);
        
        // Ensure the slot doesn't exceed the window
        if (!isBefore(currentSlotEnd, windowEnd) && format(currentSlotEnd, 'HH:mm') !== schedule.endTime) {
          break;
        }

        // Check if slot overlaps with ANY existing appointment for this doctor
        const isOccupied = appointments.some(app => {
          if (!app.startTime || !app.endTime) return false;
          return (
            (currentSlotStart >= app.startTime && currentSlotStart < app.endTime) ||
            (currentSlotEnd > app.startTime && currentSlotEnd <= app.endTime)
          );
        });

        // Check if slot is in the past
        const isPast = isBefore(currentSlotStart, new Date());

        if (!isOccupied && !isPast) {
          allSlots.push({
            start: format(currentSlotStart, 'HH:mm'),
            end: format(currentSlotEnd, 'HH:mm'),
            startTime: currentSlotStart.toISOString(),
            endTime: currentSlotEnd.toISOString(),
            clinicId: schedule.clinicId
          });
        }

        currentSlotStart = currentSlotEnd;
      }
    }

    // Sort slots by time
    return allSlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }
}

export default SchedulingService;

import BookingService from '../services/BookingService.js';
import AppError from '../utils/AppError.js';
import { subDays } from 'date-fns';

const decorateAppointmentsWithAttendanceOutcome = async (prisma, appointments) => {
  if (!appointments.length) return appointments;

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entity: 'APPOINTMENT',
      entityId: { in: appointments.map((appointment) => appointment.id) }
    },
    orderBy: { createdAt: 'desc' }
  });

  const latestOutcomeByAppointmentId = new Map();

  for (const log of auditLogs) {
    const outcome = log.details?.newStatus;
    if (!['ATTENDED', 'NO_SHOW'].includes(outcome)) continue;
    if (latestOutcomeByAppointmentId.has(log.entityId)) continue;
    latestOutcomeByAppointmentId.set(log.entityId, outcome);
  }

  return appointments.map((appointment) => ({
    ...appointment,
    status: latestOutcomeByAppointmentId.get(appointment.id) || appointment.status
  }));
};

/**
 * Get all clinics with their governorates
 */
export const getClinics = async (req, res, next) => {
  const prisma = req.app.get('prisma');
  try {
    const clinics = await prisma.clinic.findMany({
      include: { governorate: true }
    });
    res.json(clinics);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all doctors nationally (optionally by specialty)
 */
export const getDoctors = async (req, res, next) => {
  const { specialtyId } = req.query;
  const prisma = req.app.get('prisma');
  try {
    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        specialtyId: specialtyId || undefined
      },
      select: {
        id: true,
        fullName: true,
        specialty: { select: { nameAr: true, nameEn: true } }
      }
    });
    res.json(doctors);
  } catch (error) {
    next(error);
  }
};

/**
 * Get clinics associated with a specific doctor (via their schedules)
 */
export const getDoctorClinics = async (req, res, next) => {
  const { doctorId } = req.params;
  const prisma = req.app.get('prisma');
  try {
    const schedules = await prisma.doctorSchedule.findMany({
      where: { doctorId, isActive: true },
      include: { clinic: { include: { governorate: true } } }
    });
    
    // Get unique clinics from schedules
    const clinics = Array.from(new Map(schedules.map(s => [s.clinic.id, s.clinic])).values());
    res.json(clinics);
  } catch (error) {
    next(error);
  }
};

/**
 * Book a scheduled appointment
 */
export const bookAppointment = async (req, res, next) => {
  const { clinicId, doctorId, startTime, endTime } = req.body;
  const prisma = req.app.get('prisma');
  const nationalId = req.user.nationalId;

  try {
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { nationalId }
    });

    if (!patientProfile) throw new AppError('Patient profile not found', 404);

    const appointment = await BookingService.bookAppointment(prisma, {
      patientId: patientProfile.id,
      clinicId,
      doctorId,
      startTime,
      endTime,
      bookingType: 'SCHEDULED'
    });

    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient's upcoming appointments
 */
export const getMyAppointments = async (req, res, next) => {
  const prisma = req.app.get('prisma');
  const nationalId = req.user.nationalId;

  try {
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { nationalId }
    });

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patientProfile.id,
        status: { in: ['WAITING', 'IN_SESSION', 'DONE', 'CANCELLED'] },
        OR: [
          {
            status: { in: ['WAITING', 'IN_SESSION'] }
          },
          {
            startTime: { gte: subDays(new Date(), 30) }
          }
        ]
      },
      include: {
        clinic: true,
        user: { select: { fullName: true, specialty: true } }
      },
      orderBy: { startTime: 'desc' },
      take: 12
    });
    res.json(await decorateAppointmentsWithAttendanceOutcome(prisma, appointments));
  } catch (error) {
    next(error);
  }
};

/**
 * Join live queue (Walk-in)
 */
export const joinQueue = async (req, res, next) => {
  const { clinicId } = req.body;
  const prisma = req.app.get('prisma');
  const io = req.app.get('io');
  const nationalId = req.user.nationalId;

  try {
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { nationalId }
    });

    if (!patientProfile) throw new AppError('Patient profile not found', 404);

    const existing = await prisma.appointment.findFirst({
      where: {
        patientId: patientProfile.id,
        clinicId,
        status: { in: ['WAITING', 'IN_SESSION'] },
        date: { gte: new Date(new Date().setHours(0,0,0,0)) }
      }
    });

    if (existing) throw new AppError('أنت مسجل بالفعل في طابور هذه العيادة اليوم', 400);

    const count = await prisma.appointment.count({
      where: {
        clinicId,
        date: { gte: new Date(new Date().setHours(0,0,0,0)) }
      }
    });

    const appointment = await prisma.appointment.create({
      data: {
        clinicId,
        patientId: patientProfile.id,
        queueNumber: count + 1,
        status: 'WAITING',
        bookingType: 'WALK_IN'
      },
      include: { patient: { include: { user: true } } }
    });

    io.to(`clinic_${clinicId}`).emit('queue_updated', appointment);
    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

/**
 * Get complete medical records
 */
export const getMyRecords = async (req, res, next) => {
  const prisma = req.app.get('prisma');
  const nationalId = req.user.nationalId;

  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { nationalId },
      include: {
        user: true,
        encounters: {
          include: {
            doctor: true,
            clinic: true,
            prescription: { include: { items: true } }
          },
          orderBy: { date: 'desc' }
        }
      }
    });
    res.json(patient);
  } catch (error) {
    next(error);
  }
};

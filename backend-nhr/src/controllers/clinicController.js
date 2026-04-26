import AppError from '../utils/AppError.js';
import SchedulingService from '../services/SchedulingService.js';
import AuditService from '../services/AuditService.js';

const TERMINAL_APPOINTMENT_STATUSES = ['ATTENDED', 'NO_SHOW', 'DONE', 'CANCELLED'];

const getStaffClinicId = async (prisma, user) => {
  if (user.role === 'RECEPTIONIST') {
    return user.clinicId || null;
  }

  if (user.role === 'DOCTOR') {
    const doctor = await prisma.user.findUnique({
      where: { id: user.id },
      select: { activeClinicId: true, clinicId: true }
    });

    return doctor?.activeClinicId || doctor?.clinicId || null;
  }

  return null;
};

/**
 * Get live queue (WAITING and IN_SESSION)
 */
export const getQueue = async (req, res, next) => {
  const { clinicId } = req.params;
  const prisma = req.app.get('prisma');

  try {
    const queue = await prisma.appointment.findMany({
      where: {
        clinicId,
        OR: [
          { status: 'IN_SESSION' },
          { status: 'WAITING' }
        ],
        date: { gte: new Date(new Date().setHours(0,0,0,0)) }
      },
      include: {
        patient: { include: { user: true } },
        user: { select: { fullName: true } }
      },
      orderBy: { queueNumber: 'asc' }
    });
    res.json(queue);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all doctors associated with a clinic (via their schedules)
 */
export const getClinicDoctors = async (req, res, next) => {
  const { clinicId } = req.params;
  const prisma = req.app.get('prisma');

  try {
    // Find unique doctors who have at least one schedule entry in this clinic
    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        schedules: {
          some: { clinicId }
        }
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
 * Get available slots for a doctor on a date at a SPECIFIC clinic
 */
export const getDoctorAvailability = async (req, res, next) => {
  const { doctorId } = req.params;
  const { date, clinicId } = req.query; // Added clinicId to query
  const prisma = req.app.get('prisma');

  try {
    if (!date) throw new AppError('Date is required', 400);
    if (!clinicId) throw new AppError('Clinic ID is required', 400);
    
    const slots = await SchedulingService.getAvailableSlots(
      prisma, 
      doctorId, 
      clinicId,
      new Date(date)
    );
    res.json(slots);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all scheduled appointments for a clinic (The Daily Schedule)
 */
export const getClinicAppointments = async (req, res, next) => {
  const { clinicId } = req.params;
  const { date, doctorId } = req.query;
  const prisma = req.app.get('prisma');

  try {
    const queryDate = date ? new Date(date) : new Date();
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        userId: doctorId || undefined,
        date: {
          gte: new Date(queryDate.setHours(0,0,0,0)),
          lte: new Date(queryDate.setHours(23,59,59,999))
        },
        bookingType: 'SCHEDULED'
      },
      include: {
        patient: { include: { user: true } },
        user: { select: { fullName: true, specialty: true } }
      },
      orderBy: { startTime: 'asc' }
    });

    res.json(appointments);
  } catch (error) {
    next(error);
  }
};

/**
 * Check-in a scheduled patient (move to queue)
 */
export const checkInPatient = async (req, res, next) => {
  const { appointmentId } = req.params;
  const prisma = req.app.get('prisma');
  const io = req.app.get('io');

  try {
    const staffClinicId = await getStaffClinicId(prisma, req.user);
    if (!staffClinicId) {
      throw new AppError('Clinic context missing', 403);
    }

    const appointmentToCheckIn = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        clinicId: true,
        bookingType: true,
        status: true,
        isConfirmed: true
      }
    });

    if (!appointmentToCheckIn) throw new AppError('Appointment not found', 404);

    if (appointmentToCheckIn.clinicId !== staffClinicId) {
      throw new AppError('You can only check in patients for your current clinic', 403);
    }

    if (appointmentToCheckIn.bookingType !== 'SCHEDULED') {
      throw new AppError('Only scheduled appointments can be checked in from the schedule', 400);
    }

    if (TERMINAL_APPOINTMENT_STATUSES.includes(appointmentToCheckIn.status)) {
      throw new AppError('Attendance was already finalized for this appointment', 409);
    }

    if (appointmentToCheckIn.status !== 'BOOKED') {
      throw new AppError('This appointment is already checked in', 409);
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'WAITING', isConfirmed: true },
      include: { clinic: true, patient: { include: { user: true } } }
    });

    io.to(`clinic_${appointment.clinicId}`).emit('queue_updated', appointment);
    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

/**
 * Add a walk-in patient to queue
 */
export const addToQueue = async (req, res, next) => {
  const { clinicId, nationalId } = req.body;
  const prisma = req.app.get('prisma');
  const io = req.app.get('io');

  try {
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { nationalId },
      include: { user: true }
    });

    if (!patientProfile) throw new AppError('Patient not found', 404);

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
        userId: req.user.id,
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
 * Call next patient (WAITING -> IN_SESSION)
 */
export const callPatient = async (req, res, next) => {
  const { appointmentId } = req.params;
  const prisma = req.app.get('prisma');
  const io = req.app.get('io');

  try {
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'IN_SESSION' },
      include: { clinic: true, patient: { include: { user: true } } }
    });

    io.to(`clinic_${appointment.clinicId}`).emit('queue_updated', appointment);
    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient medical history
 */
export const getPatientHistory = async (req, res, next) => {
  const { nationalId } = req.params;
  const prisma = req.app.get('prisma');

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

    if (!patient) throw new AppError('Patient not found', 404);
    res.json(patient);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new medical encounter
 */
export const createEncounter = async (req, res, next) => {
  const { patientId, symptoms, diagnosis, notes, prescriptionItems } = req.body;
  const prisma = req.app.get('prisma');
  const doctorId = req.user.id;
  const requestClinicId = req.body.clinicId;
  const staffClinicId = await getStaffClinicId(prisma, req.user);
  const targetClinicId = requestClinicId || staffClinicId;

  if (!targetClinicId) throw new AppError('Clinic context missing', 403);

  if (staffClinicId && requestClinicId && requestClinicId !== staffClinicId) {
    throw new AppError('Encounter clinic does not match your current active clinic', 403);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const encounter = await tx.medicalEncounter.create({
        data: { patientId, doctorId, clinicId: targetClinicId, symptoms, diagnosis, notes }
      });

      if (prescriptionItems?.length > 0) {
        await tx.prescription.create({
          data: {
            encounterId: encounter.id,
            patientId,
            items: {
              create: prescriptionItems.map(item => ({
                drugName: item.drugName,
                dosage: item.dosage,
                quantity: item.quantity
              }))
            }
          }
        });
      }
      return { encounter };
    });

    // Mark any active appointment at this clinic as attended once the encounter is saved.
    await prisma.appointment.updateMany({
        where: {
          patientId,
          clinicId: targetClinicId,
          OR: [
            { status: 'IN_SESSION' },
            { status: 'WAITING', isConfirmed: true },
            { status: 'WAITING', bookingType: 'WALK_IN' }
          ]
        },
        data: { status: 'ATTENDED', isConfirmed: true }
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all clinic encounters
 */
export const getClinicEncounters = async (req, res, next) => {
  const { clinicId } = req.params;
  const prisma = req.app.get('prisma');

  try {
    const encounters = await prisma.medicalEncounter.findMany({
      where: { clinicId },
      include: {
        patient: { include: { user: true } },
        doctor: true,
        prescription: { include: { items: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(encounters);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark attendance outcome for a scheduled appointment
 */
export const markAttendance = async (req, res, next) => {
  const { appointmentId } = req.params;
  const { outcome } = req.body;
  const prisma = req.app.get('prisma');

  try {
    if (!['ATTENDED', 'NO_SHOW'].includes(outcome)) {
      throw new AppError('Invalid attendance outcome', 400);
    }

    const staffClinicId = await getStaffClinicId(prisma, req.user);
    if (!staffClinicId) {
      throw new AppError('Clinic context missing', 403);
    }

    const result = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          clinic: true,
          user: { select: { id: true, fullName: true, specialty: true } },
          patient: {
            include: {
              user: { select: { fullName: true, nationalId: true } }
            }
          }
        }
      });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      if (appointment.clinicId !== staffClinicId) {
        throw new AppError('You can only update attendance for your current clinic', 403);
      }

      if (appointment.bookingType !== 'SCHEDULED') {
        throw new AppError('Attendance tracking is currently supported for scheduled appointments only', 400);
      }

      if (TERMINAL_APPOINTMENT_STATUSES.includes(appointment.status)) {
        throw new AppError('Attendance was already finalized for this appointment', 409);
      }

      if (outcome === 'NO_SHOW') {
        if (!appointment.endTime || appointment.endTime > new Date()) {
          throw new AppError('A no-show can only be recorded after the appointment slot ends', 400);
        }

        if (appointment.isConfirmed || appointment.status === 'IN_SESSION') {
          throw new AppError('This appointment was already checked in and cannot be marked as no-show', 409);
        }
      }

      if (outcome === 'ATTENDED' && appointment.startTime && appointment.startTime > new Date()) {
        throw new AppError('Attendance cannot be recorded before the appointment starts', 400);
      }

      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: outcome,
          isConfirmed: outcome === 'ATTENDED' ? true : appointment.isConfirmed
        },
        include: {
          clinic: true,
          user: { select: { id: true, fullName: true, specialty: true } },
          patient: {
            include: {
              user: { select: { fullName: true, nationalId: true } }
            }
          }
        }
      });

      let patientProfile;
      if (outcome === 'NO_SHOW') {
        patientProfile = await tx.patientProfile.update({
          where: { id: appointment.patientId },
          data: {
            missedAppointments: {
              increment: 1
            }
          },
          select: {
            id: true,
            missedAppointments: true,
            reliabilityScore: true
          }
        });
      } else {
        patientProfile = await tx.patientProfile.findUnique({
          where: { id: appointment.patientId },
          select: {
            id: true,
            missedAppointments: true,
            reliabilityScore: true
          }
        });
      }

      await AuditService.log(tx, {
        action: 'UPDATE',
        entity: 'APPOINTMENT',
        entityId: updatedAppointment.id,
        userId: req.user.id,
        details: {
            message: `Marked appointment attendance as ${outcome}`,
            previousStatus: appointment.status,
            newStatus: outcome,
            patientId: appointment.patientId,
            clinicId: appointment.clinicId
          }
      });

      return {
        appointment: updatedAppointment,
        patientProfile
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

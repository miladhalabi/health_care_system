import AppError from '../utils/AppError.js';
import SchedulingService from '../services/SchedulingService.js';

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
        status: { in: ['WAITING', 'IN_SESSION'] },
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
  const clinicId = req.user.clinicId;

  // For doctors, we still use clinicId from their session if they are logged into a specific clinic 
  // OR we pass clinicId in the body.
  const targetClinicId = clinicId || req.body.clinicId;

  if (!targetClinicId) throw new AppError('Clinic context missing', 403);

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

    // Mark appointment as DONE
    await prisma.appointment.updateMany({
        where: { patientId, clinicId: targetClinicId, status: 'IN_SESSION' },
        data: { status: 'DONE' }
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

import DoctorService from '../services/DoctorService.js';
import logger from '../utils/logger.js';

export const getDoctorConfig = async (req, res, next) => {
  const prisma = req.app.get('prisma');
  const doctorId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: doctorId },
      include: {
        schedules: { 
          include: { clinic: true },
          orderBy: { startTime: 'asc' }
        },
        activeClinic: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const suggestedClinicId = await DoctorService.suggestActiveClinic(prisma, doctorId);

    res.json({
      profile: user,
      rotation: user.schedules || [],
      activeClinic: user.activeClinic,
      suggestedClinicId
    });
  } catch (error) {
    logger.error('Error in getDoctorConfig:', error);
    next(error);
  }
};

export const switchActiveSession = async (req, res, next) => {
  const { clinicId } = req.body;
  const prisma = req.app.get('prisma');
  const doctorId = req.user.id;

  try {
    const user = await DoctorService.switchActiveClinic(prisma, doctorId, clinicId || null);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const upsertSchedule = async (req, res, next) => {
  const prisma = req.app.get('prisma');
  const doctorId = req.user.id;

  try {
    const schedule = await DoctorService.upsertSchedule(prisma, doctorId, req.body);
    res.json(schedule);
  } catch (error) {
    next(error);
  }
};

export const deleteSchedule = async (req, res, next) => {
  const { id } = req.params;
  const prisma = req.app.get('prisma');
  const doctorId = req.user.id;

  try {
    const result = await DoctorService.deleteSchedule(prisma, doctorId, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

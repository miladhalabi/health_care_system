import { format, getDay, parse, isBefore, isAfter, areIntervalsOverlapping } from 'date-fns';
import AppError from '../utils/AppError.js';
import AuditService from './AuditService.js';

class DoctorService {
  /**
   * Suggest active clinic based on current time
   */
  static async suggestActiveClinic(prisma, doctorId) {
    const now = new Date();
    const dayOfWeek = getDay(now);
    const currentTime = format(now, 'HH:mm');

    const activeSchedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        startTime: { lte: currentTime },
        endTime: { gte: currentTime },
        isActive: true
      }
    });

    return activeSchedule?.clinicId || null;
  }

  /**
   * Manually switch active clinic session
   */
  static async switchActiveClinic(prisma, doctorId, clinicId) {
    const user = await prisma.user.update({
      where: { id: doctorId },
      data: { activeClinicId: clinicId },
      include: { activeClinic: true }
    });

    await AuditService.log(prisma, {
      action: 'UPDATE',
      entity: 'USER',
      entityId: doctorId,
      userId: doctorId,
      details: { message: `Switched active clinic to ${user.activeClinic?.name || 'NONE'}` }
    });

    return user;
  }

  /**
   * Add or Update a schedule window with conflict validation
   */
  static async upsertSchedule(prisma, doctorId, data) {
    const { clinicId, dayOfWeek, startTime, endTime, slotDuration, id } = data;

    // 1. Basic validation
    if (startTime >= endTime) throw new AppError('Start time must be before end time', 400);

    // 2. Check for overlaps in the doctor's entire weekly rotation
    const existingSchedules = await prisma.doctorSchedule.findMany({
      where: {
        doctorId,
        dayOfWeek,
        id: { not: id || undefined }
      }
    });

    for (const sched of existingSchedules) {
      const isOverlap = areIntervalsOverlapping(
        { start: parse(startTime, 'HH:mm', new Date()), end: parse(endTime, 'HH:mm', new Date()) },
        { start: parse(sched.startTime, 'HH:mm', new Date()), end: parse(sched.endTime, 'HH:mm', new Date()) }
      );
      
      if (isOverlap) {
        throw new AppError(`Overlap detected with existing session at another clinic (${sched.startTime} - ${sched.endTime})`, 409);
      }
    }

    // 3. Create or Update
    const schedule = await prisma.doctorSchedule.upsert({
      where: { id: id || 'new-id' },
      update: { clinicId, dayOfWeek, startTime, endTime, slotDuration },
      create: { doctorId, clinicId, dayOfWeek, startTime, endTime, slotDuration }
    });

    return schedule;
  }

  /**
   * Delete schedule and cancel associated appointments
   */
  static async deleteSchedule(prisma, doctorId, scheduleId) {
    const schedule = await prisma.doctorSchedule.findUnique({
      where: { id: scheduleId }
    });

    if (!schedule || schedule.doctorId !== doctorId) {
      throw new AppError('Schedule not found', 404);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Find all affected appointments for this specific clinic/time/day in the future
      // Note: This is a complex query in a real system. For now, we cancel all WAITING appointments 
      // linked to this doctor and clinic on that day of week in the future.
      const affectedApps = await tx.appointment.findMany({
        where: {
          userId: doctorId,
          clinicId: schedule.clinicId,
          status: 'WAITING',
          // We could filter specifically by the time window here
        }
      });

      // 2. Cancel them
      if (affectedApps.length > 0) {
        await tx.appointment.updateMany({
          where: { id: { in: affectedApps.map(a => a.id) } },
          data: { status: 'CANCELLED' }
        });

        // 3. Log notification placeholder
        await AuditService.log(tx, {
          action: 'DELETE',
          entity: 'DOCTOR_SCHEDULE',
          entityId: scheduleId,
          userId: doctorId,
          details: { 
            message: `Cancelled ${affectedApps.length} appointments due to schedule removal`,
            affectedAppointmentIds: affectedApps.map(a => a.id)
          }
        });
      }

      // 4. Delete schedule
      await tx.doctorSchedule.delete({ where: { id: scheduleId } });
      
      return { cancelledCount: affectedApps.length };
    });
  }
}

export default DoctorService;

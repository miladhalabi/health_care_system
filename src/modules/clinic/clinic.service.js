import { Injectable, Dependencies, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class ClinicService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async createClinic(clinicData) {
    return this.prisma.clinic.create({
      data: clinicData,
    });
  }

  async getDoctors(clinicId) {
    return this.prisma.user.findMany({
      where: {
        clinicId,
        role: 'DOCTOR',
      },
      select: {
        id: true,
        name: true,
        username: true,
      },
    });
  }

  async createAppointment(data) {
    // Check doctor availability
    const overlapping = await this.prisma.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        appointmentDate: data.appointmentDate,
        status: 'SCHEDULED',
      },
    });

    if (overlapping) {
      throw new ConflictException({
        error: 'Conflict',
        message: 'Doctor already has an appointment at this time'
      });
    }

    return this.prisma.appointment.create({
      data: {
        patientId: data.patientId,
        clinicId: data.clinicId,
        doctorId: data.doctorId,
        receptionistId: data.receptionistId,
        appointmentDate: new Date(data.appointmentDate),
        reason: data.reason,
        status: 'SCHEDULED',
      },
    });
  }

  async getAppointments(clinicId, doctorId = null) {
    const where = { clinicId };
    if (doctorId) where.doctorId = doctorId;

    return this.prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        doctor: {
          select: { name: true }
        }
      },
      orderBy: { appointmentDate: 'asc' },
    });
  }
}

import { Injectable, Dependencies, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class EmrService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Register a new patient in the National Registry
   */
  async createPatient(patientData) {
    return this.prisma.nationalPatient.create({
      data: {
        nationalId: patientData.nationalId,
        fullName: patientData.fullName,
        dateOfBirth: new Date(patientData.dateOfBirth),
        gender: patientData.gender,
        bloodType: patientData.bloodType,
        address: patientData.address,
        phone: patientData.phone,
      },
    });
  }

  /**
   * Find a patient by National ID
   */
  async getPatientByNationalId(nationalId) {
    const patient = await this.prisma.nationalPatient.findUnique({
      where: { nationalId },
      include: {
        medicalRecords: true,
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with National ID ${nationalId} not found`);
    }

    return patient;
  }

  /**
   * Append a new medical encounter (Append-only logic)
   */
  async appendEncounter(encounterData) {
    return this.prisma.encounter.create({
      data: {
        patientId: encounterData.patientId,
        clinicId: encounterData.clinicId,
        doctorId: encounterData.doctorId,
        diagnosis: encounterData.diagnosis,
        notes: encounterData.notes,
        treatmentPlan: encounterData.treatmentPlan,
        date: encounterData.date ? new Date(encounterData.date) : new Date(),
      },
    });
  }

  /**
   * Get full longitudinal history for a patient
   */
  async getPatientHistory(patientId) {
    return this.prisma.nationalPatient.findUnique({
      where: { id: patientId },
      include: {
        encounters: {
          orderBy: { date: 'desc' },
        },
        medicalRecords: true,
      },
    });
  }
}

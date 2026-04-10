import { Controller, Get, Post, Body, Param, Dependencies, Bind } from '@nestjs/common';
import { EmrService } from './emr.service';

@Controller('emr')
@Dependencies(EmrService)
export class EmrController {
  constructor(emrService) {
    this.emrService = emrService;
  }

  @Post('patients')
  @Bind(Body())
  async createPatient(patientData) {
    return this.emrService.createPatient(patientData);
  }

  @Get('patients/:nationalId')
  @Bind(Param('nationalId'))
  async getPatient(nationalId) {
    return this.emrService.getPatientByNationalId(nationalId);
  }

  @Post('encounters')
  @Bind(Body())
  async appendEncounter(encounterData) {
    return this.emrService.appendEncounter(encounterData);
  }

  @Get('history/:patientId')
  @Bind(Param('patientId'))
  async getHistory(patientId) {
    return this.emrService.getPatientHistory(patientId);
  }
}

import { 
  Controller, Get, Post, Body, Query, Dependencies, Bind, 
  UseGuards, Request, UseInterceptors 
} from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditInterceptor } from '../../audit.interceptor';

@Controller('api/v1/clinic')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Dependencies(ClinicService)
export class ClinicController {
  constructor(clinicService) {
    this.clinicService = clinicService;
  }

  @Post()
  @Roles('SYSTEM_ADMIN')
  @Bind(Body())
  async createClinic(clinicData) {
    return this.clinicService.createClinic(clinicData);
  }

  @Get('doctors')
  @Roles('RECEPTIONIST', 'CLINIC_ADMIN', 'DOCTOR')
  @Bind(Request())
  async getDoctors(req) {
    return this.clinicService.getDoctors(req.user.clinicId);
  }

  @Post('appointments')
  @Roles('RECEPTIONIST', 'CLINIC_ADMIN')
  @Bind(Request(), Body())
  async createAppointment(req, data) {
    return this.clinicService.createAppointment({
      ...data,
      clinicId: req.user.clinicId,
      receptionistId: req.user.userId,
    });
  }

  @Get('appointments')
  @Roles('RECEPTIONIST', 'CLINIC_ADMIN', 'DOCTOR')
  @Bind(Request(), Query('doctorId'))
  async getAppointments(req, doctorId) {
    // Doctors can only see their own appointments unless they are Admin/Receptionist
    const searchDoctorId = req.user.role === 'DOCTOR' ? req.user.userId : doctorId;
    return this.clinicService.getAppointments(req.user.clinicId, searchDoctorId);
  }
}

import { 
  Controller, Get, Post, Body, Param, Dependencies, Bind, 
  UseGuards, UseInterceptors, Headers, Request, ForbiddenException 
} from '@nestjs/common';
import { EmrService } from './emr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditInterceptor } from '../../audit.interceptor';

@Controller('api/v1/emr')
@Dependencies(EmrService)
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class EmrController {
  constructor(emrService) {
    this.emrService = emrService;
  }

  @Post('patients')
  @Roles('SYSTEM_ADMIN', 'CLINIC_ADMIN')
  @Bind(Body())
  async createPatient(patientData) {
    return this.emrService.createPatient(patientData);
  }

  @Get('patients/:nationalId')
  @Roles('SYSTEM_ADMIN', 'CLINIC_ADMIN', 'DOCTOR')
  @Bind(Param('nationalId'))
  async getPatient(nationalId) {
    return this.emrService.getPatientByNationalId(nationalId);
  }

  @Post('encounters')
  @Roles('DOCTOR')
  @Bind(Request(), Body(), Headers('Idempotency-Key'))
  async appendEncounter(req, encounterData, idempotencyKey) {
    if (!idempotencyKey) {
      throw new ForbiddenException({
        error: 'BadRequest',
        message: 'Idempotency-Key header is required'
      });
    }
    
    // Inject user info from JWT
    const enrichedData = {
      ...encounterData,
      doctorId: req.user.userId,
      clinicId: req.user.clinicId,
      idempotencyKey
    };
    
    return this.emrService.appendEncounter(enrichedData);
  }

  @Get('patients/:patientId/history')
  @Roles('DOCTOR', 'SYSTEM_ADMIN')
  @Bind(Request(), Param('patientId'))
  async getHistory(req, patientId) {
    // Check for consent (mock logic)
    const hasConsent = await this.emrService.checkConsent(patientId, req.user.clinicId);
    if (!hasConsent && req.user.role !== 'SYSTEM_ADMIN') {
      throw new ForbiddenException({
        error: 'Forbidden',
        message: 'Active patient consent is required to access medical history'
      });
    }
    
    return this.emrService.getPatientHistory(patientId);
  }
}

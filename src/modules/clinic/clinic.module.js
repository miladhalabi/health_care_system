import { Module } from '@nestjs/common';
import { ClinicController } from './clinic.controller';
import { ClinicService } from './clinic.service';
import { AuditInterceptor } from '../../audit.interceptor';

@Module({
  controllers: [ClinicController],
  providers: [ClinicService, AuditInterceptor]
})
export class ClinicModule {}

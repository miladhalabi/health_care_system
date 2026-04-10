import { Module } from '@nestjs/common';
import { EmrController } from './emr.controller';
import { EmrService } from './emr.service';
import { AuditInterceptor } from '../../audit.interceptor';

@Module({
  controllers: [EmrController],
  providers: [EmrService, AuditInterceptor]
})
export class EmrModule {}


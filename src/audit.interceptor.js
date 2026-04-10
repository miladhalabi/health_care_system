import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { tap } from 'rxjs/operators';

@Injectable()
@Dependencies(PrismaService)
export class AuditInterceptor {
  constructor(prisma) {
    this.prisma = prisma;
  }

  intercept(context, next) {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, user, body, params } = request;

    // Determine if it's a READ or WRITE action
    const action = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? 'WRITE' : 'READ';

    // Try to extract patientId
    const patientId = params.patientId || params.id || body.patientId || null;

    return next.handle().pipe(
      tap(async () => {
        // Log after successful response
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: user ? user.userId : 'anonymous',
              clinicId: user ? user.clinicId : null,
              patientId: typeof patientId === 'string' ? patientId : null,
              action: action,
              endpoint: url,
              ipAddress: ip,
              details: `Method: ${method}`,
            },
          });
        } catch (error) {
          console.error('Audit Logging Error:', error);
        }
      }),
    );
  }
}

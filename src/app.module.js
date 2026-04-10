import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmrModule } from './modules/emr/emr.module';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [PrismaModule, EmrModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


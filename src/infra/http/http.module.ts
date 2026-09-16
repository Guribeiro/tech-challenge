import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from '../health/health.controller.js';
import { PrismaService } from '@/infra/database/prisma/prisma.service.js';

@Module({
  imports: [
    TerminusModule,
  ],
  controllers: [
    HealthController,
  ],
  providers: [
    PrismaService,
  ]
})
export class HttpModule { }
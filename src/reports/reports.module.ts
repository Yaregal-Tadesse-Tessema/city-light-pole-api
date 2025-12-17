import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { LightPole } from '../poles/entities/light-pole.entity';
import { PoleIssue } from '../issues/entities/pole-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LightPole, PoleIssue, MaintenanceSchedule]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}




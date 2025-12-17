import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MuseumsController } from './museums.controller';
import { MuseumsService } from './museums.service';
import { Museum } from './entities/museum.entity';
import { MuseumIssue } from '../issues/entities/museum-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
import { MuseumMaintenance } from './entities/museum-maintenance.entity';
import { MuseumMaintenanceService } from './museum-maintenance.service';
import { MuseumMaintenanceController } from './museum-maintenance.controller';
import { MaintenanceAttachment } from '../maintenance/entities/maintenance-attachment.entity';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Museum,
      MuseumIssue,
      MaintenanceSchedule,
      MuseumMaintenance,
      MaintenanceAttachment,
    ]),
    forwardRef(() => IssuesModule),
  ],
  controllers: [MuseumsController, MuseumMaintenanceController],
  providers: [MuseumsService, MuseumMaintenanceService],
  exports: [MuseumsService, MuseumMaintenanceService],
})
export class MuseumsModule {}



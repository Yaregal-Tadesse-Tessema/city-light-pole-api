import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiverSideProject } from './entities/river-side-project.entity';
import { RiverSideProjectsService } from './river-side-projects.service';
import { RiverSideProjectsController } from './river-side-projects.controller';
import { RiverSideProjectIssue } from '../issues/entities/river-side-project-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
import { RiverSideProjectMaintenance } from './entities/river-side-project-maintenance.entity';
import { RiverSideProjectMaintenanceService } from './river-side-project-maintenance.service';
import { RiverSideProjectMaintenanceController } from './river-side-project-maintenance.controller';
import { MaintenanceAttachment } from '../maintenance/entities/maintenance-attachment.entity';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RiverSideProject,
      RiverSideProjectIssue,
      MaintenanceSchedule,
      RiverSideProjectMaintenance,
      MaintenanceAttachment,
    ]),
    forwardRef(() => IssuesModule),
  ],
  controllers: [RiverSideProjectsController, RiverSideProjectMaintenanceController],
  providers: [RiverSideProjectsService, RiverSideProjectMaintenanceService],
  exports: [RiverSideProjectsService, RiverSideProjectMaintenanceService],
})
export class RiverSideProjectsModule {}



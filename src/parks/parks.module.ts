import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParksService } from './parks.service';
import { ParksController } from './parks.controller';
import { PublicPark } from './entities/public-park.entity';
import { ParkIssue } from '../issues/entities/park-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
import { ParkMaintenance } from './entities/park-maintenance.entity';
import { ParkMaintenanceService } from './park-maintenance.service';
import { ParkMaintenanceController } from './park-maintenance.controller';
import { MaintenanceAttachment } from '../maintenance/entities/maintenance-attachment.entity';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PublicPark, ParkIssue, MaintenanceSchedule, ParkMaintenance, MaintenanceAttachment]),
    forwardRef(() => IssuesModule),
  ],
  controllers: [ParksController, ParkMaintenanceController],
  providers: [ParksService, ParkMaintenanceService],
  exports: [ParksService, ParkMaintenanceService],
})
export class ParksModule {}



import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingLotsController } from './parking-lots.controller';
import { ParkingLotsService } from './parking-lots.service';
import { ParkingLot } from './entities/parking-lot.entity';
import { ParkingLotIssue } from '../issues/entities/parking-lot-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
import { ParkingLotMaintenance } from './entities/parking-lot-maintenance.entity';
import { ParkingLotMaintenanceService } from './parking-lot-maintenance.service';
import { ParkingLotMaintenanceController } from './parking-lot-maintenance.controller';
import { MaintenanceAttachment } from '../maintenance/entities/maintenance-attachment.entity';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParkingLot,
      ParkingLotIssue,
      MaintenanceSchedule,
      ParkingLotMaintenance,
      MaintenanceAttachment,
    ]),
    forwardRef(() => IssuesModule),
  ],
  controllers: [ParkingLotsController, ParkingLotMaintenanceController],
  providers: [ParkingLotsService, ParkingLotMaintenanceService],
  exports: [ParkingLotsService, ParkingLotMaintenanceService],
})
export class ParkingLotsModule {}



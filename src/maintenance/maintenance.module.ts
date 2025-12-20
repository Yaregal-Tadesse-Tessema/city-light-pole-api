import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceSchedule } from './entities/maintenance-schedule.entity';
import { MaintenanceAttachment } from './entities/maintenance-attachment.entity';
import { PolesModule } from '../poles/poles.module';
import { ParksModule } from '../parks/parks.module';
import { ParkingLotsModule } from '../parking-lots/parking-lots.module';
import { MuseumsModule } from '../museums/museums.module';
import { PublicToiletsModule } from '../public-toilets/public-toilets.module';
import { FootballFieldsModule } from '../football-fields/football-fields.module';
import { RiverSideProjectsModule } from '../river-side-projects/river-side-projects.module';
import { IssuesModule } from '../issues/issues.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MaintenanceSchedule,
      MaintenanceAttachment,
    ]),
    PolesModule,
    ParksModule,
    ParkingLotsModule,
    MuseumsModule,
    PublicToiletsModule,
    FootballFieldsModule,
    RiverSideProjectsModule,
    forwardRef(() => IssuesModule),
    NotificationsModule,
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}



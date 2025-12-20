import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { LightPole } from '../poles/entities/light-pole.entity';
import { PoleIssue } from '../issues/entities/pole-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
import { PublicPark } from '../parks/entities/public-park.entity';
import { ParkingLot } from '../parking-lots/entities/parking-lot.entity';
import { Museum } from '../museums/entities/museum.entity';
import { PublicToilet } from '../public-toilets/entities/public-toilet.entity';
import { FootballField } from '../football-fields/entities/football-field.entity';
import { RiverSideProject } from '../river-side-projects/entities/river-side-project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LightPole,
      PoleIssue,
      MaintenanceSchedule,
      PublicPark,
      ParkingLot,
      Museum,
      PublicToilet,
      FootballField,
      RiverSideProject,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}




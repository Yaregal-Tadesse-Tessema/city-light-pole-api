import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicToiletsController } from './public-toilets.controller';
import { PublicToiletsService } from './public-toilets.service';
import { PublicToilet } from './entities/public-toilet.entity';
import { PublicToiletIssue } from '../issues/entities/public-toilet-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
import { PublicToiletMaintenance } from './entities/public-toilet-maintenance.entity';
import { PublicToiletMaintenanceService } from './public-toilet-maintenance.service';
import { PublicToiletMaintenanceController } from './public-toilet-maintenance.controller';
import { MaintenanceAttachment } from '../maintenance/entities/maintenance-attachment.entity';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PublicToilet,
      PublicToiletIssue,
      MaintenanceSchedule,
      PublicToiletMaintenance,
      MaintenanceAttachment,
    ]),
    forwardRef(() => IssuesModule),
  ],
  controllers: [PublicToiletsController, PublicToiletMaintenanceController],
  providers: [PublicToiletsService, PublicToiletMaintenanceService],
  exports: [PublicToiletsService, PublicToiletMaintenanceService],
})
export class PublicToiletsModule {}



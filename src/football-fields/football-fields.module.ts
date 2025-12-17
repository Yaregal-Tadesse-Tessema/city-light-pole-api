import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FootballFieldsController } from './football-fields.controller';
import { FootballFieldsService } from './football-fields.service';
import { FootballField } from './entities/football-field.entity';
import { FootballFieldIssue } from '../issues/entities/football-field-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
import { FootballFieldMaintenance } from './entities/football-field-maintenance.entity';
import { FootballFieldMaintenanceService } from './football-field-maintenance.service';
import { FootballFieldMaintenanceController } from './football-field-maintenance.controller';
import { MaintenanceAttachment } from '../maintenance/entities/maintenance-attachment.entity';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FootballField,
      FootballFieldIssue,
      MaintenanceSchedule,
      FootballFieldMaintenance,
      MaintenanceAttachment,
    ]),
    forwardRef(() => IssuesModule),
  ],
  controllers: [FootballFieldsController, FootballFieldMaintenanceController],
  providers: [FootballFieldsService, FootballFieldMaintenanceService],
  exports: [FootballFieldsService, FootballFieldMaintenanceService],
})
export class FootballFieldsModule {}



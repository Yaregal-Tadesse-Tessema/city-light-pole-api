import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceSchedule } from './entities/maintenance-schedule.entity';
import { MaintenanceLog } from './entities/maintenance-log.entity';
import { MaintenanceAttachment } from './entities/maintenance-attachment.entity';
import { PolesModule } from '../poles/poles.module';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MaintenanceSchedule,
      MaintenanceLog,
      MaintenanceAttachment,
    ]),
    PolesModule,
    forwardRef(() => IssuesModule),
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}



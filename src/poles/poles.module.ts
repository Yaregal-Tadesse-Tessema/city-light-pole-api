import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolesService } from './poles.service';
import { PolesController } from './poles.controller';
import { LightPole } from './entities/light-pole.entity';
import { PoleIssue } from '../issues/entities/pole-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([LightPole, PoleIssue, MaintenanceSchedule]),
  ],
  
  controllers: [PolesController],
  providers: [PolesService],
  exports: [PolesService],
})
export class PolesModule {}

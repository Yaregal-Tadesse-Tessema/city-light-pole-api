import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolesService } from './poles.service';
import { PolesController } from './poles.controller';
import { LightPole } from './entities/light-pole.entity';
import { PoleIssue } from '../issues/entities/pole-issue.entity';
import { MaintenanceLog } from '../maintenance/entities/maintenance-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LightPole, PoleIssue, MaintenanceLog]),
  ],
  controllers: [PolesController],
  providers: [PolesService],
  exports: [PolesService],
})
export class PolesModule {}



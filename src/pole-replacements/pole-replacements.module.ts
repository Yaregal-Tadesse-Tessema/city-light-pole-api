import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoleReplacementsService } from './pole-replacements.service';
import { PoleReplacementsController } from './pole-replacements.controller';
import { PoleReplacement } from './entities/pole-replacement.entity';
import { LightPole } from '../poles/entities/light-pole.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PoleReplacement, LightPole])],
  controllers: [PoleReplacementsController],
  providers: [PoleReplacementsService],
  exports: [PoleReplacementsService],
})
export class PoleReplacementsModule {}

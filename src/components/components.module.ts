import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComponentsService } from './components.service';
import { ComponentsController } from './components.controller';
import { PoleComponentsService } from './pole-components.service';
import { PoleComponentsController } from './pole-components.controller';
import { Component } from './entities/component.entity';
import { PoleComponent } from './entities/pole-component.entity';
import { LightPole } from '../poles/entities/light-pole.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Component, PoleComponent, LightPole]),
  ],
  controllers: [ComponentsController, PoleComponentsController],
  providers: [ComponentsService, PoleComponentsService],
  exports: [ComponentsService, PoleComponentsService],
})
export class ComponentsModule {}

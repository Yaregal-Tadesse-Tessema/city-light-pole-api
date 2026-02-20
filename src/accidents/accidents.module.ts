import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AccidentsService } from './accidents.service';
import { AccidentsController } from './accidents.controller';
import { PublicAccidentsController } from './public-accidents.controller';
import { DamagedComponentsController } from './damaged-components.controller';
import { Accident } from './entities/accident.entity';
import { AccidentPhoto } from './entities/accident-photo.entity';
import { AccidentAttachment } from './entities/accident-attachment.entity';
import { AccidentApproval } from './entities/accident-approval.entity';
import { DamagedComponent } from './entities/damaged-component.entity';
import { DamagedComponentsService } from './damaged-components.service';
import { PolesModule } from '../poles/poles.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
         TypeOrmModule.forFeature([
             Accident,
             AccidentPhoto,
             AccidentAttachment,
             AccidentApproval,
             DamagedComponent,
           ]),
    PolesModule,
    FileModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [AccidentsController, PublicAccidentsController, DamagedComponentsController],
         providers: [AccidentsService, DamagedComponentsService],
  exports: [AccidentsService],
})
export class AccidentsModule {}

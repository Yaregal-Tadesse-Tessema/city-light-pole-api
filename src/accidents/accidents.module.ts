import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AccidentsService } from './accidents.service';
import { AccidentsController } from './accidents.controller';
import { Accident } from './entities/accident.entity';
import { AccidentPhoto } from './entities/accident-photo.entity';
import { AccidentAttachment } from './entities/accident-attachment.entity';
import { AccidentApproval } from './entities/accident-approval.entity';
import { DamagedComponent } from './entities/damaged-component.entity';
import { PolesModule } from '../poles/poles.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Accident,
      AccidentPhoto,
      AccidentAttachment,
      AccidentApproval,
    ]),
    PolesModule,
    FileModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [AccidentsController],
  providers: [AccidentsService],
  exports: [AccidentsService],
})
export class AccidentsModule {}

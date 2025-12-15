import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { LogStatus } from '../entities/maintenance-log.entity';

export class CreateLogDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  scheduleId?: string;

  @ApiProperty()
  @IsString()
  poleCode: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: LogStatus, default: LogStatus.REQUESTED })
  @IsEnum(LogStatus)
  @IsOptional()
  status?: LogStatus;

  @ApiProperty()
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}



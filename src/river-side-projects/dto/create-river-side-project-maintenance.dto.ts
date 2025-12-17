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
import { Type } from 'class-transformer';
import { ScheduleFrequency, ScheduleStatus } from '../../maintenance/enums/maintenance.enums';

export class CreateRiverSideProjectMaintenanceDto {
  @ApiProperty()
  @IsString()
  riverSideProjectCode: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  issueId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ enum: ScheduleFrequency, default: ScheduleFrequency.MONTHLY })
  @IsEnum(ScheduleFrequency)
  frequency: ScheduleFrequency;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ enum: ScheduleStatus, default: ScheduleStatus.REQUESTED })
  @IsEnum(ScheduleStatus)
  @IsOptional()
  status?: ScheduleStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  estimatedCost?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}


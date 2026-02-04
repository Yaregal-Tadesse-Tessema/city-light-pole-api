import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, IsDateString, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ComponentStatus } from '../enums/component.enums';

export class UpdatePoleComponentStatusDto {
  @ApiPropertyOptional({ enum: ComponentStatus })
  @IsOptional()
  @IsEnum(ComponentStatus)
  status?: ComponentStatus;

  @ApiPropertyOptional({ description: 'Date when component was removed' })
  @IsOptional()
  @IsDateString()
  removedDate?: string;

  @ApiPropertyOptional({ description: 'Quantity (for partial removal)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

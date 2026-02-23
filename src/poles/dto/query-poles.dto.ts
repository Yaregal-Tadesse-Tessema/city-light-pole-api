import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  PoleStatus,
  Subcity,
  PolePosition,
  PoleCondition,
  District,
} from '../entities/light-pole.entity';

export class QueryPolesDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ enum: Subcity, required: false })
  @IsOptional()
  @IsEnum(Subcity)
  subcity?: Subcity;

  @ApiProperty({ enum: PoleStatus, required: false })
  @IsOptional()
  @IsEnum(PoleStatus)
  status?: PoleStatus;

  @ApiProperty({ enum: PolePosition, required: false })
  @IsOptional()
  @IsEnum(PolePosition)
  polePosition?: PolePosition;

  @ApiProperty({ enum: PoleCondition, required: false })
  @IsOptional()
  @IsEnum(PoleCondition)
  condition?: PoleCondition;

  @ApiProperty({ enum: District, required: false })
  @IsOptional()
  @IsEnum(District)
  district?: District;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  localAreaName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  localAreaNameAm?: string;

  @ApiProperty({
    required: false,
    enum: ['subcity', 'street', 'localAreaName', 'localAreaNameAm', 'polePosition', 'condition', 'district'],
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'subcity' | 'street' | 'localAreaName' | 'localAreaNameAm';

  @ApiProperty({ required: false, enum: ['asc', 'desc'], description: 'Sort direction' })
  @IsOptional()
  @IsString()
  sortDirection?: 'asc' | 'desc';
}



import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ParkStatus, Subcity } from '../entities/public-park.entity';

export class QueryParksDto {
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
  district?: Subcity;

  @ApiProperty({ enum: ParkStatus, required: false })
  @IsOptional()
  @IsEnum(ParkStatus)
  status?: ParkStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
}


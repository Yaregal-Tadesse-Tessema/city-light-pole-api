import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { MuseumStatus } from '../entities/museum.entity';

export class CreateMuseumDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  district: string;

  @ApiProperty()
  @IsString()
  street: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gpsLat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gpsLng?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  museumType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: MuseumStatus, default: MuseumStatus.ACTIVE })
  @IsOptional()
  @IsEnum(MuseumStatus)
  status?: MuseumStatus;
}



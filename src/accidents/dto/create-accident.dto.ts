import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccidentType } from '../enums/accident.enums';

export class CreateAccidentDto {
  @ApiProperty({ enum: AccidentType })
  @IsEnum(AccidentType)
  accidentType: AccidentType;

  @ApiProperty()
  @IsDateString()
  accidentDate: string;

  @ApiProperty()
  @IsString()
  accidentTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehiclePlateNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  insuranceCompany?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  claimReferenceNumber?: string;
}


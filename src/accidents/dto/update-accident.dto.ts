import { ApiPropertyOptional } from '@nestjs/swagger';
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
import {
  AccidentType,
  DamageLevel,
  AccidentStatus,
  ClaimStatus
} from '../enums/accident.enums';

export class UpdateAccidentDto {
  @ApiPropertyOptional({ enum: AccidentType })
  @IsOptional()
  @IsEnum(AccidentType)
  accidentType?: AccidentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  accidentDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accidentTime?: string;

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

  @ApiPropertyOptional({ enum: ClaimStatus })
  @IsOptional()
  @IsEnum(ClaimStatus)
  claimStatus?: ClaimStatus;

  @ApiPropertyOptional({ enum: DamageLevel })
  @IsOptional()
  @IsEnum(DamageLevel)
  damageLevel?: DamageLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  damageDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  safetyRisk?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Object)
  costBreakdown?: {
    pole: number;
    luminaire: number;
    armBracket: number;
    foundation: number;
    cable: number;
    labor: number;
    transport: number;
    total: number;
  };
}

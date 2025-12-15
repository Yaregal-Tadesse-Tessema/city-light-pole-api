import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { PoleType, LampType, PoleStatus } from '../entities/light-pole.entity';

export class CreatePoleDto {
  @ApiProperty({ example: 'LP-001', description: 'Unique pole code' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Downtown', description: 'District name' })
  @IsString()
  district: string;

  @ApiProperty({ example: 'Main Street', description: 'Street name' })
  @IsString()
  street: string;

  @ApiProperty({ example: 9.012345, required: false, description: 'GPS Latitude (-90 to 90)' })
  @IsOptional()
  @ValidateIf((o) => o.gpsLat !== undefined && o.gpsLat !== null)
  @IsNumber()
  @Min(-90)
  @Max(90)
  gpsLat?: number;

  @ApiProperty({ example: 38.765432, required: false, description: 'GPS Longitude (-180 to 180)' })
  @IsOptional()
  @ValidateIf((o) => o.gpsLng !== undefined && o.gpsLng !== null)
  @IsNumber()
  @Min(-180)
  @Max(180)
  gpsLng?: number;

  @ApiProperty({ enum: PoleType, default: PoleType.STANDARD, required: false })
  @IsEnum(PoleType)
  @IsOptional()
  poleType?: PoleType;

  @ApiProperty({ example: 8.5, description: 'Height in meters' })
  @IsNumber()
  @Min(0)
  heightMeters: number;

  @ApiProperty({ enum: LampType, default: LampType.LED, required: false })
  @IsEnum(LampType)
  @IsOptional()
  lampType?: LampType;

  @ApiProperty({ example: 150, description: 'Power rating in watts' })
  @IsNumber()
  @Min(0)
  powerRatingWatt: number;

  @ApiProperty({ example: false, default: false, required: false })
  @IsBoolean()
  @IsOptional()
  hasLedDisplay?: boolean;

  @ApiProperty({ example: 'LED-3000', required: false, description: 'Required if hasLedDisplay is true' })
  @ValidateIf((o) => o.hasLedDisplay === true)
  @IsString()
  ledModel?: string;

  @ApiProperty({ enum: PoleStatus, default: PoleStatus.ACTIVE, required: false })
  @IsEnum(PoleStatus)
  @IsOptional()
  status?: PoleStatus;
}



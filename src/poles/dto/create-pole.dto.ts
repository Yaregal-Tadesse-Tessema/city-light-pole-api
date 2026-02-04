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
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PoleType,
  LampType,
  PoleStatus,
  Subcity,
  Structure,
  PolePosition,
  PoleCondition,
  District,
} from '../entities/light-pole.entity';

export class CreatePoleDto {
  @ApiProperty({ example: 'LP-001', description: 'Unique pole code' })
  @IsString()
  code: string;

  @ApiProperty({ enum: Subcity, example: Subcity.BOLE, description: 'Subcity name' })
  @IsEnum(Subcity)
  subcity: Subcity;

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

  @ApiProperty({ enum: Structure, default: Structure.Steel, required: false })
  @IsEnum(Structure)
  @IsOptional()
  structure?: Structure;

  @ApiProperty({ example: 8.5, description: 'Height in meters' })
  @IsOptional()
  heightMeters?: number;

  @ApiProperty({ enum: LampType, default: LampType.LED, required: false })
  @IsEnum(LampType)
  @IsOptional()
  lampType?: LampType;

  @ApiProperty({ example: 150, description: 'Power rating in watts' })
  @IsNumber()
  @Min(0)
  powerRatingWatt: number;

  @ApiProperty({ example: 1, required: false, description: 'Number of poles' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  numberOfPoles?: number;

  @ApiProperty({ example: '2024-01-15', required: false, description: 'Pole installation date' })
  @IsOptional()
  @IsDateString()
  poleInstallationDate?: string;

  @ApiProperty({ enum: PoleStatus, default: PoleStatus.OPERATIONAL, required: false })
  @IsEnum(PoleStatus)
  @IsOptional()
  status?: PoleStatus;

  @ApiProperty({ enum: PolePosition, default: PolePosition.Up, required: false })
  @IsEnum(PolePosition)
  @IsOptional()
  polePosition?: PolePosition;

  @ApiProperty({ enum: PoleCondition, default: PoleCondition.GOOD, required: false })
  @IsEnum(PoleCondition)
  @IsOptional()
  condition?: PoleCondition;

  @ApiProperty({ enum: District, default: District.Center, required: false })
  @IsEnum(District)
  @IsOptional()
  district?: District;
}



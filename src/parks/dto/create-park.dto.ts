import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ParkType, ParkStatus, Subcity } from '../entities/public-park.entity';

export class CreateParkDto {
  @ApiProperty({ example: 'PK-001', description: 'Unique park code' })
  @IsString()
  code: string;

  @ApiProperty({ enum: Subcity, example: Subcity.BOLE, description: 'Subcity name' })
  @IsEnum(Subcity)
  district: Subcity;

  @ApiProperty({ example: 'Main Street', description: 'Street name' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'Central Park', description: 'Park name' })
  @IsString()
  name: string;

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

  @ApiProperty({ enum: ParkType, default: ParkType.COMMUNITY, required: false })
  @IsEnum(ParkType)
  @IsOptional()
  parkType?: ParkType;

  @ApiProperty({ example: 5.5, description: 'Area in hectares' })
  @IsNumber()
  @Min(0)
  areaHectares: number;

  @ApiProperty({ example: false, default: false, required: false })
  @IsBoolean()
  @IsOptional()
  hasPaidEntrance?: boolean;

  @ApiProperty({ example: 50.00, required: false, description: 'Entrance fee (required if hasPaidEntrance is true)' })
  @IsOptional()
  @ValidateIf((o) => o.hasPaidEntrance === true)
  @IsNumber()
  @Min(0)
  entranceFee?: number;

  @ApiProperty({ example: 'Beautiful community park', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ParkStatus, default: ParkStatus.ACTIVE, required: false })
  @IsEnum(ParkStatus)
  @IsOptional()
  status?: ParkStatus;
}


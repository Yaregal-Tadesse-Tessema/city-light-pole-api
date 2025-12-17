import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { RiverSideProjectStatus } from '../entities/river-side-project.entity';

export class CreateRiverSideProjectDto {
  @ApiProperty({ example: 'RV-001' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'River Walkway Project' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Bole' })
  @IsString()
  district: string;

  @ApiProperty({ example: 'Main Street' })
  @IsString()
  street: string;

  @ApiPropertyOptional({ example: 9.03 })
  @IsOptional()
  @IsNumber()
  gpsLat?: number;

  @ApiPropertyOptional({ example: 38.74 })
  @IsOptional()
  @IsNumber()
  gpsLng?: number;

  @ApiPropertyOptional({ example: 'WALKWAY' })
  @IsOptional()
  @IsString()
  projectType?: string;

  @ApiPropertyOptional({ example: 'Riverfront development walkway' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RiverSideProjectStatus, default: RiverSideProjectStatus.ACTIVE })
  @IsOptional()
  @IsEnum(RiverSideProjectStatus)
  status?: RiverSideProjectStatus;
}



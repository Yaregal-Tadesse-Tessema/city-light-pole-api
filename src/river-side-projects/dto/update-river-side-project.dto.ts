import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { RiverSideProjectStatus } from '../entities/river-side-project.entity';

export class UpdateRiverSideProjectDto {
  @ApiPropertyOptional({ example: 'RV-001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'River Walkway Project' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Bole' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'Main Street' })
  @IsOptional()
  @IsString()
  street?: string;

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

  @ApiPropertyOptional({ enum: RiverSideProjectStatus })
  @IsOptional()
  @IsEnum(RiverSideProjectStatus)
  status?: RiverSideProjectStatus;
}



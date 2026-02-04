import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
  Min,
  Max,
  ValidateIf,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ComponentType } from '../enums/component.enums';

export class CreateComponentDto {
  @ApiProperty({ example: 'LED Street Light Bulb' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ enum: ComponentType, default: ComponentType.OTHER })
  @IsEnum(ComponentType)
  @IsOptional()
  type?: ComponentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  partNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  // Manufacturer
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  manufacturerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  manufacturerContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturerAddress?: string;

  @ApiPropertyOptional({ description: 'Country of origin (e.g., Germany, China, USA)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturerCountry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  manufacturerWarranty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  manufacturerWebsite?: string;

  // Identification
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  qrCode?: string;

  // Specifications
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  manufactureDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  lifespanMonths?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  powerUsageWatt?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  voltage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  current?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  dimensionsLength?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  dimensionsWidth?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  dimensionsHeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  operatingTempMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  operatingTempMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ipRating?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certifications?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  compatibilityNotes?: string;

  // Supplier
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplierName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplierContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierAddress?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

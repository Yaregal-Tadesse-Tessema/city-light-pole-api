import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, Min, IsUUID } from 'class-validator';
import { UnitOfMeasure } from '../entities/inventory-item.entity';

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'INV-001', description: 'Unique inventory item code' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'LED Bulb 50W', description: 'Item name' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, description: 'Item description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-here', description: 'Category ID' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ enum: UnitOfMeasure, default: UnitOfMeasure.PIECES })
  @IsEnum(UnitOfMeasure)
  @IsOptional()
  unitOfMeasure?: UnitOfMeasure;

  @ApiProperty({ example: 100, default: 0, description: 'Initial stock quantity' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentStock?: number;

  @ApiProperty({ example: 10, default: 0, description: 'Minimum threshold for reorder' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumThreshold?: number;

  @ApiProperty({ example: 25.50, required: false, description: 'Unit cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiProperty({ required: false, description: 'Supplier name' })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiProperty({ required: false, description: 'Supplier contact information' })
  @IsOptional()
  @IsString()
  supplierContact?: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}



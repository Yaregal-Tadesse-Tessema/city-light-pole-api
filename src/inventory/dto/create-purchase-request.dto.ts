import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseRequestItemDto {
  @ApiProperty({ example: 'INV-001', description: 'Inventory item code' })
  @IsString()
  itemCode: string;

  @ApiProperty({ example: 10, description: 'Quantity to purchase' })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ example: 25.50, description: 'Unit cost' })
  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class CreatePurchaseRequestDto {
  @ApiProperty({ required: false, description: 'Material request ID if created from material request' })
  @IsOptional()
  @IsString()
  materialRequestId?: string;

  @ApiProperty({ type: [PurchaseRequestItemDto], description: 'List of items to purchase' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseRequestItemDto)
  items: PurchaseRequestItemDto[];

  @ApiProperty({ required: false, description: 'Supplier name' })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiProperty({ required: false, description: 'Supplier contact' })
  @IsOptional()
  @IsString()
  supplierContact?: string;

  @ApiProperty({ required: false, description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}



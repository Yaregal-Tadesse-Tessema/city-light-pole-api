import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ItemQuantityDto {
  @ApiProperty({ example: 'INV-001', description: 'Inventory item code' })
  @IsString()
  itemCode: string;

  @ApiProperty({ example: 5, description: 'Required quantity' })
  @IsNumber()
  @Min(0.01)
  quantity: number;
}

export class CheckAvailabilityDto {
  @ApiProperty({ type: [ItemQuantityDto], description: 'List of items and quantities to check' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemQuantityDto)
  items: ItemQuantityDto[];
}



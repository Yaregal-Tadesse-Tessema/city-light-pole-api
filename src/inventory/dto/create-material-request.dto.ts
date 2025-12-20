import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MaterialRequestItemDto {
  @ApiProperty({ example: 'INV-001', description: 'Inventory item code' })
  @IsString()
  itemCode: string;

  @ApiProperty({ example: 5, description: 'Requested quantity' })
  @IsNumber()
  @Min(0.01)
  quantity: number;
}

export class CreateMaterialRequestDto {
  @ApiProperty({ description: 'Maintenance schedule ID' })
  @IsString()
  maintenanceScheduleId: string;

  @ApiProperty({ type: [MaterialRequestItemDto], description: 'List of items needed' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialRequestItemDto)
  items: MaterialRequestItemDto[];

  @ApiProperty({ required: false, description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}



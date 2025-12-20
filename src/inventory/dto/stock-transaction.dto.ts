import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { TransactionType } from '../entities/inventory-transaction.entity';

export class StockTransactionDto {
  @ApiProperty({ example: 'INV-001', description: 'Inventory item code' })
  @IsString()
  itemCode: string;

  @ApiProperty({ example: 10, description: 'Quantity to add or remove' })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ enum: TransactionType, description: 'Transaction type' })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ required: false, description: 'Reference (e.g., maintenance schedule ID)' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ required: false, description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}



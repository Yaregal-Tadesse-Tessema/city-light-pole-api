import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReceivePurchaseRequestDto {
  @ApiProperty({ required: false, description: 'Additional notes about the receipt' })
  @IsOptional()
  @IsString()
  notes?: string;
}



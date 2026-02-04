import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReceivePurchaseRequestDto {
  @ApiProperty({ required: false, description: 'Additional notes about the receipt' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: 'Goods Received Note code' })
  @IsOptional()
  @IsString()
  grnCode?: string;
}

export class DeliverPurchaseRequestDto {
  @ApiProperty({ required: false, description: 'Receiving code for delivery' })
  @IsOptional()
  @IsString()
  receivingCode?: string;
}



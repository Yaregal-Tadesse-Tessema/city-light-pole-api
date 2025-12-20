import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ApprovePurchaseRequestDto {
  @ApiProperty({ required: false, description: 'Rejection reason if rejecting' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiProperty({ default: true, description: 'True to approve, false to reject' })
  @IsBoolean()
  approve: boolean;
}



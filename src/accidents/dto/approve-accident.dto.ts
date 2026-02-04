import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApprovalAction } from '../enums/accident.enums';

export class ApproveAccidentDto {
  @ApiProperty({ enum: ApprovalAction })
  @IsEnum(ApprovalAction)
  action: ApprovalAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;
}


import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { IssueSeverity } from '../entities/parking-lot-issue.entity';

export class CreateParkingLotIssueDto {
  @ApiProperty()
  @IsString()
  parkingLotCode: string;

  @ApiProperty({ example: 'Parking lot lights are not working' })
  @IsString()
  description: string;

  @ApiProperty({ enum: IssueSeverity, default: IssueSeverity.MEDIUM })
  @IsEnum(IssueSeverity)
  @IsOptional()
  severity?: IssueSeverity;
}



import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { IssueSeverity } from '../entities/park-issue.entity';

export class CreateParkIssueDto {
  @ApiProperty()
  @IsString()
  parkCode: string;

  @ApiProperty({ example: 'Park facilities are damaged and need repair' })
  @IsString()
  description: string;

  @ApiProperty({ enum: IssueSeverity, default: IssueSeverity.MEDIUM })
  @IsEnum(IssueSeverity)
  @IsOptional()
  severity?: IssueSeverity;
}











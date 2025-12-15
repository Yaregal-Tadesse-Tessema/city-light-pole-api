import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { IssueSeverity } from '../entities/pole-issue.entity';

export class CreateIssueDto {
  @ApiProperty()
  @IsString()
  poleCode: string;

  @ApiProperty({ example: 'Light pole is damaged and needs repair' })
  @IsString()
  description: string;

  @ApiProperty({ enum: IssueSeverity, default: IssueSeverity.MEDIUM })
  @IsEnum(IssueSeverity)
  @IsOptional()
  severity?: IssueSeverity;
}



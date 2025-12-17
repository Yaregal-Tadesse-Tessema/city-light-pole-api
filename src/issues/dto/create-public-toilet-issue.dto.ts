import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { IssueSeverity } from '../entities/public-toilet-issue.entity';

export class CreatePublicToiletIssueDto {
  @ApiProperty()
  @IsString()
  publicToiletCode: string;

  @ApiProperty({ example: 'Public toilet requires cleaning and repairs' })
  @IsString()
  description: string;

  @ApiProperty({ enum: IssueSeverity, default: IssueSeverity.MEDIUM })
  @IsEnum(IssueSeverity)
  @IsOptional()
  severity?: IssueSeverity;
}



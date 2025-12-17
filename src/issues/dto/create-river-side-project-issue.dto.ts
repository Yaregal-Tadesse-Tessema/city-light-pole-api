import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { IssueSeverity } from '../entities/river-side-project-issue.entity';

export class CreateRiverSideProjectIssueDto {
  @ApiProperty({ example: 'RV-001' })
  @IsString()
  riverSideProjectCode: string;

  @ApiProperty({ example: 'Broken walkway section near bridge' })
  @IsString()
  description: string;

  @ApiProperty({ enum: IssueSeverity, default: IssueSeverity.MEDIUM })
  @IsEnum(IssueSeverity)
  severity: IssueSeverity;
}



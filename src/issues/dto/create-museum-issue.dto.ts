import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { IssueSeverity } from '../entities/museum-issue.entity';

export class CreateMuseumIssueDto {
  @ApiProperty()
  @IsString()
  museumCode: string;

  @ApiProperty({ example: 'Exhibit hall requires repairs' })
  @IsString()
  description: string;

  @ApiProperty({ enum: IssueSeverity, default: IssueSeverity.MEDIUM })
  @IsEnum(IssueSeverity)
  @IsOptional()
  severity?: IssueSeverity;
}



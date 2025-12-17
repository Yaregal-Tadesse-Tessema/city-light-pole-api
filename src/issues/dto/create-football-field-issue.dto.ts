import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { IssueSeverity } from '../entities/football-field-issue.entity';

export class CreateFootballFieldIssueDto {
  @ApiProperty()
  @IsString()
  footballFieldCode: string;

  @ApiProperty({ example: 'Field lighting is not operational' })
  @IsString()
  description: string;

  @ApiProperty({ enum: IssueSeverity, default: IssueSeverity.MEDIUM })
  @IsEnum(IssueSeverity)
  @IsOptional()
  severity?: IssueSeverity;
}



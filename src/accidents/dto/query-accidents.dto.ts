import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AccidentType, AccidentStatus, ClaimStatus } from '../enums/accident.enums';

export class QueryAccidentsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: AccidentType })
  @IsOptional()
  @IsEnum(AccidentType)
  accidentType?: AccidentType;

  @ApiPropertyOptional({ enum: AccidentStatus })
  @IsOptional()
  @IsEnum(AccidentStatus)
  status?: AccidentStatus;

  @ApiPropertyOptional({ enum: ClaimStatus })
  @IsOptional()
  @IsEnum(ClaimStatus)
  claimStatus?: ClaimStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

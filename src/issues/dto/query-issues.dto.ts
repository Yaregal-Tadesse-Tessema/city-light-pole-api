import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';

export class QueryIssuesDto {
  @ApiProperty({ required: false, default: 1, description: 'Page number' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10, description: 'Items per page' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ required: false, description: 'Search in description or pole code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: ['REPORTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Filter by severity' })
  @IsOptional()
  @IsString()
  severity?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString, IsDateString } from 'class-validator';

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

  @ApiProperty({ required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], description: 'Filter by severity' })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiProperty({ required: false, description: 'Filter by pole code' })
  @IsOptional()
  @IsString()
  poleCode?: string;

  @ApiProperty({ required: false, type: String, format: 'date-time', description: 'Filter by created date from (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  createdAtFrom?: string;

  @ApiProperty({ required: false, type: String, format: 'date-time', description: 'Filter by created date to (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  createdAtTo?: string;

  @ApiProperty({ required: false, type: String, format: 'date-time', description: 'Filter by updated date from (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  updatedAtFrom?: string;

  @ApiProperty({ required: false, type: String, format: 'date-time', description: 'Filter by updated date to (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  updatedAtTo?: string;

  @ApiProperty({ required: false, enum: ['poleCode', 'description', 'status', 'severity', 'reportedBy', 'createdAt', 'updatedAt'], description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';

export class QueryMaintenanceDto {
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
  @Max(10000)
  limit?: number = 10;

  @ApiProperty({ required: false, description: 'Filter by asset type (pole, park, parking, museum, toilet, football, river)' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false, description: 'Search in description or asset code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: ['REQUESTED', 'STARTED', 'PAUSED', 'COMPLETED'], description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ComponentType } from '../enums/component.enums';

export class QueryComponentsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ComponentType })
  @IsOptional()
  @IsEnum(ComponentType)
  type?: ComponentType;

  @ApiPropertyOptional({ description: 'Filter by manufacturer name' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Filter by manufacturer country' })
  @IsOptional()
  @IsString()
  manufacturerCountry?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by tag' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: 'Search by name, model, partNumber, SKU' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['name', 'type', 'manufacturerName', 'manufacturerCountry', 'createdAt'],
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'type' | 'manufacturerName' | 'manufacturerCountry' | 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'Sort direction' })
  @IsOptional()
  @IsString()
  sortDirection?: 'asc' | 'desc';
}

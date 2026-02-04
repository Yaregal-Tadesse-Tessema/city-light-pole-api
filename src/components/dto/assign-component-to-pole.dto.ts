import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignComponentToPoleDto {
  @ApiProperty({ description: 'Component ID to assign' })
  @IsUUID()
  componentId: string;

  @ApiProperty({ example: 1, description: 'Number of units to install (e.g., 1 camera, 6 bulbs)' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: '2024-01-15', description: 'Installation date' })
  @IsDateString()
  installationDate: string;

  @ApiPropertyOptional({ description: 'Installation notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

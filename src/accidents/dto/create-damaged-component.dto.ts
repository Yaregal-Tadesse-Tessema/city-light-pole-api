import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, Min, IsNotEmpty } from 'class-validator';
import { ComponentType } from '../entities/damaged-component.entity';

export class CreateDamagedComponentDto {
  @ApiProperty({ example: 'Light Pole', description: 'Name of the component' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Main support pole for street lighting', description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ComponentType, example: ComponentType.POLE, description: 'Type of component' })
  @IsEnum(ComponentType)
  componentType: ComponentType;

  @ApiProperty({ example: 500, description: 'Cost for minor damage' })
  @IsNumber()
  @Min(0)
  minorCost: number;

  @ApiProperty({ example: 1500, description: 'Cost for moderate damage' })
  @IsNumber()
  @Min(0)
  moderateCost: number;

  @ApiProperty({ example: 3000, description: 'Cost for severe damage' })
  @IsNumber()
  @Min(0)
  severeCost: number;

  @ApiProperty({ example: 5000, description: 'Cost for total loss' })
  @IsNumber()
  @Min(0)
  totalLossCost: number;

  @ApiPropertyOptional({ example: true, description: 'Whether the component is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Sort order for display', default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

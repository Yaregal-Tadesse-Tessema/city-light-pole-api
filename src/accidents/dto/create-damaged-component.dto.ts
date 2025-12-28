import { IsString, IsEnum, IsNumber, IsBoolean, IsOptional, Min, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComponentType } from '../entities/damaged-component.entity';

export class CreateDamagedComponentDto {
  @ApiProperty({
    description: 'Name of the damaged component',
    example: 'Luminaire'
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the component',
    example: 'Light fixture and housing'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Type of component',
    example: ComponentType.LUMINAIRE,
    enum: ComponentType
  })
  @IsEnum(ComponentType)
  componentType: ComponentType;

  @ApiProperty({
    description: 'Cost for minor damage',
    example: 200
  })
  @IsNumber()
  @IsPositive()
  minorCost: number;

  @ApiProperty({
    description: 'Cost for moderate damage',
    example: 400
  })
  @IsNumber()
  @IsPositive()
  moderateCost: number;

  @ApiProperty({
    description: 'Cost for severe damage',
    example: 600
  })
  @IsNumber()
  @IsPositive()
  severeCost: number;

  @ApiProperty({
    description: 'Cost for total loss',
    example: 800
  })
  @IsNumber()
  @IsPositive()
  totalLossCost: number;

  @ApiPropertyOptional({
    description: 'Whether this component is active and available for selection',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Order for displaying components in the UI',
    example: 1,
    default: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

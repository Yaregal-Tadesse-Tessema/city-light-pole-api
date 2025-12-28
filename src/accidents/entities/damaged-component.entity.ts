import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum ComponentType {
  POLE = 'POLE',
  LUMINAIRE = 'LUMINAIRE',
  ARM_BRACKET = 'ARM_BRACKET',
  FOUNDATION = 'FOUNDATION',
  CABLE = 'CABLE',
  OTHER = 'OTHER',
}

@Entity('damaged_components')
export class DamagedComponent {
  @ApiProperty({
    description: 'Unique identifier for the damaged component',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Name of the damaged component',
    example: 'Luminaire'
  })
  @Column({ unique: true })
  name: string;

  @ApiProperty({
    description: 'Description of the component',
    example: 'Light fixture and housing',
    required: false
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Type of component',
    example: ComponentType.LUMINAIRE,
    enum: ComponentType
  })
  @Column({
    type: 'enum',
    enum: ComponentType,
    enumName: 'component_type_enum',
    default: ComponentType.OTHER
  })
  componentType: ComponentType;

  @ApiProperty({
    description: 'Cost for minor damage',
    example: 200
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  minorCost: number;

  @ApiProperty({
    description: 'Cost for moderate damage',
    example: 400
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  moderateCost: number;

  @ApiProperty({
    description: 'Cost for severe damage',
    example: 600
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  severeCost: number;

  @ApiProperty({
    description: 'Cost for total loss',
    example: 800
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalLossCost: number;

  @ApiProperty({
    description: 'Whether this component is active and available for selection',
    example: true
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Order for displaying components in the UI',
    example: 1
  })
  @Column({ default: 0 })
  sortOrder: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-12-28T08:30:00Z'
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-12-28T08:30:00Z'
  })
  @UpdateDateColumn()
  updatedAt: Date;
}

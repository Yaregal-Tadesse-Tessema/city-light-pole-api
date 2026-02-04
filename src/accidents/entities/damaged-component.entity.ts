import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccidentsDamagedComponets } from './accidents-damaged-componets.entity';

export enum ComponentType {
  POLE = 'POLE',
  LUMINAIRE = 'LUMINAIRE',
  ARM_BRACKET = 'ARM_BRACKET',
  FOUNDATION = 'FOUNDATION',
  CABLE = 'CABLE',
  OTHER = 'OTHER',
}

export enum DamageLevel {
  MINOR = 'MINOR',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  TOTAL_LOSS = 'TOTAL_LOSS',
}

@Entity('damaged_components')
export class DamagedComponent {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: ComponentType,
    default: ComponentType.OTHER,
  })
  componentType: ComponentType;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  minorCost: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  moderateCost: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  severeCost: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalLossCost: number;

  @ApiProperty()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => AccidentsDamagedComponets, (adc) => adc.damagedComponent, { cascade: true, onDelete: 'CASCADE' })
  accidentsDamagedComponets: AccidentsDamagedComponets[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComponentType } from '../enums/component.enums';
import { PoleComponent } from './pole-component.entity';

@Entity('components')
export class Component {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Basic Information
  @ApiProperty({ example: 'LED Street Light Bulb' })
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @ApiProperty({ enum: ComponentType, example: ComponentType.BULB })
  @Column({
    type: 'enum',
    enum: ComponentType,
    default: ComponentType.OTHER,
  })
  type: ComponentType;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  @ApiPropertyOptional({ description: 'Manufacturer part number' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  partNumber: string | null;

  @ApiPropertyOptional({ description: 'Stock keeping unit' })
  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  sku: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Manufacturer Information
  @ApiPropertyOptional()
  @Column({ type: 'varchar', length: 200, nullable: true })
  manufacturerName: string | null;

  @ApiPropertyOptional({ description: 'Phone/email' })
  @Column({ type: 'varchar', length: 200, nullable: true })
  manufacturerContact: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  manufacturerAddress: string | null;

  @ApiPropertyOptional({ description: 'Country of origin (e.g., Germany, China, USA)' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturerCountry: string | null;

  @ApiPropertyOptional({ description: 'Warranty period/terms' })
  @Column({ type: 'varchar', length: 200, nullable: true })
  manufacturerWarranty: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturerWebsite: string | null;

  // Identification & Tracking
  @ApiPropertyOptional()
  @Column({ type: 'varchar', length: 100, nullable: true })
  serialNumber: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  barcode: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  qrCode: string | null;

  // Specifications
  @ApiPropertyOptional()
  @Column({ type: 'date', nullable: true })
  manufactureDate: Date | null;

  @ApiPropertyOptional({ description: 'Expected lifespan in months' })
  @Column({ type: 'int', nullable: true })
  lifespanMonths: number | null;

  @ApiPropertyOptional({ description: 'Power consumption in watts' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  powerUsageWatt: number | null;

  @ApiPropertyOptional({ description: 'Operating voltage (V)' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  voltage: number | null;

  @ApiPropertyOptional({ description: 'Operating current (A)' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  current: number | null;

  @ApiPropertyOptional({ description: 'Length in cm' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  dimensionsLength: number | null;

  @ApiPropertyOptional({ description: 'Width in cm' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  dimensionsWidth: number | null;

  @ApiPropertyOptional({ description: 'Height in cm' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  dimensionsHeight: number | null;

  @ApiPropertyOptional({ description: 'Weight in kg' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number | null;

  @ApiPropertyOptional({ description: 'Minimum operating temperature (°C)' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  operatingTempMin: number | null;

  @ApiPropertyOptional({ description: 'Maximum operating temperature (°C)' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  operatingTempMax: number | null;

  @ApiPropertyOptional({ description: 'IP rating (e.g., IP65, IP67)' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ipRating: string | null;

  @ApiPropertyOptional({ description: 'Comma-separated certifications (CE, UL, etc.)' })
  @Column({ type: 'text', nullable: true })
  certifications: string | null;

  @ApiPropertyOptional({ description: 'Compatibility information' })
  @Column({ type: 'text', nullable: true })
  compatibilityNotes: string | null;

  // Supplier Information
  @ApiPropertyOptional()
  @Column({ type: 'varchar', length: 200, nullable: true })
  supplierName: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', length: 200, nullable: true })
  supplierContact: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  supplierAddress: string | null;

  // Status & Metadata
  @ApiProperty({ default: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Tags for categorization/search', type: [String] })
  @Column('simple-array', { nullable: true })
  tags: string[] | null;

  @OneToMany(() => PoleComponent, (pc) => pc.component)
  poleComponents: PoleComponent[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}

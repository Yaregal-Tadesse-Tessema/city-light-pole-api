import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LightPole } from '../../poles/entities/light-pole.entity';
import { Component } from './component.entity';
import { User } from '../../users/entities/user.entity';
import { ComponentStatus } from '../enums/component.enums';

@Entity('pole_components')
export class PoleComponent {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Light pole code' })
  @Column({ type: 'varchar', length: 50 })
  poleId: string;

  @ApiProperty({ description: 'Component ID' })
  @Column('uuid')
  componentId: string;

  @ApiProperty({ example: 1, description: 'Number of units installed (e.g., 1 camera, 6 bulbs)' })
  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ApiProperty({ description: 'Installation date' })
  @Column({ type: 'date' })
  installationDate: Date;

  @ApiPropertyOptional({ description: 'User who installed it' })
  @Column('uuid', { nullable: true })
  installedById: string | null;

  @ApiProperty({ enum: ComponentStatus, default: ComponentStatus.INSTALLED })
  @Column({
    type: 'enum',
    enum: ComponentStatus,
    default: ComponentStatus.INSTALLED,
  })
  status: ComponentStatus;

  @ApiPropertyOptional({ description: 'Date when component was removed' })
  @Column({ type: 'date', nullable: true })
  removedDate: Date | null;

  @ApiPropertyOptional({ description: 'User who removed it' })
  @Column('uuid', { nullable: true })
  removedById: string | null;

  @ApiPropertyOptional({ description: 'Installation notes, issues, etc.' })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => LightPole, (pole) => pole.poleComponents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poleId', referencedColumnName: 'code' })
  pole: LightPole;

  @ManyToOne(() => Component, (component) => component.poleComponents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'componentId' })
  component: Component;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'installedById' })
  installedBy: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'removedById' })
  removedBy: User | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}

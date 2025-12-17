import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PoleIssue } from '../../issues/entities/pole-issue.entity';

export enum PoleStatus {
  ACTIVE = 'ACTIVE',
  FAULT_DAMAGED = 'FAULT_DAMAGED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  OPERATIONAL = 'OPERATIONAL',
}

export enum PoleType {
  STANDARD = 'STANDARD',
  DECORATIVE = 'DECORATIVE',
  HIGH_MAST = 'HIGH_MAST',
}

export enum LampType {
  LED = 'LED',
  FLUORESCENT = 'FLUORESCENT',
  SODIUM = 'SODIUM',
  HALOGEN = 'HALOGEN',
}

export enum Subcity {
  ADDIS_KETEMA = 'Addis Ketema',
  AKAKY_KALITI = 'Akaky Kaliti',
  ARADA = 'Arada',
  BOLE = 'Bole',
  GULLELE = 'Gullele',
  KIRKOS = 'Kirkos',
  KOLFE_KERANIO = 'Kolfe Keranio',
  LIDETA = 'Lideta',
  NIFAS_SILK_LAFTO = 'Nifas Silk-Lafto',
  YEKA = 'Yeka',
  LEMI_KURA = 'Lemi Kura',
}

@Entity('light_poles')
export class LightPole {
  @PrimaryColumn()
  code: string;

  @Column({
    type: 'enum',
    enum: Subcity,
    name: 'subcity', // Database column name is 'district' for backward compatibility
  })
  subcity: string; // Property name - API will return this as 'district'

  @Column()
  street: string;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  gpsLat: number | null;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  gpsLng: number | null;

  @Column({
    type: 'enum',
    enum: PoleType,
    default: PoleType.STANDARD,
  })
  poleType: PoleType;

  @Column('decimal', { precision: 5, scale: 2 })
  heightMeters: number;

  @Column({
    type: 'enum',
    enum: LampType,
    default: LampType.LED,
  })
  lampType: LampType;

  @Column('int')
  powerRatingWatt: number;

  @Column({ default: false })
  hasLedDisplay: boolean;

  @Column({ nullable: true })
  ledModel: string;

  @Column({ type: 'text', nullable: true })
  qrPayload: string;

  @Column({ nullable: true })
  qrImageUrl: string;

  @Column({
    type: 'enum',
    enum: PoleStatus,
    default: PoleStatus.ACTIVE,
  })
  status: PoleStatus;

  @OneToMany(() => PoleIssue, (issue) => issue.pole)
  issues: PoleIssue[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



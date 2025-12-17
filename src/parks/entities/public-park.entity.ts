import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ParkIssue } from '../../issues/entities/park-issue.entity';

export enum ParkStatus {
  ACTIVE = 'ACTIVE',
  FAULT_DAMAGED = 'FAULT_DAMAGED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  OPERATIONAL = 'OPERATIONAL',
}

export enum ParkType {
  COMMUNITY = 'COMMUNITY',
  RECREATIONAL = 'RECREATIONAL',
  SPORTS = 'SPORTS',
  URBAN = 'URBAN',
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

@Entity('public_parks')
export class PublicPark {
  @PrimaryColumn()
  code: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: Subcity,
    name: 'district', // Database column name is 'district' for backward compatibility
  })
  district: string; // Property name - API will return this as 'district'

  @Column()
  street: string;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  gpsLat: number | null;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  gpsLng: number | null;

  @Column({
    type: 'enum',
    enum: ParkType,
    default: ParkType.COMMUNITY,
  })
  parkType: ParkType;

  @Column('decimal', { precision: 8, scale: 2 })
  areaHectares: number;

  @Column({ default: false })
  hasPaidEntrance: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  entranceFee: number | null;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  qrPayload: string;

  @Column({ nullable: true })
  qrImageUrl: string;

  @Column({
    type: 'enum',
    enum: ParkStatus,
    default: ParkStatus.ACTIVE,
  })
  status: ParkStatus;

  @OneToMany(() => ParkIssue, (issue) => issue.park)
  issues: ParkIssue[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

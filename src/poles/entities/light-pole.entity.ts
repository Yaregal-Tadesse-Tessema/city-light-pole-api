import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PoleIssue } from '../../issues/entities/pole-issue.entity';
import { PoleComponent } from '../../components/entities/pole-component.entity';

export enum PoleStatus {
  OPERATIONAL = 'OPERATIONAL',
  FAULT_DAMAGED = 'FAULT_DAMAGED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  REPLACED = 'REPLACED',
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

export enum LedStatus {
  OPERATIONAL = 'OPERATIONAL',
  ON_MAINTENANCE = 'ON_MAINTENANCE',
  FAILED_DAMAGED = 'FAILED_DAMAGED',
}

export enum Structure {
  Wood = 'Wood',
  Concrete = 'Concrete',
  Steel = 'Steel',
}

export enum PolePosition {
  Up = 'Up',
  Down = 'Down',
  Middle = 'Middle',
}

export enum PoleCondition {
  NOT_IN_PLACE = 'Not in Place',
  GOOD = 'Good',
  BEND = 'Bend',
  BROKEN_LAMP = 'Broken Lamp',
  BOTH_POLE_LAMP_BROKEN = 'Both Pole & Lamp Broken',
}

export enum District {
  West = 'west',
  North = 'north',
  South = 'south',
  East = 'east',
  Center = 'center',
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
    name: 'subcity',
  })
  subcity: string;

  @Column()
  street: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  localAreaName: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  localAreaNameAm: string | null;

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

  @Column({
    type: 'enum',
    enum: Structure,
    default: Structure.Steel,
  })
  structure: Structure;

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

  @Column({ type: 'int', nullable: true })
  numberOfPoles: number | null;

  @Column({ type: 'date', nullable: true })
  poleInstallationDate: Date | null;

  @Column({ type: 'text', nullable: true })
  qrPayload: string;

  @Column({ nullable: true })
  qrImageUrl: string;

  @Column({
    type: 'enum',
    enum: PoleStatus,
    default: PoleStatus.OPERATIONAL,
  })
  status: PoleStatus;

  @Column({
    type: 'enum',
    enum: PolePosition,
    default: PolePosition.Up,
  })
  polePosition: PolePosition;

  @Column({
    type: 'enum',
    enum: PoleCondition,
    default: PoleCondition.GOOD,
  })
  condition: PoleCondition;

  @Column({
    type: 'enum',
    enum: District,
    default: District.Center,
  })
  district: District;

  @OneToMany(() => PoleIssue, (issue) => issue.pole)
  issues: PoleIssue[];

  @OneToMany(() => PoleComponent, (pc) => pc.pole)
  poleComponents: PoleComponent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MuseumIssue } from '../../issues/entities/museum-issue.entity';
import { MaintenanceSchedule } from '../../maintenance/entities/maintenance-schedule.entity';

export enum MuseumStatus {
  ACTIVE = 'ACTIVE',
  FAULT_DAMAGED = 'FAULT_DAMAGED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  OPERATIONAL = 'OPERATIONAL',
}

@Entity('museums')
export class Museum {
  @PrimaryColumn()
  code: string;

  @Column()
  name: string;

  @Column()
  district: string;

  @Column()
  street: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gpsLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gpsLng: number;

  @Column({ type: 'varchar', nullable: true })
  museumType: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: MuseumStatus, default: MuseumStatus.ACTIVE })
  status: MuseumStatus;

  @Column({ type: 'text', nullable: true })
  qrPayload: string;

  @Column({ type: 'text', nullable: true })
  qrImageUrl: string;

  @OneToMany(() => MuseumIssue, (issue) => issue.museum)
  issues: MuseumIssue[];

  @OneToMany(() => MaintenanceSchedule, (schedule) => schedule.museum)
  maintenanceSchedules: MaintenanceSchedule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



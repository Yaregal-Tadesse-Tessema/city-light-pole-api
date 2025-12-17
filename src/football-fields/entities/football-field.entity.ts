import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { FootballFieldIssue } from '../../issues/entities/football-field-issue.entity';
import { MaintenanceSchedule } from '../../maintenance/entities/maintenance-schedule.entity';

export enum FootballFieldStatus {
  ACTIVE = 'ACTIVE',
  FAULT_DAMAGED = 'FAULT_DAMAGED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  OPERATIONAL = 'OPERATIONAL',
}

@Entity('football_fields')
export class FootballField {
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
  fieldType: string;

  @Column({ type: 'int', nullable: true })
  capacity: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: FootballFieldStatus, default: FootballFieldStatus.ACTIVE })
  status: FootballFieldStatus;

  @Column({ type: 'text', nullable: true })
  qrPayload: string;

  @Column({ type: 'text', nullable: true })
  qrImageUrl: string;

  @OneToMany(() => FootballFieldIssue, (issue) => issue.footballField)
  issues: FootballFieldIssue[];

  @OneToMany(() => MaintenanceSchedule, (schedule) => schedule.footballField)
  maintenanceSchedules: MaintenanceSchedule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



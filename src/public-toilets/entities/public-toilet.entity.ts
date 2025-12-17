import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PublicToiletIssue } from '../../issues/entities/public-toilet-issue.entity';
import { MaintenanceSchedule } from '../../maintenance/entities/maintenance-schedule.entity';

export enum PublicToiletStatus {
  ACTIVE = 'ACTIVE',
  FAULT_DAMAGED = 'FAULT_DAMAGED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  OPERATIONAL = 'OPERATIONAL',
}

@Entity('public_toilets')
export class PublicToilet {
  @PrimaryColumn()
  code: string;

  @Column()
  district: string;

  @Column()
  street: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gpsLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gpsLng: number;

  @Column({ type: 'varchar', nullable: true })
  toiletType: string;

  @Column({ type: 'boolean', default: false })
  hasPaidAccess: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  accessFee: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: PublicToiletStatus, default: PublicToiletStatus.ACTIVE })
  status: PublicToiletStatus;

  @Column({ type: 'text', nullable: true })
  qrPayload: string;

  @Column({ type: 'text', nullable: true })
  qrImageUrl: string;

  @OneToMany(() => PublicToiletIssue, (issue) => issue.publicToilet)
  issues: PublicToiletIssue[];

  @OneToMany(() => MaintenanceSchedule, (schedule) => schedule.publicToilet)
  maintenanceSchedules: MaintenanceSchedule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RiverSideProjectIssue } from '../../issues/entities/river-side-project-issue.entity';
import { MaintenanceSchedule } from '../../maintenance/entities/maintenance-schedule.entity';

export enum RiverSideProjectStatus {
  ACTIVE = 'ACTIVE',
  FAULT_DAMAGED = 'FAULT_DAMAGED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  OPERATIONAL = 'OPERATIONAL',
}

@Entity('river_side_projects')
export class RiverSideProject {
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
  projectType: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: RiverSideProjectStatus, default: RiverSideProjectStatus.ACTIVE })
  status: RiverSideProjectStatus;

  @Column({ type: 'text', nullable: true })
  qrPayload: string;

  @Column({ type: 'text', nullable: true })
  qrImageUrl: string;

  @OneToMany(() => RiverSideProjectIssue, (issue) => issue.riverSideProject)
  issues: RiverSideProjectIssue[];

  @OneToMany(() => MaintenanceSchedule, (schedule) => schedule.riverSideProject)
  maintenanceSchedules: MaintenanceSchedule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



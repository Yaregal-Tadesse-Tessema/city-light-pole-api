import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ParkingLotIssue } from '../../issues/entities/parking-lot-issue.entity';
import { MaintenanceSchedule } from '../../maintenance/entities/maintenance-schedule.entity';

export enum ParkingLotStatus {
  ACTIVE = 'ACTIVE',
  FAULT_DAMAGED = 'FAULT_DAMAGED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  OPERATIONAL = 'OPERATIONAL',
}

@Entity('parking_lots')
export class ParkingLot {
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
  parkingType: string;

  @Column({ type: 'int', nullable: true })
  capacity: number;

  @Column({ type: 'boolean', default: false })
  hasPaidParking: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ParkingLotStatus, default: ParkingLotStatus.ACTIVE })
  status: ParkingLotStatus;

  @Column({ type: 'text', nullable: true })
  qrPayload: string;

  @Column({ type: 'text', nullable: true })
  qrImageUrl: string;

  @OneToMany(() => ParkingLotIssue, (issue) => issue.parkingLot)
  issues: ParkingLotIssue[];

  @OneToMany(() => MaintenanceSchedule, (schedule) => schedule.parkingLot)
  maintenanceSchedules: MaintenanceSchedule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



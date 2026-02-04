import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MaterialRequest } from './material-request.entity';
import { User } from '../../users/entities/user.entity';
import { PurchaseRequestItem } from './purchase-request-item.entity';
import { MaintenanceSchedule } from '../../maintenance/entities/maintenance-schedule.entity';

export enum PurchaseRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ORDERED = 'ORDERED',
  ARRIVED_IN_STOCK = 'ARRIVED_IN_STOCK',
  READY_TO_DELIVER = 'READY_TO_DELIVER',
  DELIVERED = 'DELIVERED',
}

@Entity('purchase_requests')
export class PurchaseRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MaterialRequest, { nullable: true })
  @JoinColumn({ name: 'materialRequestId' })
  materialRequest: MaterialRequest | null;

  @Column({ nullable: true })
  materialRequestId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requestedById' })
  requestedBy: User;

  @Column()
  requestedById: string;

  @ManyToOne(() => MaintenanceSchedule, { nullable: true })
  @JoinColumn({ name: 'maintenanceScheduleId' })
  maintenanceSchedule: MaintenanceSchedule | null;

  @Column({ nullable: true })
  maintenanceScheduleId: string | null;

  @Column({
    type: 'enum',
    enum: PurchaseRequestStatus,
    default: PurchaseRequestStatus.PENDING,
  })
  status: PurchaseRequestStatus;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalCost: number;

  @Column({ nullable: true })
  supplierName: string | null;

  @Column({ nullable: true })
  supplierContact: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User | null;

  @Column({ nullable: true })
  approvedById: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  orderedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  receivedAt: Date | null;

  @Column({ nullable: true })
  grnCode: string | null;

  @Column({ nullable: true })
  receivingCode: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'readyToDeliverById' })
  readyToDeliverBy: User | null;

  @Column({ nullable: true })
  readyToDeliverById: string | null;

  @Column({ type: 'timestamp', nullable: true })
  readyToDeliverAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'completedById' })
  completedBy: User | null;

  @Column({ nullable: true })
  completedById: string | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @OneToMany(() => PurchaseRequestItem, (item) => item.purchaseRequest, { cascade: true })
  items: PurchaseRequestItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



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
import { MaintenanceSchedule } from '../../maintenance/entities/maintenance-schedule.entity';
import { User } from '../../users/entities/user.entity';
import { MaterialRequestItem } from './material-request-item.entity';
import { PurchaseRequest } from './purchase-request.entity';

export enum MaterialRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED', // Keep temporarily for migration
  AWAITING_DELIVERY = 'AWAITING_DELIVERY',
  DELIVERED = 'DELIVERED',
  REJECTED = 'REJECTED',
  FULFILLED = 'FULFILLED',
}

@Entity('material_requests')
export class MaterialRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  code: string | null;

  @ManyToOne(() => MaintenanceSchedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'maintenanceScheduleId' })
  maintenanceSchedule: MaintenanceSchedule;

  @Column({ type: 'uuid' })
  maintenanceScheduleId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requestedById' })
  requestedBy: User;

  @Column()
  requestedById: string;

  @Column({
    type: 'enum',
    enum: MaterialRequestStatus,
    default: MaterialRequestStatus.PENDING,
  })
  status: MaterialRequestStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User | null;

  @Column({ nullable: true })
  approvedById: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'deliveredById' })
  deliveredBy: User | null;

  @Column({ nullable: true })
  deliveredById: string | null;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @OneToMany(() => MaterialRequestItem, (item) => item.materialRequest, { cascade: true })
  items: MaterialRequestItem[];

  @OneToMany(() => PurchaseRequest, (pr) => pr.materialRequest)
  purchaseRequests: PurchaseRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



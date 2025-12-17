import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MaintenanceAttachment } from '../../maintenance/entities/maintenance-attachment.entity';
import { Museum } from './museum.entity';
import { User } from '../../users/entities/user.entity';
import { ScheduleFrequency, ScheduleStatus } from '../../maintenance/enums/maintenance.enums';

@Entity('museum_maintenance_schedules')
export class MuseumMaintenance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  museumCode: string;

  @ManyToOne(() => Museum)
  @JoinColumn({ name: 'museumCode', referencedColumnName: 'code' })
  museum: Museum;

  @Column({ type: 'uuid', nullable: true })
  issueId: string;

  @Column({ nullable: true })
  district: string;

  @Column({
    type: 'enum',
    enum: ScheduleFrequency,
    default: ScheduleFrequency.MONTHLY,
  })
  frequency: ScheduleFrequency;

  @Column('text')
  description: string;

  @Column('date')
  startDate: Date;

  @Column('date', { nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.REQUESTED,
  })
  status: ScheduleStatus;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column('uuid', { nullable: true })
  performedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performedById' })
  performedBy: User;

  @Column('date', { nullable: true })
  completedDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @OneToMany(() => MaintenanceAttachment, (attachment) => attachment.museumMaintenance, {
    cascade: true,
  })
  attachments: MaintenanceAttachment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


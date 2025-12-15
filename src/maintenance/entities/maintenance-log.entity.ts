import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { MaintenanceSchedule } from './maintenance-schedule.entity';
import { MaintenanceAttachment } from './maintenance-attachment.entity';
import { LightPole } from '../../poles/entities/light-pole.entity';
import { User } from '../../users/entities/user.entity';

export enum LogStatus {
  REQUESTED = 'REQUESTED',
  STARTED = 'STARTED',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

@Entity('maintenance_logs')
export class MaintenanceLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  scheduleId: string;

  @ManyToOne(() => MaintenanceSchedule, (schedule) => schedule.logs, {
    nullable: true,
  })
  @JoinColumn({ name: 'scheduleId' })
  schedule: MaintenanceSchedule;

  @Column()
  poleCode: string;

  @ManyToOne(() => LightPole)
  @JoinColumn({ name: 'poleCode', referencedColumnName: 'code' })
  pole: LightPole;

  @Column('uuid')
  performedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'performedById' })
  performedBy: User;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: LogStatus,
  default: LogStatus.REQUESTED,
  })
  status: LogStatus;

  @Column('date')
  scheduledDate: Date;

  @Column('date', { nullable: true })
  completedDate: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column('text', { nullable: true })
  notes: string;

  @OneToMany(() => MaintenanceAttachment, (attachment) => attachment.log, {
    cascade: true,
  })
  attachments: MaintenanceAttachment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



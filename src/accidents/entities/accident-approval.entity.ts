import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Accident } from './accident.entity';
import { User } from '../../users/entities/user.entity';
import { AccidentStatus, ApprovalAction } from '../enums/accident.enums';

export enum ApprovalStage {
  SUPERVISOR_REVIEW = 'SUPERVISOR_REVIEW',
  FINANCE_REVIEW = 'FINANCE_REVIEW',
}

@Entity('accident_approvals')
export class AccidentApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ApprovalStage,
  })
  stage: ApprovalStage;

  @Column({
    type: 'enum',
    enum: ApprovalAction,
  })
  action: ApprovalAction;

  @Column({ nullable: true })
  comments: string;

  @Column({
    type: 'enum',
    enum: AccidentStatus,
  })
  previousStatus: AccidentStatus;

  @Column({
    type: 'enum',
    enum: AccidentStatus,
  })
  newStatus: AccidentStatus;

  // Relations
  @ManyToOne(() => Accident, (accident) => accident.approvals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accidentId' })
  accident: Accident;

  @Column({ name: 'accidentId' })
  accidentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @Column()
  approvedById: string;

  @CreateDateColumn()
  createdAt: Date;
}

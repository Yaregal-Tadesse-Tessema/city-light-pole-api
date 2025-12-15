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
import { LightPole } from '../../poles/entities/light-pole.entity';
import { PoleIssueAttachment } from './pole-issue-attachment.entity';
import { User } from '../../users/entities/user.entity';

export enum IssueStatus {
  REPORTED = 'REPORTED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum IssueSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('pole_issues')
export class PoleIssue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  poleCode: string;

  @ManyToOne(() => LightPole, (pole) => pole.issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poleCode', referencedColumnName: 'code' })
  pole: LightPole;

  @Column('uuid')
  reportedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reportedById' })
  reportedBy: User;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: IssueStatus,
    default: IssueStatus.REPORTED,
  })
  status: IssueStatus;

  @Column({
    type: 'enum',
    enum: IssueSeverity,
    default: IssueSeverity.MEDIUM,
  })
  severity: IssueSeverity;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @OneToMany(() => PoleIssueAttachment, (attachment) => attachment.issue, {
    cascade: true,
  })
  attachments: PoleIssueAttachment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



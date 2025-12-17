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
import { Museum } from '../../museums/entities/museum.entity';
import { User } from '../../users/entities/user.entity';
import { MuseumIssueAttachment } from './museum-issue-attachment.entity';

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

@Entity('museum_issues')
export class MuseumIssue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  museumCode: string;

  @ManyToOne(() => Museum, (museum) => museum.issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'museumCode', referencedColumnName: 'code' })
  museum: Museum;

  @Column('uuid')
  reportedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reportedById' })
  reportedBy: User;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: IssueStatus, default: IssueStatus.REPORTED })
  status: IssueStatus;

  @Column({ type: 'enum', enum: IssueSeverity, default: IssueSeverity.MEDIUM })
  severity: IssueSeverity;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @OneToMany(() => MuseumIssueAttachment, (attachment) => attachment.issue, { cascade: true })
  attachments: MuseumIssueAttachment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



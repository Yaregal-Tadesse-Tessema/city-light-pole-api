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
import { PublicPark } from '../../parks/entities/public-park.entity';
import { ParkIssueAttachment } from './park-issue-attachment.entity';
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

@Entity('park_issues')
export class ParkIssue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  parkCode: string;

  @ManyToOne(() => PublicPark, (park) => park.issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parkCode', referencedColumnName: 'code' })
  park: PublicPark;

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

  @OneToMany(() => ParkIssueAttachment, (attachment) => attachment.issue, {
    cascade: true,
  })
  attachments: ParkIssueAttachment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


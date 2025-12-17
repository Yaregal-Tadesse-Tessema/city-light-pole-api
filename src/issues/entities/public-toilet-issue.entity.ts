import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PublicToilet } from '../../public-toilets/entities/public-toilet.entity';
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

@Entity('public_toilet_issues')
export class PublicToiletIssue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  publicToiletCode: string;

  @ManyToOne(() => PublicToilet, (toilet) => toilet.issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publicToiletCode', referencedColumnName: 'code' })
  publicToilet: PublicToilet;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FootballField } from '../../football-fields/entities/football-field.entity';
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

@Entity('football_field_issues')
export class FootballFieldIssue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  footballFieldCode: string;

  @ManyToOne(() => FootballField, (field) => field.issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'footballFieldCode', referencedColumnName: 'code' })
  footballField: FootballField;

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



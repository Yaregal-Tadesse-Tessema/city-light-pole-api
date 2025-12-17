import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RiverSideProject } from '../../river-side-projects/entities/river-side-project.entity';
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

@Entity('river_side_project_issues')
export class RiverSideProjectIssue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  riverSideProjectCode: string;

  @ManyToOne(() => RiverSideProject, (project) => project.issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'riverSideProjectCode', referencedColumnName: 'code' })
  riverSideProject: RiverSideProject;

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



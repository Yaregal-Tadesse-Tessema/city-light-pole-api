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
import { ParkingLot } from '../../parking-lots/entities/parking-lot.entity';
import { User } from '../../users/entities/user.entity';
import { ParkingLotIssueAttachment } from './parking-lot-issue-attachment.entity';

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

@Entity('parking_lot_issues')
export class ParkingLotIssue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  parkingLotCode: string;

  @ManyToOne(() => ParkingLot, (lot) => lot.issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parkingLotCode', referencedColumnName: 'code' })
  parkingLot: ParkingLot;

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

  @OneToMany(() => ParkingLotIssueAttachment, (attachment) => attachment.issue, { cascade: true })
  attachments: ParkingLotIssueAttachment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



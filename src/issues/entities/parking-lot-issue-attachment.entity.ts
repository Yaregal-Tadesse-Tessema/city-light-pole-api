import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ParkingLotIssue } from './parking-lot-issue.entity';

export enum AttachmentType {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
}

@Entity('parking_lot_issue_attachments')
export class ParkingLotIssueAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  issueId: string;

  @ManyToOne(() => ParkingLotIssue, (issue) => issue.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issueId' })
  issue: ParkingLotIssue;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column({ type: 'enum', enum: AttachmentType })
  type: AttachmentType;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ type: 'int', nullable: true })
  fileSize: number;

  @CreateDateColumn()
  createdAt: Date;
}



import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ParkIssue } from './park-issue.entity';

export enum AttachmentType {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
}

@Entity('park_issue_attachments')
export class ParkIssueAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  issueId: string;

  @ManyToOne(() => ParkIssue, (issue) => issue.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'issueId' })
  issue: ParkIssue;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column({
    type: 'enum',
    enum: AttachmentType,
  })
  type: AttachmentType;

  @Column()
  mimeType: string;

  @Column('bigint')
  fileSize: number;

  @CreateDateColumn()
  createdAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PoleIssue } from './pole-issue.entity';

export enum AttachmentType {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
}

@Entity('pole_issue_attachments')
export class PoleIssueAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  issueId: string;

  @ManyToOne(() => PoleIssue, (issue) => issue.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'issueId' })
  issue: PoleIssue;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column({
    type: 'enum',
    enum: AttachmentType,
    default: AttachmentType.BEFORE,
  })
  type: AttachmentType;

  @Column({ nullable: true })
  mimeType: string;

  @Column('int', { nullable: true })
  fileSize: number;

  @CreateDateColumn()
  createdAt: Date;
}



import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MuseumIssue } from './museum-issue.entity';

export enum AttachmentType {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
}

@Entity('museum_issue_attachments')
export class MuseumIssueAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  issueId: string;

  @ManyToOne(() => MuseumIssue, (issue) => issue.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issueId' })
  issue: MuseumIssue;

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



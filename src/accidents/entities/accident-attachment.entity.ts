import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Accident } from './accident.entity';

export enum AttachmentType {
  POLICE_REPORT = 'POLICE_REPORT',
  INSURANCE_CLAIM = 'INSURANCE_CLAIM',
  OTHER = 'OTHER',
}

@Entity('accident_attachments')
export class AccidentAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column()
  path: string;

  @Column({
    type: 'enum',
    enum: AttachmentType,
    default: AttachmentType.OTHER,
  })
  attachmentType: AttachmentType;

  @Column({ nullable: true })
  description: string;

  // Relation to accident
  @ManyToOne(() => Accident, (accident) => accident.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accidentId' })
  accident: Accident;

  @Column()
  accidentId: string;

  @CreateDateColumn()
  createdAt: Date;
}


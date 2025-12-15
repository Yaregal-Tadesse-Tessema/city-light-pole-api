import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MaintenanceLog } from './maintenance-log.entity';

@Entity('maintenance_attachments')
export class MaintenanceAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  logId: string;

  @ManyToOne(() => MaintenanceLog, (log) => log.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'logId' })
  log: MaintenanceLog;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  mimeType: string;

  @Column('int', { nullable: true })
  fileSize: number;

  @CreateDateColumn()
  createdAt: Date;
}



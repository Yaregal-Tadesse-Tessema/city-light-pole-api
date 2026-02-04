import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Accident } from './accident.entity';

@Entity('accident_photos')
export class AccidentPhoto {
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

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isVideo: boolean;

  // Relation to accident
  @ManyToOne(() => Accident, (accident) => accident.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accidentId' })
  accident: Accident;

  @Column()
  accidentId: string;

  @CreateDateColumn()
  createdAt: Date;
}


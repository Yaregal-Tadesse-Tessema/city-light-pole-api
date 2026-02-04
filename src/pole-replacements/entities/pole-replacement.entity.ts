import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LightPole } from '../../poles/entities/light-pole.entity';

export enum ReplacementReason {
  DAMAGE = 'DAMAGE',
  UPGRADE = 'UPGRADE',
  MAINTENANCE = 'MAINTENANCE',
  OBSOLETE = 'OBSOLETE',
  OTHER = 'OTHER',
}

export enum ComponentReused {
  LED_DISPLAY = 'LED_DISPLAY',
  CAMERA = 'CAMERA',
  PHONE_CHARGER = 'PHONE_CHARGER',
  LAMP = 'LAMP',
  WIRING = 'WIRING',
  MOUNTING_HARDWARE = 'MOUNTING_HARDWARE',
}

@Entity('pole_replacements')
export class PoleReplacement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  oldPoleCode: string;

  @Column()
  newPoleCode: string;

  @Column({ type: 'date' })
  replacementDate: Date;

  @Column({
    type: 'enum',
    enum: ReplacementReason,
    default: ReplacementReason.DAMAGE,
  })
  replacementReason: ReplacementReason;

  @Column()
  replacedBy: string;

  @Column('simple-array', { nullable: true })
  reuseComponents: ComponentReused[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Relations to poles (optional, since poles might be deleted)
  @ManyToOne(() => LightPole, { nullable: true })
  @JoinColumn({ name: 'oldPoleCode', referencedColumnName: 'code' })
  oldPole: LightPole;

  @ManyToOne(() => LightPole, { nullable: true })
  @JoinColumn({ name: 'newPoleCode', referencedColumnName: 'code' })
  newPole: LightPole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { LightPole } from '../../poles/entities/light-pole.entity';
import { AccidentPhoto } from './accident-photo.entity';
import { AccidentAttachment } from './accident-attachment.entity';
import { AccidentApproval } from './accident-approval.entity';
import { AccidentsDamagedComponets } from './accidents-damaged-componets.entity';
import {
  AccidentType,
  DamageLevel,
  AccidentStatus,
  ClaimStatus,
} from '../enums/accident.enums';

@Entity('accidents')
export class Accident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  incidentId: string; // Auto-generated incident ID

  @Column({
    type: 'enum',
    enum: AccidentType,
  })
  accidentType: AccidentType;

  @Column({ type: 'timestamp' })
  accidentDate: Date;

  @Column({ type: 'time' })
  accidentTime: string;

  @Column({ nullable: true })
  poleId: string; // Manual pole ID entry

  @ManyToOne(() => LightPole, { nullable: true })
  @JoinColumn({ name: 'poleId', referencedColumnName: 'code' })
  pole: LightPole;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  locationDescription: string;

  @Column({ nullable: true })
  vehiclePlateNumber: string;

  @Column({ nullable: true })
  driverName: string;

  @Column({ nullable: true })
  insuranceCompany: string;

  @Column({ nullable: true })
  claimReferenceNumber: string;

  @Column({
    type: 'enum',
    enum: ClaimStatus,
    default: ClaimStatus.NOT_SUBMITTED,
  })
  claimStatus: ClaimStatus;

  // Damage Assessment
  @Column({
    type: 'enum',
    enum: DamageLevel,
    nullable: true,
  })
  damageLevel: DamageLevel;

  @Column({ nullable: true })
  damageDescription: string;

  @Column({ type: 'boolean', default: false })
  safetyRisk: boolean;

  @OneToMany(() => AccidentsDamagedComponets, (adc) => adc.accident, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  damagedComponents: AccidentsDamagedComponets[];

  // Cost Estimation
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ type: 'json', nullable: true })
  costBreakdown: {
    pole: number;
    luminaire: number;
    armBracket: number;
    foundation: number;
    cable: number;
    labor: number;
    transport: number;
    total: number;
  };

  // Status and Workflow
  @Column({
    type: 'enum',
    enum: AccidentStatus,
    default: AccidentStatus.REPORTED,
  })
  status: AccidentStatus;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'reportedById' })
  reportedBy: User;

  @Column()
  reportedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'inspectedById' })
  inspectedBy: User;

  @Column({ nullable: true })
  inspectedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'supervisorApprovedById' })
  supervisorApprovedBy: User;

  @Column({ nullable: true })
  supervisorApprovedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'financeApprovedById' })
  financeApprovedBy: User;

  @Column({ nullable: true })
  financeApprovedById: string;
  // Audit fields
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  // Relations to photos and attachments
  @OneToMany(() => AccidentPhoto, (photo) => photo.accident)
  photos: AccidentPhoto[];

  @OneToMany(() => AccidentAttachment, (attachment) => attachment.accident)
  attachments: AccidentAttachment[];

  @OneToMany(() => AccidentApproval, (approval) => approval.accident)
  approvals: AccidentApproval[];
}

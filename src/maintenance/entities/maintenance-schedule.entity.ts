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
import { MaintenanceAttachment } from './maintenance-attachment.entity';
import { LightPole } from '../../poles/entities/light-pole.entity';
import { PublicPark } from '../../parks/entities/public-park.entity';
import { ParkingLot } from '../../parking-lots/entities/parking-lot.entity';
import { Museum } from '../../museums/entities/museum.entity';
import { MaterialRequest } from '../../inventory/entities/material-request.entity';
import { PublicToilet } from '../../public-toilets/entities/public-toilet.entity';
import { FootballField } from '../../football-fields/entities/football-field.entity';
import { RiverSideProject } from '../../river-side-projects/entities/river-side-project.entity';
import { User } from '../../users/entities/user.entity';

import { ScheduleFrequency, ScheduleStatus } from '../enums/maintenance.enums';

export { ScheduleFrequency, ScheduleStatus };

@Entity('maintenance_schedules')
export class MaintenanceSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  poleCode: string;

  @ManyToOne(() => LightPole, { nullable: true })
  @JoinColumn({ name: 'poleCode', referencedColumnName: 'code' })
  pole: LightPole;

  @Column({ nullable: true })
  parkCode: string;

  @ManyToOne(() => PublicPark, { nullable: true })
  @JoinColumn({ name: 'parkCode', referencedColumnName: 'code' })
  park: PublicPark;

  @Column({ nullable: true })
  parkingLotCode: string;

  @ManyToOne(() => ParkingLot, { nullable: true })
  @JoinColumn({ name: 'parkingLotCode', referencedColumnName: 'code' })
  parkingLot: ParkingLot;

  @Column({ nullable: true })
  museumCode: string;

  @ManyToOne(() => Museum, { nullable: true })
  @JoinColumn({ name: 'museumCode', referencedColumnName: 'code' })
  museum: Museum;

  @Column({ nullable: true })
  publicToiletCode: string;

  @ManyToOne(() => PublicToilet, { nullable: true })
  @JoinColumn({ name: 'publicToiletCode', referencedColumnName: 'code' })
  publicToilet: PublicToilet;

  @Column({ nullable: true })
  footballFieldCode: string;

  @ManyToOne(() => FootballField, { nullable: true })
  @JoinColumn({ name: 'footballFieldCode', referencedColumnName: 'code' })
  footballField: FootballField;

  @Column({ nullable: true })
  riverSideProjectCode: string;

  @ManyToOne(() => RiverSideProject, { nullable: true })
  @JoinColumn({ name: 'riverSideProjectCode', referencedColumnName: 'code' })
  riverSideProject: RiverSideProject;

  @Column({ type: 'uuid', nullable: true })
  issueId: string;

  @Column({ nullable: true })
  district: string;

  @Column({
    type: 'enum',
    enum: ScheduleFrequency,
    default: ScheduleFrequency.MONTHLY,
  })
  frequency: ScheduleFrequency;

  @Column('text')
  description: string;

  @Column('date')
  startDate: Date;

  @Column('timestamp', { nullable: true })
  startedAt: Date;

  @Column('date', { nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.REQUESTED,
  })
  status: ScheduleStatus;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column('uuid', { nullable: true })
  performedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performedById' })
  performedBy: User;

  @Column('date', { nullable: true })
  completedDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @OneToMany(() => MaintenanceAttachment, (attachment) => attachment.schedule, {
    cascade: true,
  })
  attachments: MaintenanceAttachment[];

  @OneToMany(() => MaterialRequest, (materialRequest) => materialRequest.maintenanceSchedule)
  materialRequests: MaterialRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



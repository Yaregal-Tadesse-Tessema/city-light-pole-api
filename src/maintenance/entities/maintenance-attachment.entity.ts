import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MaintenanceSchedule } from './maintenance-schedule.entity';
import { ParkMaintenance } from '../../parks/entities/park-maintenance.entity';
import { ParkingLotMaintenance } from '../../parking-lots/entities/parking-lot-maintenance.entity';
import { MuseumMaintenance } from '../../museums/entities/museum-maintenance.entity';
import { PublicToiletMaintenance } from '../../public-toilets/entities/public-toilet-maintenance.entity';
import { FootballFieldMaintenance } from '../../football-fields/entities/football-field-maintenance.entity';
import { RiverSideProjectMaintenance } from '../../river-side-projects/entities/river-side-project-maintenance.entity';

@Entity('maintenance_attachments')
export class MaintenanceAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  scheduleId: string;

  @ManyToOne(() => MaintenanceSchedule, (schedule) => schedule.attachments, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'scheduleId' })
  schedule: MaintenanceSchedule;

  @Column('uuid', { nullable: true })
  parkMaintenanceId: string;

  @ManyToOne(() => ParkMaintenance, (maintenance) => maintenance.attachments, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parkMaintenanceId' })
  parkMaintenance: ParkMaintenance;

  @Column('uuid', { nullable: true })
  parkingLotMaintenanceId: string;

  @ManyToOne(() => ParkingLotMaintenance, (maintenance) => maintenance.attachments, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parkingLotMaintenanceId' })
  parkingLotMaintenance: ParkingLotMaintenance;

  @Column('uuid', { nullable: true })
  museumMaintenanceId: string;

  @ManyToOne(() => MuseumMaintenance, (maintenance) => maintenance.attachments, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'museumMaintenanceId' })
  museumMaintenance: MuseumMaintenance;

  @Column('uuid', { nullable: true })
  publicToiletMaintenanceId: string;

  @ManyToOne(() => PublicToiletMaintenance, (maintenance) => maintenance.attachments, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'publicToiletMaintenanceId' })
  publicToiletMaintenance: PublicToiletMaintenance;

  @Column('uuid', { nullable: true })
  footballFieldMaintenanceId: string;

  @ManyToOne(() => FootballFieldMaintenance, (maintenance) => maintenance.attachments, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'footballFieldMaintenanceId' })
  footballFieldMaintenance: FootballFieldMaintenance;

  @Column('uuid', { nullable: true })
  riverSideProjectMaintenanceId: string;

  @ManyToOne(() => RiverSideProjectMaintenance, (maintenance) => maintenance.attachments, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'riverSideProjectMaintenanceId' })
  riverSideProjectMaintenance: RiverSideProjectMaintenance;

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




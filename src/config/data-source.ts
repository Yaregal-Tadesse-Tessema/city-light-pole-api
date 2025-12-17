import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config as loadEnv } from 'dotenv';
import { User } from '../users/entities/user.entity';
import { LightPole } from '../poles/entities/light-pole.entity';
import { PublicPark } from '../parks/entities/public-park.entity';
import { ParkingLot } from '../parking-lots/entities/parking-lot.entity';
import { Museum } from '../museums/entities/museum.entity';
import { PublicToilet } from '../public-toilets/entities/public-toilet.entity';
import { FootballField } from '../football-fields/entities/football-field.entity';
import { RiverSideProject } from '../river-side-projects/entities/river-side-project.entity';
import { PoleIssue } from '../issues/entities/pole-issue.entity';
import { PoleIssueAttachment } from '../issues/entities/pole-issue-attachment.entity';
import { ParkIssue } from '../issues/entities/park-issue.entity';
import { ParkIssueAttachment } from '../issues/entities/park-issue-attachment.entity';
import { ParkingLotIssue } from '../issues/entities/parking-lot-issue.entity';
import { ParkingLotIssueAttachment } from '../issues/entities/parking-lot-issue-attachment.entity';
import { MuseumIssue } from '../issues/entities/museum-issue.entity';
import { MuseumIssueAttachment } from '../issues/entities/museum-issue-attachment.entity';
import { PublicToiletIssue } from '../issues/entities/public-toilet-issue.entity';
import { FootballFieldIssue } from '../issues/entities/football-field-issue.entity';
import { RiverSideProjectIssue } from '../issues/entities/river-side-project-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
import { MaintenanceAttachment } from '../maintenance/entities/maintenance-attachment.entity';
import { ParkMaintenance } from '../parks/entities/park-maintenance.entity';
import { ParkingLotMaintenance } from '../parking-lots/entities/parking-lot-maintenance.entity';
import { MuseumMaintenance } from '../museums/entities/museum-maintenance.entity';
import { PublicToiletMaintenance } from '../public-toilets/entities/public-toilet-maintenance.entity';
import { FootballFieldMaintenance } from '../football-fields/entities/football-field-maintenance.entity';
import { RiverSideProjectMaintenance } from '../river-side-projects/entities/river-side-project-maintenance.entity';

loadEnv();

const configService = new ConfigService();

const databaseUrl = configService.get<string>('DATABASE_URL');
let dataSourceConfig: any;

if (databaseUrl) {
  const url = new URL(databaseUrl);
  dataSourceConfig = {
    type: 'postgres',
    host: url.hostname,
    port: parseInt(url.port, 10) || 5432,
    username: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    entities: [
      User,
      LightPole,
      PublicPark,
      ParkingLot,
      Museum,
      PublicToilet,
      FootballField,
      RiverSideProject,
      PoleIssue,
      PoleIssueAttachment,
      ParkIssue,
      ParkIssueAttachment,
      ParkingLotIssue,
      ParkingLotIssueAttachment,
      MuseumIssue,
      MuseumIssueAttachment,
      PublicToiletIssue,
      FootballFieldIssue,
      RiverSideProjectIssue,
      MaintenanceSchedule,
      MaintenanceAttachment,
      ParkMaintenance,
      ParkingLotMaintenance,
      MuseumMaintenance,
      PublicToiletMaintenance,
      FootballFieldMaintenance,
      RiverSideProjectMaintenance,
    ],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
  };
} else {
  dataSourceConfig = {
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: parseInt(configService.get('DB_PORT', '5432'), 10),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_NAME', 'CityLightPoleDev'),
    entities: [
      User,
      LightPole,
      PublicPark,
      ParkingLot,
      Museum,
      PublicToilet,
      FootballField,
      RiverSideProject,
      PoleIssue,
      PoleIssueAttachment,
      ParkIssue,
      ParkIssueAttachment,
      ParkingLotIssue,
      ParkingLotIssueAttachment,
      MuseumIssue,
      MuseumIssueAttachment,
      PublicToiletIssue,
      FootballFieldIssue,
      RiverSideProjectIssue,
      MaintenanceSchedule,
      MaintenanceAttachment,
      ParkMaintenance,
      ParkingLotMaintenance,
      MuseumMaintenance,
      PublicToiletMaintenance,
      FootballFieldMaintenance,
      RiverSideProjectMaintenance,
    ],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
  };
}

export default new DataSource(dataSourceConfig);


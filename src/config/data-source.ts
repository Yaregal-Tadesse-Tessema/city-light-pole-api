import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config as loadEnv } from 'dotenv';
import { User } from '../users/entities/user.entity';
import { LightPole } from '../poles/entities/light-pole.entity';
import { PoleIssue } from '../issues/entities/pole-issue.entity';
import { PoleIssueAttachment } from '../issues/entities/pole-issue-attachment.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
import { MaintenanceLog } from '../maintenance/entities/maintenance-log.entity';
import { MaintenanceAttachment } from '../maintenance/entities/maintenance-attachment.entity';

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
      PoleIssue,
      PoleIssueAttachment,
      MaintenanceSchedule,
      MaintenanceLog,
      MaintenanceAttachment,
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
      PoleIssue,
      PoleIssueAttachment,
      MaintenanceSchedule,
      MaintenanceLog,
      MaintenanceAttachment,
    ],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
  };
}

export default new DataSource(dataSourceConfig);


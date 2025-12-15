import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PolesModule } from './poles/poles.module';
import { IssuesModule } from './issues/issues.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { ReportsModule } from './reports/reports.module';
import { User } from './users/entities/user.entity';
import { LightPole } from './poles/entities/light-pole.entity';
import { PoleIssue } from './issues/entities/pole-issue.entity';
import { PoleIssueAttachment } from './issues/entities/pole-issue-attachment.entity';
import { MaintenanceSchedule } from './maintenance/entities/maintenance-schedule.entity';
import { MaintenanceLog } from './maintenance/entities/maintenance-log.entity';
import { MaintenanceAttachment } from './maintenance/entities/maintenance-attachment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (databaseUrl) {
          // Parse DATABASE_URL format: postgresql://user:password@host:port/database
          const url = new URL(databaseUrl);
          return {
            type: 'postgres',
            host: 'localhost',
            port: parseInt(url.port, 10) || 5432,
            username: 'postgres',
            password: 'yaya@1984',
            database: 'CityLightPoleDev', // Remove leading /
            entities: [
              User,
              LightPole,
              PoleIssue,
              PoleIssueAttachment,
              MaintenanceSchedule,
              MaintenanceLog,
              MaintenanceAttachment,
            ],
            synchronize: configService.get('NODE_ENV') === 'development',
            logging: configService.get('NODE_ENV') === 'development',
            ssl:
              configService.get('NODE_ENV') === 'production'
                ? { rejectUnauthorized: false }
                : false,
          };
        }
        // Fallback to individual env vars
        return {
          type: 'postgres',
          host: 'localhost',
          port: +5432,
          username: 'postgres',
          password: 'yaya@1984',
          database: 'CityLightPoleDev',
          entities: [
            User,
            LightPole,
            PoleIssue,
            PoleIssueAttachment,
            MaintenanceSchedule,
            MaintenanceLog,
            MaintenanceAttachment,
          ],
          synchronize:true,
          logging: true,
        };
      },
      inject: [ConfigService],
    }),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          rootPath: join(
            process.cwd(),
            configService.get('UPLOAD_DIR', './uploads'),
          ),
          serveRoot: '/uploads',
        },
      ],
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    PolesModule,
    IssuesModule,
    MaintenanceModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


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
import { ParksModule } from './parks/parks.module';
import { ParkingLotsModule } from './parking-lots/parking-lots.module';
import { MuseumsModule } from './museums/museums.module';
import { PublicToiletsModule } from './public-toilets/public-toilets.module';
import { FootballFieldsModule } from './football-fields/football-fields.module';
import { RiverSideProjectsModule } from './river-side-projects/river-side-projects.module';
import { IssuesModule } from './issues/issues.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { ReportsModule } from './reports/reports.module';
import { InventoryModule } from './inventory/inventory.module';
import { User } from './users/entities/user.entity';
import { LightPole } from './poles/entities/light-pole.entity';
import { PublicPark } from './parks/entities/public-park.entity';
import { ParkingLot } from './parking-lots/entities/parking-lot.entity';
import { Museum } from './museums/entities/museum.entity';
import { PublicToilet } from './public-toilets/entities/public-toilet.entity';
import { FootballField } from './football-fields/entities/football-field.entity';
import { RiverSideProject } from './river-side-projects/entities/river-side-project.entity';
import { PoleIssue } from './issues/entities/pole-issue.entity';
import { PoleIssueAttachment } from './issues/entities/pole-issue-attachment.entity';
import { ParkIssue } from './issues/entities/park-issue.entity';
import { ParkIssueAttachment } from './issues/entities/park-issue-attachment.entity';
import { ParkingLotIssue } from './issues/entities/parking-lot-issue.entity';
import { ParkingLotIssueAttachment } from './issues/entities/parking-lot-issue-attachment.entity';
import { MuseumIssue } from './issues/entities/museum-issue.entity';
import { MuseumIssueAttachment } from './issues/entities/museum-issue-attachment.entity';
import { PublicToiletIssue } from './issues/entities/public-toilet-issue.entity';
import { FootballFieldIssue } from './issues/entities/football-field-issue.entity';
import { RiverSideProjectIssue } from './issues/entities/river-side-project-issue.entity';
import { MaintenanceSchedule } from './maintenance/entities/maintenance-schedule.entity';
import { MaintenanceAttachment } from './maintenance/entities/maintenance-attachment.entity';
import { ParkMaintenance } from './parks/entities/park-maintenance.entity';
import { ParkingLotMaintenance } from './parking-lots/entities/parking-lot-maintenance.entity';
import { MuseumMaintenance } from './museums/entities/museum-maintenance.entity';
import { PublicToiletMaintenance } from './public-toilets/entities/public-toilet-maintenance.entity';
import { FootballFieldMaintenance } from './football-fields/entities/football-field-maintenance.entity';
import { RiverSideProjectMaintenance } from './river-side-projects/entities/river-side-project-maintenance.entity';
import { InventoryItem } from './inventory/entities/inventory-item.entity';
import { InventoryTransaction } from './inventory/entities/inventory-transaction.entity';
import { Category } from './inventory/entities/category.entity';
import { MaterialRequest } from './inventory/entities/material-request.entity';
import { MaterialRequestItem } from './inventory/entities/material-request-item.entity';
import { PurchaseRequest } from './inventory/entities/purchase-request.entity';
import { PurchaseRequestItem } from './inventory/entities/purchase-request-item.entity';
import { EmailModule } from './email/email.module';
import { FileModule } from './file/file.module';
import { RolesModule } from './roles/roles.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PoleReplacementsModule } from './pole-replacements/pole-replacements.module';
import { AccidentsModule } from './accidents/accidents.module';
import { ComponentsModule } from './components/components.module';
import { Role } from './roles/entities/role.entity';
import { UserRole } from './roles/entities/user-role.entity';
import { Notification } from './notifications/entities/notification.entity';
import { PoleReplacement } from './pole-replacements/entities/pole-replacement.entity';
import { Accident } from './accidents/entities/accident.entity';
import { AccidentPhoto } from './accidents/entities/accident-photo.entity';
import { AccidentAttachment } from './accidents/entities/accident-attachment.entity';
import { AccidentApproval } from './accidents/entities/accident-approval.entity';
import { DamagedComponent } from './accidents/entities/damaged-component.entity';
import { AccidentsDamagedComponets } from './accidents/entities/accidents-damaged-componets.entity';
import { Component } from './components/entities/component.entity';
import { PoleComponent } from './components/entities/pole-component.entity';

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
            host: url.hostname,
            port: parseInt(url.port, 10) || 5432,
            username: url.username,
            password: url.password,
            database: url.pathname.slice(1), // Remove leading /
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
              InventoryItem,
              InventoryTransaction,
              Category,
              MaterialRequest,
              MaterialRequestItem,
              PurchaseRequest,
              PurchaseRequestItem,
              Role,
              UserRole,
              Notification,
              PoleReplacement,
              Accident,
              AccidentPhoto,
              AccidentAttachment,
              AccidentApproval,
              DamagedComponent,
              AccidentsDamagedComponets,
              Component,
              PoleComponent,
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
          host: configService.get('DB_HOST', 'localhost'),
          port: parseInt(configService.get('DB_PORT', '5432'), 10),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          database: configService.get('DB_NAME', 'smart_pole_dev'),
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
              InventoryItem,
              InventoryTransaction,
              Category,
              MaterialRequest,
              MaterialRequestItem,
              PurchaseRequest,
              PurchaseRequestItem,
              Role,
              UserRole,
              Notification,
              PoleReplacement,
              Accident,
              AccidentPhoto,
              AccidentAttachment,
              AccidentApproval,
              Component,
              PoleComponent,
          ],
          synchronize: configService.get('NODE_ENV') === 'development',
          logging: configService.get('NODE_ENV') === 'development',
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
    ParksModule,
    ParkingLotsModule,
    MuseumsModule,
    PublicToiletsModule,
    FootballFieldsModule,
    RiverSideProjectsModule,
    IssuesModule,
    MaintenanceModule,
    ReportsModule,
    InventoryModule,
    RolesModule,
    NotificationsModule,
    PoleReplacementsModule,
    AccidentsModule,
    ComponentsModule,
    EmailModule,
    FileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


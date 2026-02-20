import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
import { PublicIssuesController } from './public-issues.controller';
import { ParkIssuesService } from './park-issues.service';
import { ParkIssuesController } from './park-issues.controller';
import { ParkingLotIssuesService } from './parking-lot-issues.service';
import { ParkingLotIssuesController } from './parking-lot-issues.controller';
import { MuseumIssuesService } from './museum-issues.service';
import { MuseumIssuesController } from './museum-issues.controller';
import { PublicToiletIssuesService } from './public-toilet-issues.service';
import { PublicToiletIssuesController } from './public-toilet-issues.controller';
import { FootballFieldIssuesService } from './football-field-issues.service';
import { FootballFieldIssuesController } from './football-field-issues.controller';
import { RiverSideProjectIssuesService } from './river-side-project-issues.service';
import { RiverSideProjectIssuesController } from './river-side-project-issues.controller';
import { PoleIssue } from './entities/pole-issue.entity';
import { PoleIssueAttachment } from './entities/pole-issue-attachment.entity';
import { User } from '../users/entities/user.entity';
import { ParkIssue } from './entities/park-issue.entity';
import { ParkIssueAttachment } from './entities/park-issue-attachment.entity';
import { ParkingLotIssue } from './entities/parking-lot-issue.entity';
import { ParkingLotIssueAttachment } from './entities/parking-lot-issue-attachment.entity';
import { MuseumIssue } from './entities/museum-issue.entity';
import { MuseumIssueAttachment } from './entities/museum-issue-attachment.entity';
import { PublicToiletIssue } from './entities/public-toilet-issue.entity';
import { FootballFieldIssue } from './entities/football-field-issue.entity';
import { RiverSideProjectIssue } from './entities/river-side-project-issue.entity';
import { PolesModule } from '../poles/poles.module';
import { ParksModule } from '../parks/parks.module';
import { ParkingLotsModule } from '../parking-lots/parking-lots.module';
import { MuseumsModule } from '../museums/museums.module';
import { PublicToiletsModule } from '../public-toilets/public-toilets.module';
import { FootballFieldsModule } from '../football-fields/football-fields.module';
import { RiverSideProjectsModule } from '../river-side-projects/river-side-projects.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PoleIssue,
      PoleIssueAttachment,
      User,
      ParkIssue,
      ParkIssueAttachment,
      ParkingLotIssue,
      ParkingLotIssueAttachment,
      MuseumIssue,
      MuseumIssueAttachment,
      PublicToiletIssue,
      FootballFieldIssue,
      RiverSideProjectIssue,
    ]),
    PolesModule,
    forwardRef(() => ParksModule),
    forwardRef(() => ParkingLotsModule),
    forwardRef(() => MuseumsModule),
    forwardRef(() => PublicToiletsModule),
    forwardRef(() => FootballFieldsModule),
    forwardRef(() => RiverSideProjectsModule),
    NotificationsModule,
    FileModule,
  ],
  controllers: [
    IssuesController,
    PublicIssuesController,
    ParkIssuesController,
    ParkingLotIssuesController,
    MuseumIssuesController,
    PublicToiletIssuesController,
    FootballFieldIssuesController,
    RiverSideProjectIssuesController,
  ],
  providers: [
    IssuesService,
    ParkIssuesService,
    ParkingLotIssuesService,
    MuseumIssuesService,
    PublicToiletIssuesService,
    FootballFieldIssuesService,
    RiverSideProjectIssuesService,
  ],
  exports: [
    IssuesService,
    ParkIssuesService,
    ParkingLotIssuesService,
    MuseumIssuesService,
    PublicToiletIssuesService,
    FootballFieldIssuesService,
    RiverSideProjectIssuesService,
  ],
})
export class IssuesModule {}




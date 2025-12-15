import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
import { PoleIssue } from './entities/pole-issue.entity';
import { PoleIssueAttachment } from './entities/pole-issue-attachment.entity';
import { PolesModule } from '../poles/poles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PoleIssue, PoleIssueAttachment]),
    PolesModule,
  ],
  controllers: [IssuesController],
  providers: [IssuesService],
  exports: [IssuesService],
})
export class IssuesModule {}



import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FootballFieldIssue, IssueStatus } from './entities/football-field-issue.entity';
import { CreateFootballFieldIssueDto } from './dto/create-football-field-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { FootballFieldsService } from '../football-fields/football-fields.service';
import { FootballFieldStatus } from '../football-fields/entities/football-field.entity';

@Injectable()
export class FootballFieldIssuesService {
  constructor(
    @InjectRepository(FootballFieldIssue)
    private issuesRepository: Repository<FootballFieldIssue>,
    @Inject(forwardRef(() => FootballFieldsService))
    private fieldsService: FootballFieldsService,
  ) {}

  async create(dto: CreateFootballFieldIssueDto, reportedById: string) {
    const field = await this.fieldsService.findOne(dto.footballFieldCode);

    const unclosedIssue = await this.issuesRepository.findOne({
      where: {
        footballFieldCode: dto.footballFieldCode,
        status: In([IssueStatus.REPORTED, IssueStatus.IN_PROGRESS]),
      },
    });
    if (unclosedIssue) {
      throw new BadRequestException(
        `Cannot create issue: There is already an unclosed issue (${unclosedIssue.status}) for football field ${dto.footballFieldCode}.`,
      );
    }

    const issue = this.issuesRepository.create({
      footballFieldCode: dto.footballFieldCode,
      description: dto.description,
      severity: dto.severity,
      reportedById,
    });
    const saved = await this.issuesRepository.save(issue);
    await this.fieldsService.update(field.code, { status: FootballFieldStatus.FAULT_DAMAGED });
    return this.findOne(saved.id);
  }

  async findAll() {
    return this.issuesRepository.find({
      relations: ['footballField', 'reportedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const issue = await this.issuesRepository.findOne({
      where: { id },
      relations: ['footballField', 'reportedBy'],
    });
    if (!issue) throw new NotFoundException(`Football field issue with ID ${id} not found`);
    return issue;
  }

  async updateStatus(id: string, dto: UpdateIssueStatusDto) {
    const issue = await this.findOne(id);
    issue.status = dto.status;
    issue.resolutionNotes = dto.resolutionNotes;
    if (dto.severity) issue.severity = dto.severity as any;
    const saved = await this.issuesRepository.save(issue);

    const field = await this.fieldsService.findOne(issue.footballFieldCode);
    if (dto.status === IssueStatus.IN_PROGRESS) {
      await this.fieldsService.update(field.code, { status: FootballFieldStatus.UNDER_MAINTENANCE });
    } else if (dto.status === IssueStatus.RESOLVED) {
      await this.fieldsService.update(field.code, { status: FootballFieldStatus.OPERATIONAL });
    }
    return saved;
  }

  async remove(id: string) {
    const issue = await this.findOne(id);
    if (issue.status !== IssueStatus.REPORTED) throw new BadRequestException('Only REPORTED (draft) issues can be deleted');
    await this.issuesRepository.remove(issue);
  }
}



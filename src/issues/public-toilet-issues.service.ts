import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PublicToiletIssue, IssueStatus } from './entities/public-toilet-issue.entity';
import { CreatePublicToiletIssueDto } from './dto/create-public-toilet-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { PublicToiletsService } from '../public-toilets/public-toilets.service';
import { PublicToiletStatus } from '../public-toilets/entities/public-toilet.entity';

@Injectable()
export class PublicToiletIssuesService {
  constructor(
    @InjectRepository(PublicToiletIssue)
    private issuesRepository: Repository<PublicToiletIssue>,
    @Inject(forwardRef(() => PublicToiletsService))
    private toiletsService: PublicToiletsService,
  ) {}

  async create(dto: CreatePublicToiletIssueDto, reportedById: string) {
    const toilet = await this.toiletsService.findOne(dto.publicToiletCode);

    const unclosedIssue = await this.issuesRepository.findOne({
      where: {
        publicToiletCode: dto.publicToiletCode,
        status: In([IssueStatus.REPORTED, IssueStatus.IN_PROGRESS]),
      },
    });
    if (unclosedIssue) {
      throw new BadRequestException(
        `Cannot create issue: There is already an unclosed issue (${unclosedIssue.status}) for public toilet ${dto.publicToiletCode}. Existing issue id: ${unclosedIssue.id}`,
      );
    }

    const issue = this.issuesRepository.create({
      publicToiletCode: dto.publicToiletCode,
      description: dto.description,
      severity: dto.severity,
      reportedById,
    });
    const saved = await this.issuesRepository.save(issue);

    await this.toiletsService.update(toilet.code, { status: PublicToiletStatus.FAULT_DAMAGED });
    return this.findOne(saved.id);
  }

  async findAll() {
    return this.issuesRepository.find({
      relations: ['publicToilet', 'reportedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const issue = await this.issuesRepository.findOne({
      where: { id },
      relations: ['publicToilet', 'reportedBy'],
    });
    if (!issue) throw new NotFoundException(`Public toilet issue with ID ${id} not found`);
    return issue;
  }

  async updateStatus(id: string, dto: UpdateIssueStatusDto) {
    const issue = await this.findOne(id);
    issue.status = dto.status;
    issue.resolutionNotes = dto.resolutionNotes;
    if (dto.severity) issue.severity = dto.severity as any;
    const saved = await this.issuesRepository.save(issue);

    const toilet = await this.toiletsService.findOne(issue.publicToiletCode);
    if (dto.status === IssueStatus.IN_PROGRESS) {
      await this.toiletsService.update(toilet.code, { status: PublicToiletStatus.UNDER_MAINTENANCE });
    } else if (dto.status === IssueStatus.RESOLVED) {
      await this.toiletsService.update(toilet.code, { status: PublicToiletStatus.OPERATIONAL });
    }
    return saved;
  }

  async remove(id: string) {
    const issue = await this.findOne(id);
    if (issue.status !== IssueStatus.REPORTED) {
      throw new BadRequestException('Only REPORTED (draft) issues can be deleted');
    }
    await this.issuesRepository.remove(issue);
  }
}



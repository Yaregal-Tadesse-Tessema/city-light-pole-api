import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RiverSideProjectIssue, IssueStatus } from './entities/river-side-project-issue.entity';
import { CreateRiverSideProjectIssueDto } from './dto/create-river-side-project-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { RiverSideProjectsService } from '../river-side-projects/river-side-projects.service';
import { RiverSideProjectStatus } from '../river-side-projects/entities/river-side-project.entity';

@Injectable()
export class RiverSideProjectIssuesService {
  constructor(
    @InjectRepository(RiverSideProjectIssue)
    private issuesRepo: Repository<RiverSideProjectIssue>,
    @Inject(forwardRef(() => RiverSideProjectsService))
    private projectsService: RiverSideProjectsService,
  ) {}

  async create(dto: CreateRiverSideProjectIssueDto, reportedById: string) {
    // Ensure project exists
    const project = await this.projectsService.findOne(dto.riverSideProjectCode);

    const unclosed = await this.issuesRepo.findOne({
      where: {
        riverSideProjectCode: dto.riverSideProjectCode,
        status: In([IssueStatus.REPORTED, IssueStatus.IN_PROGRESS]),
      },
    });
    if (unclosed) {
      throw new BadRequestException(
        `Cannot create issue: There is already an unclosed issue (${unclosed.status}) for river side project ${dto.riverSideProjectCode}.`,
      );
    }

    const issue = this.issuesRepo.create({
      riverSideProjectCode: dto.riverSideProjectCode,
      description: dto.description,
      severity: dto.severity,
      reportedById,
    });
    const saved = await this.issuesRepo.save(issue);

    // Update asset status to FAULT_DAMAGED
    await this.projectsService.update(project.code, { status: RiverSideProjectStatus.FAULT_DAMAGED });

    return this.issuesRepo.findOne({ where: { id: saved.id }, relations: ['riverSideProject', 'reportedBy'] });
  }

  async findAll() {
    return this.issuesRepo.find({ relations: ['riverSideProject', 'reportedBy'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const issue = await this.issuesRepo.findOne({ where: { id }, relations: ['riverSideProject', 'reportedBy'] });
    if (!issue) throw new NotFoundException(`River project issue with ID ${id} not found`);
    return issue;
  }

  async updateStatus(id: string, dto: UpdateIssueStatusDto) {
    const issue = await this.findOne(id);
    issue.status = dto.status as any;
    issue.resolutionNotes = dto.resolutionNotes;
    if (dto.severity) issue.severity = dto.severity as any;
    const saved = await this.issuesRepo.save(issue);

    const project = await this.projectsService.findOne(issue.riverSideProjectCode);
    if (dto.status === IssueStatus.IN_PROGRESS) {
      await this.projectsService.update(project.code, { status: RiverSideProjectStatus.UNDER_MAINTENANCE });
    } else if (dto.status === IssueStatus.RESOLVED) {
      await this.projectsService.update(project.code, { status: RiverSideProjectStatus.OPERATIONAL });
    }

    return saved;
  }

  async remove(id: string) {
    const issue = await this.findOne(id);
    if (issue.status !== IssueStatus.REPORTED) {
      throw new BadRequestException('Only REPORTED (draft) issues can be deleted');
    }
    await this.issuesRepo.remove(issue);
  }
}



import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { MuseumIssue, IssueStatus } from './entities/museum-issue.entity';
import { MuseumIssueAttachment } from './entities/museum-issue-attachment.entity';
import { CreateMuseumIssueDto } from './dto/create-museum-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { MuseumsService } from '../museums/museums.service';
import { MuseumStatus } from '../museums/entities/museum.entity';

@Injectable()
export class MuseumIssuesService {
  constructor(
    @InjectRepository(MuseumIssue)
    private issuesRepository: Repository<MuseumIssue>,
    @InjectRepository(MuseumIssueAttachment)
    private attachmentsRepository: Repository<MuseumIssueAttachment>,
    @Inject(forwardRef(() => MuseumsService))
    private museumsService: MuseumsService,
    private configService: ConfigService,
  ) {}

  async create(dto: CreateMuseumIssueDto, reportedById: string) {
    const museum = await this.museumsService.findOne(dto.museumCode);

    const unclosedIssue = await this.issuesRepository.findOne({
      where: {
        museumCode: dto.museumCode,
        status: In([IssueStatus.REPORTED, IssueStatus.IN_PROGRESS]),
      },
    });
    if (unclosedIssue) {
      throw new BadRequestException(
        `Cannot create issue: There is already an unclosed issue (${unclosedIssue.status}) for museum ${dto.museumCode}.`,
      );
    }

    const issue = this.issuesRepository.create({
      museumCode: dto.museumCode,
      description: dto.description,
      severity: dto.severity,
      reportedById,
    });
    const savedIssue = await this.issuesRepository.save(issue);

    await this.museumsService.update(museum.code, { status: MuseumStatus.FAULT_DAMAGED });

    return this.issuesRepository.findOne({
      where: { id: savedIssue.id },
      relations: ['museum', 'reportedBy', 'attachments'],
    });
  }

  async findAll() {
    return this.issuesRepository.find({
      relations: ['museum', 'reportedBy', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const issue = await this.issuesRepository.findOne({
      where: { id },
      relations: ['museum', 'reportedBy', 'attachments'],
    });
    if (!issue) throw new NotFoundException(`Museum issue with ID ${id} not found`);
    return issue;
  }

  async updateStatus(id: string, dto: UpdateIssueStatusDto) {
    const issue = await this.findOne(id);
    issue.status = dto.status;
    issue.resolutionNotes = dto.resolutionNotes;
    if (dto.severity) issue.severity = dto.severity;
    const saved = await this.issuesRepository.save(issue);

    const museum = await this.museumsService.findOne(issue.museumCode);
    if (dto.status === IssueStatus.IN_PROGRESS) {
      await this.museumsService.update(museum.code, { status: MuseumStatus.UNDER_MAINTENANCE });
    } else if (dto.status === IssueStatus.RESOLVED) {
      await this.museumsService.update(museum.code, { status: MuseumStatus.OPERATIONAL });
    }

    return saved;
  }

  async remove(id: string) {
    const issue = await this.findOne(id);
    if (issue.status !== IssueStatus.REPORTED) throw new BadRequestException('Only REPORTED (draft) issues can be deleted');

    if (issue.attachments?.length) {
      const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
      const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL', '');
      for (const attachment of issue.attachments) {
        try {
          const relativePath = attachment.fileUrl.replace(publicBaseUrl, '');
          const filePath = path.join(uploadDir, relativePath.replace(/^\//, ''));
          await fs.unlink(filePath);
        } catch {}
      }
    }

    await this.issuesRepository.remove(issue);
  }

  async addAttachment(issueId: string, file: Express.Multer.File, type: string) {
    await this.findOne(issueId);
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    await fs.mkdir(path.join(uploadDir, 'issues'), { recursive: true });

    const fileName = `museum-issue-${issueId}-${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, 'issues', fileName);
    await fs.writeFile(filePath, file.buffer);

    const attachment = this.attachmentsRepository.create({
      issueId,
      fileName: file.originalname,
      fileUrl: `${publicBaseUrl}/uploads/issues/${fileName}`,
      type: type as any,
      mimeType: file.mimetype,
      fileSize: file.size,
    });
    return this.attachmentsRepository.save(attachment);
  }
}



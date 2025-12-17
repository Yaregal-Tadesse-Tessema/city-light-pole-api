import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PoleIssue, IssueStatus } from './entities/pole-issue.entity';
import { PoleIssueAttachment } from './entities/pole-issue-attachment.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { PolesService } from '../poles/poles.service';
import { PoleStatus } from '../poles/entities/light-pole.entity';
import * as path from 'path';
import * as fs from 'fs/promises';
import { forwardRef, Inject } from '@nestjs/common';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(PoleIssue)
    private issuesRepository: Repository<PoleIssue>,
    @InjectRepository(PoleIssueAttachment)
    private attachmentsRepository: Repository<PoleIssueAttachment>,
    @Inject(forwardRef(() => PolesService))
    private polesService: PolesService,
    private configService: ConfigService,
  ) {}

  async create(createIssueDto: CreateIssueDto, reportedById: string) {
    // Verify pole exists
    const pole = await this.polesService.findOne(createIssueDto.poleCode);

    // Check if there's an unclosed issue for this pole
    const unclosedIssue = await this.issuesRepository.findOne({
      where: {
        poleCode: createIssueDto.poleCode,
        status: In([
          IssueStatus.REPORTED,
          IssueStatus.IN_PROGRESS,
        ]),
      },
    });

    if (unclosedIssue) {
      throw new BadRequestException(
        `Cannot create issue: There is already an unclosed issue (${unclosedIssue.status}) for pole ${createIssueDto.poleCode}. Please resolve or close the existing issue first.`,
      );
    }

    const issue = this.issuesRepository.create({
      poleCode: createIssueDto.poleCode,
      description: createIssueDto.description,
      severity: createIssueDto.severity,
      reportedById,
    });

    const savedIssue = await this.issuesRepository.save(issue);

    // Update pole status to FAULT_DAMAGED when issue is created
    await this.polesService.update(pole.code, {
      status: PoleStatus.FAULT_DAMAGED,
    });

    return this.issuesRepository.findOne({
      where: { id: savedIssue.id },
      relations: ['pole', 'reportedBy', 'attachments'],
    });
  }

  async findAll() {
    return this.issuesRepository.find({
      relations: ['pole', 'reportedBy', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const issue = await this.issuesRepository.findOne({
      where: { id },
      relations: ['pole', 'reportedBy', 'attachments'],
    });
    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }
    return issue;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateIssueStatusDto,
  ): Promise<PoleIssue> {
    const issue = await this.findOne(id);
    const oldStatus = issue.status;
    issue.status = updateStatusDto.status;
    issue.resolutionNotes = updateStatusDto.resolutionNotes;
    if (updateStatusDto.severity) {
      issue.severity = updateStatusDto.severity;
    }

    const savedIssue = await this.issuesRepository.save(issue);

    // Update pole status based on issue status
    const pole = await this.polesService.findOne(issue.poleCode);
    if (updateStatusDto.status === IssueStatus.IN_PROGRESS) {
      await this.polesService.update(pole.code, {
        status: PoleStatus.UNDER_MAINTENANCE,
      });
    } else if (updateStatusDto.status === IssueStatus.RESOLVED) {
      await this.polesService.update(pole.code, {
        status: PoleStatus.OPERATIONAL,
      });
    }

    return savedIssue;
  }

  // Update the most recent issue for a pole by code
  async updateLatestByPoleCode(
    poleCode: string,
    updateStatusDto: UpdateIssueStatusDto,
  ): Promise<PoleIssue | null> {
    const latest = await this.issuesRepository.findOne({
      where: { poleCode },
      order: { createdAt: 'DESC' },
    });
    if (!latest) {
      return null;
    }
    return this.updateStatus(latest.id, updateStatusDto);
  }

  async remove(id: string): Promise<void> {
    const issue = await this.findOne(id);
    
    // Only allow deletion of REPORTED (draft) issues
    if (issue.status !== IssueStatus.REPORTED) {
      throw new BadRequestException('Only REPORTED (draft) issues can be deleted');
    }

    // Delete attachments files if any
    if (issue.attachments && issue.attachments.length > 0) {
      const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
      const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL', '');
      
      for (const attachment of issue.attachments) {
        try {
          // Extract relative path from full URL
          const relativePath = attachment.fileUrl.replace(publicBaseUrl, '');
          const filePath = path.join(uploadDir, relativePath.replace(/^\//, ''));
          await fs.unlink(filePath);
        } catch (error) {
          // Ignore file deletion errors (file might not exist)
          console.error(`Failed to delete attachment file: ${attachment.fileUrl}`, error);
        }
      }
    }

    await this.issuesRepository.remove(issue);
  }

  async addAttachment(
    issueId: string,
    file: Express.Multer.File,
    type: string,
  ): Promise<PoleIssueAttachment> {
    const issue = await this.findOne(issueId);
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');

    // Create uploads directory if it doesn't exist
    await fs.mkdir(path.join(uploadDir, 'issues'), { recursive: true });

    // Save file
    const fileName = `issue-${issueId}-${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, 'issues', fileName);

    await fs.writeFile(filePath, file.buffer);

    // Create attachment record
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


import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PoleIssue, IssueStatus } from './entities/pole-issue.entity';
import { PoleIssueAttachment, AttachmentType } from './entities/pole-issue-attachment.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { QueryIssuesDto } from './dto/query-issues.dto';
import { PolesService } from '../poles/poles.service';
import { PoleStatus } from '../poles/entities/light-pole.entity';
import * as path from 'path';
import * as fs from 'fs/promises';
import { forwardRef, Inject } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { FileService } from '../file/file.service';

@Injectable()
export class IssuesService {
  private readonly logger = new Logger(IssuesService.name);

  constructor(
    @InjectRepository(PoleIssue)
    private issuesRepository: Repository<PoleIssue>,
    @InjectRepository(PoleIssueAttachment)
    private attachmentsRepository: Repository<PoleIssueAttachment>,
    @Inject(forwardRef(() => PolesService))
    private polesService: PolesService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    private fileService: FileService,
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

    // Handle attachments if provided
    if (createIssueDto.attachments && createIssueDto.attachments.length > 0) {
      const attachments = createIssueDto.attachments.map(fileUrl => {
        // Extract filename from URL
        const fileName = fileUrl.split('/').pop() || 'unknown';

        return this.attachmentsRepository.create({
          issueId: savedIssue.id,
          fileName,
          fileUrl,
          type: AttachmentType.BEFORE, // Default to BEFORE for new issues
        });
      });

      await this.attachmentsRepository.save(attachments);
    }

    // Send notification to issue managers
    await this.notificationsService.notifyIssueCreated(
      savedIssue.id,
      savedIssue.description,
      pole.code,
    );

    // Update pole status to FAULT_DAMAGED when issue is created
    await this.polesService.update(pole.code, {
      status: PoleStatus.FAULT_DAMAGED,
    });

    return this.issuesRepository.findOne({
      where: { id: savedIssue.id },
      relations: ['pole', 'reportedBy', 'attachments'],
    });
  }

  async findAll(queryDto: QueryIssuesDto = {}) {
    const { page = 1, limit = 10, search, status, severity, poleCode, createdAtFrom, createdAtTo, updatedAtFrom, updatedAtTo, sortBy, sortOrder } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.issuesRepository.createQueryBuilder('issue')
      .leftJoinAndSelect('issue.pole', 'pole')
      .leftJoinAndSelect('issue.reportedBy', 'reportedBy')
      .leftJoinAndSelect('issue.attachments', 'attachments');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('issue.status = :status', { status });
    }

    if (severity) {
      queryBuilder.andWhere('issue.severity = :severity', { severity });
    }

    if (poleCode) {
      queryBuilder.andWhere('issue.poleCode ILIKE :poleCode', { poleCode: `%${poleCode}%` });
    }

    if (createdAtFrom) {
      queryBuilder.andWhere('issue.createdAt >= :createdAtFrom', { createdAtFrom });
    }

    if (createdAtTo) {
      queryBuilder.andWhere('issue.createdAt <= :createdAtTo', { createdAtTo });
    }

    if (updatedAtFrom) {
      queryBuilder.andWhere('issue.updatedAt >= :updatedAtFrom', { updatedAtFrom });
    }

    if (updatedAtTo) {
      queryBuilder.andWhere('issue.updatedAt <= :updatedAtTo', { updatedAtTo });
    }

    if (search) {
      queryBuilder.andWhere(
        '(issue.description ILIKE :search OR issue.poleCode ILIKE :search OR pole.street ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply ordering
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder || 'DESC';

    // Handle sorting with proper joins for related fields
    if (sortField === 'reportedBy') {
      queryBuilder.orderBy('reportedBy.fullName', sortDirection);
    } else {
      // Map frontend field names to database column names
      const fieldMapping: { [key: string]: string } = {
        poleCode: 'issue.poleCode',
        description: 'issue.description',
        status: 'issue.status',
        severity: 'issue.severity',
        createdAt: 'issue.createdAt',
        updatedAt: 'issue.updatedAt',
      };

      const dbField = fieldMapping[sortField];
      if (dbField) {
        queryBuilder.orderBy(dbField, sortDirection);
      } else {
        // Default sort
        queryBuilder.orderBy('issue.createdAt', 'DESC');
      }
    }

    // Get paginated results
    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      page,
      limit,
      total,
      items,
    };
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

    // Upload file to MinIO using FileService
    const uploadResult = await this.fileService.uploadFile(file, 'issues');

    // Create attachment record with MinIO URL
    const attachment = this.attachmentsRepository.create({
      issueId,
      fileName: uploadResult.fileName, // MinIO object name
      fileUrl: uploadResult.url, // MinIO public access URL
      type: type as any,
      mimeType: uploadResult.mimeType,
      fileSize: uploadResult.size,
    });

    return this.attachmentsRepository.save(attachment);
  }

  async addAttachments(
    issueId: string,
    files: Express.Multer.File[],
    type: string,
  ): Promise<PoleIssueAttachment[]> {
    const issue = await this.findOne(issueId);

    // Upload all files to MinIO
    const uploadPromises = files.map(file => this.fileService.uploadFile(file, 'issues'));
    const uploadResults = await Promise.all(uploadPromises);

    // Create attachment records
    const attachments = uploadResults.map(result => {
      // Extract original filename from MinIO object name
      const originalName = result.fileName.split('/').pop()?.split('-').slice(3).join('-') || result.originalName;

      return this.attachmentsRepository.create({
        issueId,
        fileName: result.fileName, // MinIO object name
        fileUrl: result.url, // MinIO public access URL
        type: type as any,
        mimeType: result.mimeType,
        fileSize: result.size,
      });
    });

    return this.attachmentsRepository.save(attachments);
  }

  async deleteAttachment(issueId: string, attachmentId: string): Promise<void> {
    const issue = await this.findOne(issueId);

    // Check if issue is closed - don't allow deletion if closed
    if (issue.status === IssueStatus.CLOSED) {
      throw new BadRequestException('Cannot delete attachments from closed issues');
    }

    const attachment = await this.attachmentsRepository.findOne({
      where: { id: attachmentId, issueId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Delete file from MinIO
    try {
      await this.fileService.deleteFile(attachment.fileName);
    } catch (error) {
      // Log error but continue with database deletion
      this.logger.error(`Error deleting file from MinIO: ${attachment.fileName}`, error);
    }

    // Delete attachment record
    await this.attachmentsRepository.remove(attachment);
  }
}


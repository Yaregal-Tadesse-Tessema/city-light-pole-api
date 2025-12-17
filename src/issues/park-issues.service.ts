import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ParkIssue, IssueStatus } from './entities/park-issue.entity';
import { ParkIssueAttachment } from './entities/park-issue-attachment.entity';
import { CreateParkIssueDto } from './dto/create-park-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { ParksService } from '../parks/parks.service';
import { ParkStatus } from '../parks/entities/public-park.entity';
import * as path from 'path';
import * as fs from 'fs/promises';
import { forwardRef, Inject } from '@nestjs/common';

@Injectable()
export class ParkIssuesService {
  constructor(
    @InjectRepository(ParkIssue)
    private issuesRepository: Repository<ParkIssue>,
    @InjectRepository(ParkIssueAttachment)
    private attachmentsRepository: Repository<ParkIssueAttachment>,
    @Inject(forwardRef(() => ParksService))
    private parksService: ParksService,
    private configService: ConfigService,
  ) {}

  async create(createIssueDto: CreateParkIssueDto, reportedById: string) {
    // Verify park exists
    const park = await this.parksService.findOne(createIssueDto.parkCode);

    // Check if there's an unclosed issue for this park
    const unclosedIssue = await this.issuesRepository.findOne({
      where: {
        parkCode: createIssueDto.parkCode,
        status: In([
          IssueStatus.REPORTED,
          IssueStatus.IN_PROGRESS,
        ]),
      },
    });

    if (unclosedIssue) {
      throw new BadRequestException(
        `Cannot create issue: There is already an unclosed issue (${unclosedIssue.status}) for park ${createIssueDto.parkCode}. Please resolve or close the existing issue first.`,
      );
    }

    const issue = this.issuesRepository.create({
      parkCode: createIssueDto.parkCode,
      description: createIssueDto.description,
      severity: createIssueDto.severity,
      reportedById,
    });

    const savedIssue = await this.issuesRepository.save(issue);

    // Update park status to FAULT_DAMAGED when issue is created
    await this.parksService.update(park.code, {
      status: ParkStatus.FAULT_DAMAGED,
    });

    return this.issuesRepository.findOne({
      where: { id: savedIssue.id },
      relations: ['park', 'reportedBy', 'attachments'],
    });
  }

  async findAll() {
    return this.issuesRepository.find({
      relations: ['park', 'reportedBy', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const issue = await this.issuesRepository.findOne({
      where: { id },
      relations: ['park', 'reportedBy', 'attachments'],
    });
    if (!issue) {
      throw new NotFoundException(`Park issue with ID ${id} not found`);
    }
    return issue;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateIssueStatusDto,
  ): Promise<ParkIssue> {
    const issue = await this.findOne(id);
    const oldStatus = issue.status;
    issue.status = updateStatusDto.status;
    issue.resolutionNotes = updateStatusDto.resolutionNotes;
    if (updateStatusDto.severity) {
      issue.severity = updateStatusDto.severity;
    }

    const savedIssue = await this.issuesRepository.save(issue);

    // Update park status based on issue status
    const park = await this.parksService.findOne(issue.parkCode);
    if (updateStatusDto.status === IssueStatus.IN_PROGRESS) {
      await this.parksService.update(park.code, {
        status: ParkStatus.UNDER_MAINTENANCE,
      });
    } else if (updateStatusDto.status === IssueStatus.RESOLVED) {
      await this.parksService.update(park.code, {
        status: ParkStatus.OPERATIONAL,
      });
    }

    return savedIssue;
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
  ): Promise<ParkIssueAttachment> {
    const issue = await this.findOne(issueId);
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');

    // Create uploads directory if it doesn't exist
    await fs.mkdir(path.join(uploadDir, 'issues'), { recursive: true });

    // Save file
    const fileName = `park-issue-${issueId}-${Date.now()}-${file.originalname}`;
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



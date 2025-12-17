import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ParkingLotIssue, IssueStatus } from './entities/parking-lot-issue.entity';
import { ParkingLotIssueAttachment } from './entities/parking-lot-issue-attachment.entity';
import { CreateParkingLotIssueDto } from './dto/create-parking-lot-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { ParkingLotsService } from '../parking-lots/parking-lots.service';
import { ParkingLotStatus } from '../parking-lots/entities/parking-lot.entity';

@Injectable()
export class ParkingLotIssuesService {
  constructor(
    @InjectRepository(ParkingLotIssue)
    private issuesRepository: Repository<ParkingLotIssue>,
    @InjectRepository(ParkingLotIssueAttachment)
    private attachmentsRepository: Repository<ParkingLotIssueAttachment>,
    @Inject(forwardRef(() => ParkingLotsService))
    private parkingLotsService: ParkingLotsService,
    private configService: ConfigService,
  ) {}

  async create(dto: CreateParkingLotIssueDto, reportedById: string) {
    // Verify parking lot exists
    const lot = await this.parkingLotsService.findOne(dto.parkingLotCode);

    const unclosedIssue = await this.issuesRepository.findOne({
      where: {
        parkingLotCode: dto.parkingLotCode,
        status: In([IssueStatus.REPORTED, IssueStatus.IN_PROGRESS]),
      },
    });
    if (unclosedIssue) {
      throw new BadRequestException(
        `Cannot create issue: There is already an unclosed issue (${unclosedIssue.status}) for parking lot ${dto.parkingLotCode}.`,
      );
    }

    const issue = this.issuesRepository.create({
      parkingLotCode: dto.parkingLotCode,
      description: dto.description,
      severity: dto.severity,
      reportedById,
    });
    const savedIssue = await this.issuesRepository.save(issue);

    // Update asset status
    await this.parkingLotsService.update(lot.code, { status: ParkingLotStatus.FAULT_DAMAGED });

    return this.issuesRepository.findOne({
      where: { id: savedIssue.id },
      relations: ['parkingLot', 'reportedBy', 'attachments'],
    });
  }

  async findAll() {
    return this.issuesRepository.find({
      relations: ['parkingLot', 'reportedBy', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const issue = await this.issuesRepository.findOne({
      where: { id },
      relations: ['parkingLot', 'reportedBy', 'attachments'],
    });
    if (!issue) throw new NotFoundException(`Parking lot issue with ID ${id} not found`);
    return issue;
  }

  async updateStatus(id: string, dto: UpdateIssueStatusDto) {
    const issue = await this.findOne(id);
    issue.status = dto.status;
    issue.resolutionNotes = dto.resolutionNotes;
    if (dto.severity) issue.severity = dto.severity;

    const saved = await this.issuesRepository.save(issue);

    // Update asset status based on issue status
    const lot = await this.parkingLotsService.findOne(issue.parkingLotCode);
    if (dto.status === IssueStatus.IN_PROGRESS) {
      await this.parkingLotsService.update(lot.code, { status: ParkingLotStatus.UNDER_MAINTENANCE });
    } else if (dto.status === IssueStatus.RESOLVED) {
      await this.parkingLotsService.update(lot.code, { status: ParkingLotStatus.OPERATIONAL });
    }

    return saved;
  }

  async remove(id: string) {
    const issue = await this.findOne(id);
    if (issue.status !== IssueStatus.REPORTED) {
      throw new BadRequestException('Only REPORTED (draft) issues can be deleted');
    }

    // delete attachment files if any
    if (issue.attachments?.length) {
      const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
      const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL', '');
      for (const attachment of issue.attachments) {
        try {
          const relativePath = attachment.fileUrl.replace(publicBaseUrl, '');
          const filePath = path.join(uploadDir, relativePath.replace(/^\//, ''));
          await fs.unlink(filePath);
        } catch (e) {
          // ignore
        }
      }
    }

    await this.issuesRepository.remove(issue);
  }

  async addAttachment(issueId: string, file: Express.Multer.File, type: string) {
    const issue = await this.findOne(issueId);
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    await fs.mkdir(path.join(uploadDir, 'issues'), { recursive: true });

    const fileName = `parking-lot-issue-${issueId}-${Date.now()}-${file.originalname}`;
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



import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PublicToiletMaintenance } from './entities/public-toilet-maintenance.entity';
import { ScheduleStatus } from '../maintenance/entities/maintenance-schedule.entity';
import { MaintenanceAttachment } from '../maintenance/entities/maintenance-attachment.entity';
import { CreatePublicToiletMaintenanceDto } from './dto/create-public-toilet-maintenance.dto';
import { UpdatePublicToiletMaintenanceDto } from './dto/update-public-toilet-maintenance.dto';
import { PublicToiletsService } from './public-toilets.service';
import { PublicToiletIssuesService } from '../issues/public-toilet-issues.service';
import { PublicToiletStatus } from './entities/public-toilet.entity';
import { IssueStatus } from '../issues/entities/public-toilet-issue.entity';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class PublicToiletMaintenanceService {
  constructor(
    @InjectRepository(PublicToiletMaintenance)
    private maintenanceRepository: Repository<PublicToiletMaintenance>,
    @InjectRepository(MaintenanceAttachment)
    private attachmentsRepository: Repository<MaintenanceAttachment>,
    private configService: ConfigService,
    @Inject(forwardRef(() => PublicToiletsService))
    private publicToiletsService: PublicToiletsService,
    @Inject(forwardRef(() => PublicToiletIssuesService))
    private publicToiletIssuesService: PublicToiletIssuesService,
  ) {}

  async create(createDto: CreatePublicToiletMaintenanceDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(createDto.startDate);
    if (isNaN(startDate.getTime()) || startDate < today) {
      throw new BadRequestException('startDate must be in the future');
    }

    if (createDto.endDate) {
      const endDate = new Date(createDto.endDate);
      if (isNaN(endDate.getTime()) || endDate < today) {
        throw new BadRequestException('endDate must be in the future');
      }
      if (endDate < startDate) {
        throw new BadRequestException('endDate cannot be before startDate');
      }
    }

    await this.publicToiletsService.findOne(createDto.publicToiletCode);

    const existingActive = await this.maintenanceRepository.findOne({
      where: {
        publicToiletCode: createDto.publicToiletCode,
        status: In([ScheduleStatus.REQUESTED, ScheduleStatus.STARTED, ScheduleStatus.PAUSED]),
      },
    });
    if (existingActive) {
      throw new BadRequestException('There is already an active/requested maintenance schedule for this public toilet');
    }

    if (createDto.issueId) {
      const existingUncompleted = await this.maintenanceRepository.findOne({
        where: {
          issueId: createDto.issueId,
          status: In([ScheduleStatus.REQUESTED, ScheduleStatus.STARTED, ScheduleStatus.PAUSED]),
        },
      });
      if (existingUncompleted) {
        throw new BadRequestException('There is already an uncompleted maintenance record for this issue');
      }
      await this.publicToiletIssuesService.updateStatus(createDto.issueId, {
        status: IssueStatus.IN_PROGRESS,
      });
    }

    const maintenance = this.maintenanceRepository.create(createDto);
    return this.maintenanceRepository.save(maintenance);
  }

  async findAll() {
    return this.maintenanceRepository.find({
      relations: ['publicToilet', 'performedBy', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id },
      relations: ['publicToilet', 'performedBy', 'attachments'],
    });
    if (!maintenance) {
      throw new NotFoundException(`Public toilet maintenance with ID ${id} not found`);
    }
    return maintenance;
  }

  async update(id: string, updateDto: UpdatePublicToiletMaintenanceDto) {
    const maintenance = await this.findOne(id);
    const previousStatus = maintenance.status;

    const nextStatus = updateDto.status || maintenance.status;
    if (
      [ScheduleStatus.PAUSED, ScheduleStatus.COMPLETED].includes(nextStatus) &&
      !(updateDto.remark || maintenance.remark)
    ) {
      throw new BadRequestException('remark is required when status is PAUSED or COMPLETED');
    }

    Object.assign(maintenance, updateDto);
    const saved = await this.maintenanceRepository.save(maintenance);

    if (saved.status === ScheduleStatus.COMPLETED && previousStatus !== ScheduleStatus.COMPLETED) {
      if (saved.issueId) {
        await this.publicToiletIssuesService.updateStatus(saved.issueId, {
          status: IssueStatus.CLOSED,
          resolutionNotes: saved.remark,
        });
      }
      await this.publicToiletsService.update(saved.publicToiletCode, { status: PublicToiletStatus.OPERATIONAL });
    }

    return saved;
  }

  async remove(id: string) {
    const maintenance = await this.findOne(id);
    if (maintenance.status !== ScheduleStatus.REQUESTED) {
      throw new BadRequestException('Only REQUESTED maintenance schedules can be deleted');
    }
    await this.maintenanceRepository.remove(maintenance);
  }

  async addAttachment(id: string, file: Express.Multer.File) {
    const maintenance = await this.findOne(id);
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL', 'http://localhost:3011');

    await fs.mkdir(path.join(uploadDir, 'maintenance'), { recursive: true });

    const fileName = `maintenance-${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, 'maintenance', fileName);
    await fs.writeFile(filePath, file.buffer);

    const attachment = this.attachmentsRepository.create({
      publicToiletMaintenanceId: maintenance.id,
      fileName: file.originalname,
      fileUrl: `${publicBaseUrl}/uploads/maintenance/${fileName}`,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    return this.attachmentsRepository.save(attachment);
  }
}


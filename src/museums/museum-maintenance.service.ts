import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MuseumMaintenance } from './entities/museum-maintenance.entity';
import { ScheduleStatus } from '../maintenance/entities/maintenance-schedule.entity';
import { MaintenanceAttachment } from '../maintenance/entities/maintenance-attachment.entity';
import { CreateMuseumMaintenanceDto } from './dto/create-museum-maintenance.dto';
import { UpdateMuseumMaintenanceDto } from './dto/update-museum-maintenance.dto';
import { MuseumsService } from './museums.service';
import { MuseumIssuesService } from '../issues/museum-issues.service';
import { MuseumStatus } from './entities/museum.entity';
import { IssueStatus } from '../issues/entities/museum-issue.entity';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class MuseumMaintenanceService {
  constructor(
    @InjectRepository(MuseumMaintenance)
    private maintenanceRepository: Repository<MuseumMaintenance>,
    @InjectRepository(MaintenanceAttachment)
    private attachmentsRepository: Repository<MaintenanceAttachment>,
    private configService: ConfigService,
    @Inject(forwardRef(() => MuseumsService))
    private museumsService: MuseumsService,
    @Inject(forwardRef(() => MuseumIssuesService))
    private museumIssuesService: MuseumIssuesService,
  ) {}

  async create(createDto: CreateMuseumMaintenanceDto) {
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

    await this.museumsService.findOne(createDto.museumCode);

    const existingActive = await this.maintenanceRepository.findOne({
      where: {
        museumCode: createDto.museumCode,
        status: In([ScheduleStatus.REQUESTED, ScheduleStatus.STARTED, ScheduleStatus.PAUSED]),
      },
    });
    if (existingActive) {
      throw new BadRequestException('There is already an active/requested maintenance schedule for this museum');
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
      await this.museumIssuesService.updateStatus(createDto.issueId, {
        status: IssueStatus.IN_PROGRESS,
      });
    }

    const maintenance = this.maintenanceRepository.create(createDto);
    return this.maintenanceRepository.save(maintenance);
  }

  async findAll() {
    return this.maintenanceRepository.find({
      relations: ['museum', 'performedBy', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id },
      relations: ['museum', 'performedBy', 'attachments'],
    });
    if (!maintenance) {
      throw new NotFoundException(`Museum maintenance with ID ${id} not found`);
    }
    return maintenance;
  }

  async update(id: string, updateDto: UpdateMuseumMaintenanceDto) {
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
        await this.museumIssuesService.updateStatus(saved.issueId, {
          status: IssueStatus.CLOSED,
          resolutionNotes: saved.remark,
        });
      }
      await this.museumsService.update(saved.museumCode, { status: MuseumStatus.OPERATIONAL });
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
      museumMaintenanceId: maintenance.id,
      fileName: file.originalname,
      fileUrl: `${publicBaseUrl}/uploads/maintenance/${fileName}`,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    return this.attachmentsRepository.save(attachment);
  }
}


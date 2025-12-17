import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RiverSideProjectMaintenance } from './entities/river-side-project-maintenance.entity';
import { ScheduleStatus } from '../maintenance/entities/maintenance-schedule.entity';
import { MaintenanceAttachment } from '../maintenance/entities/maintenance-attachment.entity';
import { CreateRiverSideProjectMaintenanceDto } from './dto/create-river-side-project-maintenance.dto';
import { UpdateRiverSideProjectMaintenanceDto } from './dto/update-river-side-project-maintenance.dto';
import { RiverSideProjectsService } from './river-side-projects.service';
import { RiverSideProjectIssuesService } from '../issues/river-side-project-issues.service';
import { RiverSideProjectStatus } from './entities/river-side-project.entity';
import { IssueStatus } from '../issues/entities/river-side-project-issue.entity';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class RiverSideProjectMaintenanceService {
  constructor(
    @InjectRepository(RiverSideProjectMaintenance)
    private maintenanceRepository: Repository<RiverSideProjectMaintenance>,
    @InjectRepository(MaintenanceAttachment)
    private attachmentsRepository: Repository<MaintenanceAttachment>,
    private configService: ConfigService,
    @Inject(forwardRef(() => RiverSideProjectsService))
    private riverSideProjectsService: RiverSideProjectsService,
    @Inject(forwardRef(() => RiverSideProjectIssuesService))
    private riverSideProjectIssuesService: RiverSideProjectIssuesService,
  ) {}

  async create(createDto: CreateRiverSideProjectMaintenanceDto) {
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

    await this.riverSideProjectsService.findOne(createDto.riverSideProjectCode);

    const existingActive = await this.maintenanceRepository.findOne({
      where: {
        riverSideProjectCode: createDto.riverSideProjectCode,
        status: In([ScheduleStatus.REQUESTED, ScheduleStatus.STARTED, ScheduleStatus.PAUSED]),
      },
    });
    if (existingActive) {
      throw new BadRequestException('There is already an active/requested maintenance schedule for this river side project');
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
      await this.riverSideProjectIssuesService.updateStatus(createDto.issueId, {
        status: IssueStatus.IN_PROGRESS,
      });
    }

    const maintenance = this.maintenanceRepository.create(createDto);
    return this.maintenanceRepository.save(maintenance);
  }

  async findAll() {
    return this.maintenanceRepository.find({
      relations: ['riverSideProject', 'performedBy', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id },
      relations: ['riverSideProject', 'performedBy', 'attachments'],
    });
    if (!maintenance) {
      throw new NotFoundException(`River side project maintenance with ID ${id} not found`);
    }
    return maintenance;
  }

  async update(id: string, updateDto: UpdateRiverSideProjectMaintenanceDto) {
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
        await this.riverSideProjectIssuesService.updateStatus(saved.issueId, {
          status: IssueStatus.CLOSED,
          resolutionNotes: saved.remark,
        });
      }
      await this.riverSideProjectsService.update(saved.riverSideProjectCode, { status: RiverSideProjectStatus.OPERATIONAL });
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
      riverSideProjectMaintenanceId: maintenance.id,
      fileName: file.originalname,
      fileUrl: `${publicBaseUrl}/uploads/maintenance/${fileName}`,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    return this.attachmentsRepository.save(attachment);
  }
}


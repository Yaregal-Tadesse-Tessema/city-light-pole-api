import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ParkMaintenance } from './entities/park-maintenance.entity';
import { ScheduleStatus } from '../maintenance/entities/maintenance-schedule.entity';
import { MaintenanceAttachment } from '../maintenance/entities/maintenance-attachment.entity';
import { CreateParkMaintenanceDto } from './dto/create-park-maintenance.dto';
import { UpdateParkMaintenanceDto } from './dto/update-park-maintenance.dto';
import { ParksService } from './parks.service';
import { ParkIssuesService } from '../issues/park-issues.service';
import { ParkStatus } from './entities/public-park.entity';
import { IssueStatus } from '../issues/entities/park-issue.entity';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ParkMaintenanceService {
  constructor(
    @InjectRepository(ParkMaintenance)
    private maintenanceRepository: Repository<ParkMaintenance>,
    @InjectRepository(MaintenanceAttachment)
    private attachmentsRepository: Repository<MaintenanceAttachment>,
    private configService: ConfigService,
    @Inject(forwardRef(() => ParksService))
    private parksService: ParksService,
    @Inject(forwardRef(() => ParkIssuesService))
    private parkIssuesService: ParkIssuesService,
  ) {}

  async create(createDto: CreateParkMaintenanceDto) {
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

    // Verify park exists
    await this.parksService.findOne(createDto.parkCode);

    // Prevent multiple active schedules
    const existingActive = await this.maintenanceRepository.findOne({
      where: {
        parkCode: createDto.parkCode,
        status: In([ScheduleStatus.REQUESTED, ScheduleStatus.STARTED, ScheduleStatus.PAUSED]),
      },
    });
    if (existingActive) {
      throw new BadRequestException('There is already an active/requested maintenance schedule for this park');
    }

    // If linked to issue, update issue status
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
      await this.parkIssuesService.updateStatus(createDto.issueId, {
        status: IssueStatus.IN_PROGRESS,
      });
    }

    const maintenance = this.maintenanceRepository.create(createDto);
    return this.maintenanceRepository.save(maintenance);
  }

  async findAll() {
    return this.maintenanceRepository.find({
      relations: ['park', 'performedBy', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id },
      relations: ['park', 'performedBy', 'attachments'],
    });
    if (!maintenance) {
      throw new NotFoundException(`Park maintenance with ID ${id} not found`);
    }
    return maintenance;
  }

  async update(id: string, updateDto: UpdateParkMaintenanceDto) {
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

    // When completed: update issue and park status
    if (saved.status === ScheduleStatus.COMPLETED && previousStatus !== ScheduleStatus.COMPLETED) {
      if (saved.issueId) {
        await this.parkIssuesService.updateStatus(saved.issueId, {
          status: IssueStatus.CLOSED,
          resolutionNotes: saved.remark,
        });
      }
      await this.parksService.update(saved.parkCode, { status: ParkStatus.OPERATIONAL });
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
      parkMaintenanceId: maintenance.id,
      fileName: file.originalname,
      fileUrl: `${publicBaseUrl}/uploads/maintenance/${fileName}`,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    return this.attachmentsRepository.save(attachment);
  }
}


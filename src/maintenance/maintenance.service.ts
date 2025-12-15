import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MaintenanceSchedule, ScheduleStatus } from './entities/maintenance-schedule.entity';
import { MaintenanceLog, LogStatus } from './entities/maintenance-log.entity';
import { MaintenanceAttachment } from './entities/maintenance-attachment.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateLogDto } from './dto/create-log.dto';
import { QueryLogsDto } from './dto/query-logs.dto';
import { IssuesService } from '../issues/issues.service';
import { IssueStatus } from '../issues/entities/pole-issue.entity';
import { PolesService } from '../poles/poles.service';
import { PoleStatus } from '../poles/entities/light-pole.entity';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceSchedule)
    private schedulesRepository: Repository<MaintenanceSchedule>,
    @InjectRepository(MaintenanceLog)
    private logsRepository: Repository<MaintenanceLog>,
    @InjectRepository(MaintenanceAttachment)
    private attachmentsRepository: Repository<MaintenanceAttachment>,
    private configService: ConfigService,
    @Inject(forwardRef(() => IssuesService))
    private issuesService: IssuesService,
    private polesService: PolesService,
  ) {}

  // Schedules
  async createSchedule(createScheduleDto: CreateScheduleDto) {
    // Validate dates: must be in the future, and endDate after startDate (if provided)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(createScheduleDto.startDate);
    if (isNaN(startDate.getTime()) || startDate < today) {
      throw new BadRequestException('startDate must be in the future');
    }

    if (createScheduleDto.endDate) {
      const endDate = new Date(createScheduleDto.endDate);
      if (isNaN(endDate.getTime()) || endDate < today) {
        throw new BadRequestException('endDate must be in the future');
      }
      if (endDate < startDate) {
        throw new BadRequestException('endDate cannot be before startDate');
      }
    }

    // Prevent multiple active/requested/started schedules for the same pole/issue
    if (createScheduleDto.poleCode) {
      const existingActive = await this.schedulesRepository.findOne({
        where: {
          poleCode: createScheduleDto.poleCode,
          status: In([ScheduleStatus.REQUESTED, ScheduleStatus.STARTED, ScheduleStatus.PAUSED]),
        },
      });
      if (existingActive) {
        throw new BadRequestException(
          'There is already an active/requested maintenance schedule for this pole/issue',
        );
      }
    }

    // If linked to an issue, update issue status to IN_PROGRESS
    if (createScheduleDto.issueId) {
      await this.issuesService.updateStatus(createScheduleDto.issueId, {
        status: IssueStatus.IN_PROGRESS,
      });
    }

    const schedule = this.schedulesRepository.create(createScheduleDto);
    return this.schedulesRepository.save(schedule);
  }

  async findAllSchedules() {
    return this.schedulesRepository.find({
      relations: ['logs'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneSchedule(id: string) {
    const schedule = await this.schedulesRepository.findOne({
      where: { id },
      relations: ['logs'],
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return schedule;
  }

  async updateSchedule(id: string, updateScheduleDto: UpdateScheduleDto) {
    const schedule = await this.findOneSchedule(id);
    const previousStatus = schedule.status;

    // If status change to PAUSED or COMPLETED, require remark
    const nextStatus = updateScheduleDto.status || schedule.status;
    if (
      [ScheduleStatus.PAUSED, ScheduleStatus.COMPLETED].includes(nextStatus) &&
      !(updateScheduleDto.remark || schedule.remark)
    ) {
      throw new BadRequestException('remark is required when status is PAUSED or COMPLETED');
    }

    Object.assign(schedule, updateScheduleDto);
    const saved = await this.schedulesRepository.save(schedule);

    // When completed: set linked issue to CLOSED and pole to ACTIVE
    if (saved.status === ScheduleStatus.COMPLETED) {
      if (saved.issueId) {
        await this.issuesService.updateStatus(saved.issueId, {
          status: IssueStatus.CLOSED,
          resolutionNotes: saved.remark,
        });
      } else if (saved.poleCode) {
        await this.issuesService.updateLatestByPoleCode(saved.poleCode, {
          status: IssueStatus.CLOSED,
          resolutionNotes: saved.remark,
        });
      }
      if (saved.poleCode) {
        await this.polesService.update(saved.poleCode, { status: PoleStatus.ACTIVE });
      }
    }

    return saved;
  }

  // Logs
  async createLog(createLogDto: CreateLogDto, performedById: string) {
    if (createLogDto.status === LogStatus.PAUSED && !createLogDto.notes) {
      throw new BadRequestException('notes is required when status is PAUSED');
    }

    const log = this.logsRepository.create({
      poleCode: createLogDto.poleCode,
      scheduleId: createLogDto.scheduleId,
      description: createLogDto.description,
      status: createLogDto.status,
      scheduledDate: createLogDto.scheduledDate,
      completedDate: createLogDto.completedDate,
      cost: createLogDto.cost,
      notes: createLogDto.notes,
      performedById,
    });
    return this.logsRepository.save(log);
  }

  async findAllLogs(queryDto: QueryLogsDto) {
    const { page = 1, limit = 10, poleCode, status } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.logsRepository.createQueryBuilder('log');

    if (poleCode) {
      queryBuilder.andWhere('log.poleCode = :poleCode', { poleCode });
    }

    if (status) {
      queryBuilder.andWhere('log.status = :status', { status });
    }

    const [data, total] = await queryBuilder
      .leftJoinAndSelect('log.pole', 'pole')
      .leftJoinAndSelect('log.performedBy', 'performedBy')
      .leftJoinAndSelect('log.attachments', 'attachments')
      .skip(skip)
      .take(limit)
      .orderBy('log.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneLog(id: string) {
    const log = await this.logsRepository.findOne({
      where: { id },
      relations: ['pole', 'performedBy', 'schedule', 'attachments'],
    });
    if (!log) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }
    return log;
  }

  async addAttachment(
    logId: string,
    file: Express.Multer.File,
  ): Promise<MaintenanceAttachment> {
    const log = await this.findOneLog(logId);
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');

    await fs.mkdir(path.join(uploadDir, 'maintenance'), { recursive: true });

    const fileName = `maintenance-${logId}-${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, 'maintenance', fileName);

    await fs.writeFile(filePath, file.buffer);

    const attachment = this.attachmentsRepository.create({
      logId,
      fileName: file.originalname,
      fileUrl: `${publicBaseUrl}/uploads/maintenance/${fileName}`,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    return this.attachmentsRepository.save(attachment);
  }
}



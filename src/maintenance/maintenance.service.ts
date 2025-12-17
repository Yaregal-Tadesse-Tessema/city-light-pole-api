import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MaintenanceSchedule } from './entities/maintenance-schedule.entity';
import { ScheduleStatus } from './enums/maintenance.enums';
import { MaintenanceAttachment } from './entities/maintenance-attachment.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { IssuesService } from '../issues/issues.service';
import { ParkIssuesService } from '../issues/park-issues.service';
import { ParkingLotIssuesService } from '../issues/parking-lot-issues.service';
import { MuseumIssuesService } from '../issues/museum-issues.service';
import { PublicToiletIssuesService } from '../issues/public-toilet-issues.service';
import { FootballFieldIssuesService } from '../issues/football-field-issues.service';
import { RiverSideProjectIssuesService } from '../issues/river-side-project-issues.service';
import { IssueStatus } from '../issues/entities/pole-issue.entity';
import { PolesService } from '../poles/poles.service';
import { ParksService } from '../parks/parks.service';
import { ParkingLotsService } from '../parking-lots/parking-lots.service';
import { MuseumsService } from '../museums/museums.service';
import { PublicToiletsService } from '../public-toilets/public-toilets.service';
import { FootballFieldsService } from '../football-fields/football-fields.service';
import { RiverSideProjectsService } from '../river-side-projects/river-side-projects.service';
import { PoleStatus } from '../poles/entities/light-pole.entity';
import { ParkStatus } from '../parks/entities/public-park.entity';
import { ParkingLotStatus } from '../parking-lots/entities/parking-lot.entity';
import { MuseumStatus } from '../museums/entities/museum.entity';
import { PublicToiletStatus } from '../public-toilets/entities/public-toilet.entity';
import { FootballFieldStatus } from '../football-fields/entities/football-field.entity';
import { RiverSideProjectStatus } from '../river-side-projects/entities/river-side-project.entity';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceSchedule)
    private schedulesRepository: Repository<MaintenanceSchedule>,
    @InjectRepository(MaintenanceAttachment)
    private attachmentsRepository: Repository<MaintenanceAttachment>,
    private configService: ConfigService,
    @Inject(forwardRef(() => IssuesService))
    private issuesService: IssuesService,
    @Inject(forwardRef(() => ParkIssuesService))
    private parkIssuesService: ParkIssuesService,
    @Inject(forwardRef(() => ParkingLotIssuesService))
    private parkingLotIssuesService: ParkingLotIssuesService,
    @Inject(forwardRef(() => MuseumIssuesService))
    private museumIssuesService: MuseumIssuesService,
    @Inject(forwardRef(() => PublicToiletIssuesService))
    private publicToiletIssuesService: PublicToiletIssuesService,
    @Inject(forwardRef(() => FootballFieldIssuesService))
    private footballFieldIssuesService: FootballFieldIssuesService,
    @Inject(forwardRef(() => RiverSideProjectIssuesService))
    private riverSideProjectIssuesService: RiverSideProjectIssuesService,
    private polesService: PolesService,
    private parksService: ParksService,
    private parkingLotsService: ParkingLotsService,
    private museumsService: MuseumsService,
    private publicToiletsService: PublicToiletsService,
    private footballFieldsService: FootballFieldsService,
    private riverSideProjectsService: RiverSideProjectsService,
  ) {}

  private async updateAnyIssueStatus(issueId: string, payload: { status: IssueStatus; resolutionNotes?: string }) {
    // Try each issue service until one succeeds
    try {
      return await this.issuesService.updateStatus(issueId, payload);
    } catch (_) {}
    try {
      return await this.parkIssuesService.updateStatus(issueId, payload);
    } catch (_) {}
    try {
      return await this.parkingLotIssuesService.updateStatus(issueId, payload);
    } catch (_) {}
    try {
      return await this.museumIssuesService.updateStatus(issueId, payload);
    } catch (_) {}
    try {
      return await this.publicToiletIssuesService.updateStatus(issueId, payload);
    } catch (_) {}
    try {
      return await this.footballFieldIssuesService.updateStatus(issueId, payload);
    } catch (_) {}
    return await this.riverSideProjectIssuesService.updateStatus(issueId, payload);
  }

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

    // Prevent multiple active/requested/started schedules for the same pole
    if (createScheduleDto.poleCode) {
      const existingActive = await this.schedulesRepository.findOne({
        where: {
          poleCode: createScheduleDto.poleCode,
          status: In([ScheduleStatus.REQUESTED, ScheduleStatus.STARTED, ScheduleStatus.PAUSED]),
        },
      });
      if (existingActive) {
        throw new BadRequestException(
          'There is already an active/requested maintenance schedule for this pole',
        );
      }
    }

    // Prevent multiple active/requested/started schedules for the same park
    if (createScheduleDto.parkCode) {
      const existingActive = await this.schedulesRepository.findOne({
        where: {
          parkCode: createScheduleDto.parkCode,
          status: In([ScheduleStatus.REQUESTED, ScheduleStatus.STARTED, ScheduleStatus.PAUSED]),
        },
      });
      if (existingActive) {
        throw new BadRequestException(
          'There is already an active/requested maintenance schedule for this park',
        );
      }
    }

    // Prevent multiple active/requested/started schedules for the same parking lot
    if (createScheduleDto.parkingLotCode) {
      const existingActive = await this.schedulesRepository.findOne({
        where: {
          parkingLotCode: createScheduleDto.parkingLotCode,
          status: In([ScheduleStatus.REQUESTED, ScheduleStatus.STARTED, ScheduleStatus.PAUSED]),
        },
      });
      if (existingActive) {
        throw new BadRequestException(
          'There is already an active/requested maintenance schedule for this parking lot',
        );
      }
    }

    // Prevent multiple active/requested/started schedules for the same museum
    if (createScheduleDto.museumCode) {
      const existingActive = await this.schedulesRepository.findOne({
        where: {
          museumCode: createScheduleDto.museumCode,
          status: In([ScheduleStatus.REQUESTED, ScheduleStatus.STARTED, ScheduleStatus.PAUSED]),
        },
      });
      if (existingActive) {
        throw new BadRequestException(
          'There is already an active/requested maintenance schedule for this museum',
        );
      }
    }

    // Prevent multiple active/requested/started schedules for the same public toilet
    if (createScheduleDto.publicToiletCode) {
      const existingActive = await this.schedulesRepository.findOne({
        where: {
          publicToiletCode: createScheduleDto.publicToiletCode,
          status: In([ScheduleStatus.REQUESTED, ScheduleStatus.STARTED, ScheduleStatus.PAUSED]),
        },
      });
      if (existingActive) {
        throw new BadRequestException(
          'There is already an active/requested maintenance schedule for this public toilet',
        );
      }
    }

    // Prevent multiple active/requested/started schedules for the same football field
    if (createScheduleDto.footballFieldCode) {
      const existingActive = await this.schedulesRepository.findOne({
        where: {
          footballFieldCode: createScheduleDto.footballFieldCode,
          status: In([ScheduleStatus.REQUESTED, ScheduleStatus.STARTED, ScheduleStatus.PAUSED]),
        },
      });
      if (existingActive) {
        throw new BadRequestException(
          'There is already an active/requested maintenance schedule for this football field',
        );
      }
    }

    // Prevent multiple active/requested/started schedules for the same river side project
    if (createScheduleDto.riverSideProjectCode) {
      const existingActive = await this.schedulesRepository.findOne({
        where: {
          riverSideProjectCode: createScheduleDto.riverSideProjectCode,
          status: In([ScheduleStatus.REQUESTED, ScheduleStatus.STARTED, ScheduleStatus.PAUSED]),
        },
      });
      if (existingActive) {
        throw new BadRequestException(
          'There is already an active/requested maintenance schedule for this river side project',
        );
      }
    }

    // Prevent multiple uncompleted maintenance records for the same issue
    if (createScheduleDto.issueId) {
      const existingUncompleted = await this.schedulesRepository.findOne({
        where: {
          issueId: createScheduleDto.issueId,
          status: In([ScheduleStatus.REQUESTED, ScheduleStatus.STARTED, ScheduleStatus.PAUSED]),
        },
      });
      if (existingUncompleted) {
        throw new BadRequestException(
          `Cannot create maintenance: There is already an uncompleted maintenance record (${existingUncompleted.status}) for this issue. Please complete or cancel the existing maintenance first.`,
        );
      }

      // Update issue status to IN_PROGRESS
      await this.updateAnyIssueStatus(createScheduleDto.issueId, {
        status: IssueStatus.IN_PROGRESS,
      });
    }

    const schedule = this.schedulesRepository.create(createScheduleDto);
    return this.schedulesRepository.save(schedule);
  }

  async findAllSchedules(type?: string) {
    const qb = this.schedulesRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.pole', 'pole')
      .leftJoinAndSelect('schedule.park', 'park')
      .leftJoinAndSelect('schedule.parkingLot', 'parkingLot')
      .leftJoinAndSelect('schedule.museum', 'museum')
      .leftJoinAndSelect('schedule.publicToilet', 'publicToilet')
      .leftJoinAndSelect('schedule.footballField', 'footballField')
      .leftJoinAndSelect('schedule.riverSideProject', 'riverSideProject')
      .leftJoinAndSelect('schedule.performedBy', 'performedBy')
      .leftJoinAndSelect('schedule.attachments', 'attachments')
      .orderBy('schedule.createdAt', 'DESC');

    // Filter by asset type (derived from which code column is set)
    const t = (type || '').toLowerCase();
    if (t) {
      if (t === 'pole' || t === 'light' || t === 'light-pole' || t === 'lightpole') {
        qb.andWhere('schedule.poleCode IS NOT NULL');
      } else if (t === 'park' || t === 'public-park' || t === 'publicpark') {
        qb.andWhere('schedule.parkCode IS NOT NULL');
      } else if (t === 'parking' || t === 'parking-lot' || t === 'parkinglot') {
        qb.andWhere('schedule.parkingLotCode IS NOT NULL');
      } else if (t === 'museum' || t === 'museums') {
        qb.andWhere('schedule.museumCode IS NOT NULL');
      } else if (t === 'toilet' || t === 'public-toilet' || t === 'publictoilet') {
        qb.andWhere('schedule.publicToiletCode IS NOT NULL');
      } else if (t === 'football' || t === 'football-field' || t === 'footballfield') {
        qb.andWhere('schedule.footballFieldCode IS NOT NULL');
      } else if (t === 'river' || t === 'river-side-project' || t === 'riverside' || t === 'river-side') {
        qb.andWhere('schedule.riverSideProjectCode IS NOT NULL');
      }
    }

    return qb.getMany();
  }

  async findOneSchedule(id: string) {
    const schedule = await this.schedulesRepository.findOne({
      where: { id },
      relations: [
        'pole',
        'park',
        'parkingLot',
        'museum',
        'publicToilet',
        'footballField',
        'riverSideProject',
        'performedBy',
        'attachments',
      ],
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

    // Preserve issueId, poleCode, and parkCode - don't allow them to be cleared
    const preservedIssueId = schedule.issueId;
    const preservedPoleCode = schedule.poleCode;
    const preservedParkCode = schedule.parkCode;
    const preservedParkingLotCode = schedule.parkingLotCode;
    const preservedMuseumCode = schedule.museumCode;
    const preservedPublicToiletCode = schedule.publicToiletCode;
    const preservedFootballFieldCode = schedule.footballFieldCode;
    const preservedRiverSideProjectCode = schedule.riverSideProjectCode;

    Object.assign(schedule, updateScheduleDto);

    // Ensure issueId, poleCode, and parkCode are never cleared during update
    if (preservedIssueId) {
      schedule.issueId = preservedIssueId;
    }
    if (preservedPoleCode) {
      schedule.poleCode = preservedPoleCode;
    }
    if (preservedParkCode) {
      schedule.parkCode = preservedParkCode;
    }
    if (preservedParkingLotCode) {
      schedule.parkingLotCode = preservedParkingLotCode;
    }
    if (preservedMuseumCode) {
      schedule.museumCode = preservedMuseumCode;
    }
    if (preservedPublicToiletCode) {
      schedule.publicToiletCode = preservedPublicToiletCode;
    }
    if (preservedFootballFieldCode) {
      schedule.footballFieldCode = preservedFootballFieldCode;
    }
    if (preservedRiverSideProjectCode) {
      schedule.riverSideProjectCode = preservedRiverSideProjectCode;
    }
    const saved = await this.schedulesRepository.save(schedule);

    // When completed: set linked issue to CLOSED and pole/park to ACTIVE
    if (saved.status === ScheduleStatus.COMPLETED) {
      if (saved.issueId) {
        await this.updateAnyIssueStatus(saved.issueId, {
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
      if (saved.parkCode) {
        await this.parksService.update(saved.parkCode, { status: ParkStatus.ACTIVE });
      }
      if (saved.parkingLotCode) {
        await this.parkingLotsService.update(saved.parkingLotCode, { status: ParkingLotStatus.OPERATIONAL });
      }
      if (saved.museumCode) {
        await this.museumsService.update(saved.museumCode, { status: MuseumStatus.OPERATIONAL });
      }
      if (saved.publicToiletCode) {
        await this.publicToiletsService.update(saved.publicToiletCode, { status: PublicToiletStatus.OPERATIONAL });
      }
      if (saved.footballFieldCode) {
        await this.footballFieldsService.update(saved.footballFieldCode, { status: FootballFieldStatus.OPERATIONAL });
      }
      if (saved.riverSideProjectCode) {
        await this.riverSideProjectsService.update(saved.riverSideProjectCode, { status: RiverSideProjectStatus.OPERATIONAL });
      }
    }

    return saved;
  }

  async removeSchedule(id: string): Promise<void> {
    const schedule = await this.findOneSchedule(id);
    
    // Only allow deletion of REQUESTED (draft) schedules
    if (schedule.status !== ScheduleStatus.REQUESTED) {
      throw new BadRequestException('Only REQUESTED maintenance schedules can be deleted');
    }

    // If linked to an issue, revert issue status back to REPORTED
    if (schedule.issueId) {
      try {
        await this.updateAnyIssueStatus(schedule.issueId, {
          status: IssueStatus.REPORTED,
        });
      } catch (error) {
        // Log error but don't fail deletion if issue update fails
        console.error(`Failed to update issue status for issue ${schedule.issueId}:`, error);
      }
    }

    // Delete attachments files if any
    if (schedule.attachments && schedule.attachments.length > 0) {
      const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
      const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL', '');
      
      for (const attachment of schedule.attachments) {
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

    await this.schedulesRepository.remove(schedule);
  }

  async addAttachment(
    scheduleId: string,
    file: Express.Multer.File,
  ): Promise<MaintenanceAttachment> {
    const schedule = await this.findOneSchedule(scheduleId);
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');

    await fs.mkdir(path.join(uploadDir, 'maintenance'), { recursive: true });

    const fileName = `maintenance-${scheduleId}-${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, 'maintenance', fileName);

    await fs.writeFile(filePath, file.buffer);

    const attachment = this.attachmentsRepository.create({
      scheduleId,
      fileName: file.originalname,
      fileUrl: `${publicBaseUrl}/uploads/maintenance/${fileName}`,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    return this.attachmentsRepository.save(attachment);
  }
}



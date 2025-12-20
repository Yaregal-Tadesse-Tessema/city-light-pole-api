import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { LightPole, PoleStatus } from './entities/light-pole.entity';
import { CreatePoleDto } from './dto/create-pole.dto';
import { UpdatePoleDto } from './dto/update-pole.dto';
import { QueryPolesDto } from './dto/query-poles.dto';
import { PoleIssue, IssueStatus } from '../issues/entities/pole-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class PolesService {
  constructor(
    @InjectRepository(LightPole)
    private polesRepository: Repository<LightPole>,
    @InjectRepository(PoleIssue)
    private issuesRepository: Repository<PoleIssue>,
    @InjectRepository(MaintenanceSchedule)
    private maintenanceSchedulesRepository: Repository<MaintenanceSchedule>,
    private configService: ConfigService,
  ) {}

  async create(createPoleDto: CreatePoleDto): Promise<LightPole> {
    // Check if code already exists
    const existing = await this.polesRepository.findOne({
      where: { code: createPoleDto.code },
    });
    if (existing) {
      throw new BadRequestException(`Pole with code ${createPoleDto.code} already exists`);
    }

    // Set default status if not provided
    // Only include GPS coordinates if they are provided
    const poleData: any = {
      code: createPoleDto.code,
      subcity: createPoleDto.subcity,
      street: createPoleDto.street,
      heightMeters: createPoleDto.heightMeters,
      powerRatingWatt: createPoleDto.powerRatingWatt,
      poleType: createPoleDto.poleType || 'STANDARD',
      lampType: createPoleDto.lampType || 'LED',
      hasLedDisplay: createPoleDto.hasLedDisplay || false,
      status: createPoleDto.status || PoleStatus.OPERATIONAL,
    };

    // Add GPS coordinates only if provided
    if (createPoleDto.gpsLat !== undefined && createPoleDto.gpsLat !== null) {
      poleData.gpsLat = createPoleDto.gpsLat;
    }
    if (createPoleDto.gpsLng !== undefined && createPoleDto.gpsLng !== null) {
      poleData.gpsLng = createPoleDto.gpsLng;
    }

    // Add LED fields only if hasLedDisplay is true
    if (createPoleDto.hasLedDisplay) {
      if (createPoleDto.ledModel) {
        poleData.ledModel = createPoleDto.ledModel;
      }
      if (createPoleDto.ledInstallationDate) {
        poleData.ledInstallationDate = new Date(createPoleDto.ledInstallationDate);
      }
      if (createPoleDto.ledStatus) {
        poleData.ledStatus = createPoleDto.ledStatus;
      }
    }

    // Add new fields
    if (createPoleDto.numberOfPoles !== undefined) {
      poleData.numberOfPoles = createPoleDto.numberOfPoles;
    }
    poleData.hasCamera = createPoleDto.hasCamera || false;
    if (createPoleDto.hasCamera && createPoleDto.cameraInstallationDate) {
      poleData.cameraInstallationDate = new Date(createPoleDto.cameraInstallationDate);
    }
    poleData.hasPhoneCharger = createPoleDto.hasPhoneCharger || false;
    if (createPoleDto.hasPhoneCharger && createPoleDto.phoneChargerInstallationDate) {
      poleData.phoneChargerInstallationDate = new Date(createPoleDto.phoneChargerInstallationDate);
    }
    if (createPoleDto.poleInstallationDate) {
      poleData.poleInstallationDate = new Date(createPoleDto.poleInstallationDate);
    }

    const pole = this.polesRepository.create(poleData);
    // TypeORM create can return array if passed array, but we're passing object so it's single entity
    const poleEntity = Array.isArray(pole) ? pole[0] : pole;
    return await this.polesRepository.save(poleEntity);
  }

  async findAll(queryDto: QueryPolesDto) {
    const { page = 1, limit = 10, subcity, status, search, street, hasLedDisplay, sortBy, sortDirection } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.polesRepository.createQueryBuilder('pole');

    if (subcity) {
      queryBuilder.andWhere('pole.subcity = :subcity', { subcity });
    }

    if (status) {
      queryBuilder.andWhere('pole.status = :status', { status });
    }

    if (street) {
      queryBuilder.andWhere('pole.street = :street', { street });
    }

    if (hasLedDisplay !== undefined && hasLedDisplay !== null) {
      // Handle string from query params
      const hasLedDisplayBool = hasLedDisplay === 'true' || hasLedDisplay === '1';
      queryBuilder.andWhere('pole.hasLedDisplay = :hasLedDisplay', { hasLedDisplay: hasLedDisplayBool });
    }

    if (search) {
      queryBuilder.andWhere(
        '(pole.code ILIKE :search OR pole.street ILIKE :search OR pole.subcity ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    if (sortBy && sortDirection) {
      queryBuilder.orderBy(`pole.${sortBy}`, sortDirection.toUpperCase() as 'ASC' | 'DESC');
    } else {
      queryBuilder.orderBy('pole.createdAt', 'DESC');
    }

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

  private async findOneByCode(code: string): Promise<LightPole> {
    const pole = await this.polesRepository.findOne({
      where: { code },
    });
    if (!pole) {
      throw new NotFoundException(`Pole with code ${code} not found`);
    }
    return pole;
  }

  async findOne(code: string) {
    const pole = await this.findOneByCode(code);

    // Get latest issues (last 5)
    const latestIssues = await this.issuesRepository.find({
      where: { poleCode: code },
      relations: ['reportedBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Get latest maintenance schedules (last 5)
    const latestMaintenanceSchedules = await this.maintenanceSchedulesRepository.find({
      where: { poleCode: code },
      relations: ['performedBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Get counts
    const totalIssues = await this.issuesRepository.count({
      where: { poleCode: code },
    });

    const openIssues = await this.issuesRepository.count({
      where: {
        poleCode: code,
        status: In([
          IssueStatus.REPORTED,
          IssueStatus.IN_PROGRESS,
        ]),
      },
    });

    const totalMaintenanceSchedules = await this.maintenanceSchedulesRepository.count({
      where: { poleCode: code },
    });

    return {
      ...pole,
      latestIssues,
      latestMaintenanceSchedules,
      counts: {
        totalIssues,
        openIssues,
        totalMaintenanceSchedules,
      },
    };
  }

  async update(code: string, updatePoleDto: UpdatePoleDto): Promise<LightPole> {
    const pole = await this.findOneByCode(code);
    Object.assign(pole, updatePoleDto);
    return this.polesRepository.save(pole);
  }

  async remove(code: string): Promise<void> {
    const pole = await this.findOneByCode(code);
    await this.polesRepository.remove(pole);
  }

  async generateQR(code: string): Promise<LightPole> {
    const pole = await this.findOneByCode(code);
    const frontendBaseUrl = this.configService.get<string>('FRONTEND_BASE_URL', 'http://localhost:5173');
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');

    // Create uploads directory if it doesn't exist
    await fs.mkdir(path.join(uploadDir, 'qr'), { recursive: true });

    // Generate QR payload - store the frontend URL directly
    const frontendUrl = `${frontendBaseUrl}/poles/${pole.code}`;
    const qrPayload = frontendUrl; // Store just the URL, not JSON

    // Generate QR code image
    const qrFileName = `qr-${pole.code}-${Date.now()}.png`;
    const qrFilePath = path.join(uploadDir, 'qr', qrFileName);

    await QRCode.toFile(qrFilePath, qrPayload, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 300,
      margin: 1,
    });

    // Update pole with QR data
    pole.qrPayload = qrPayload;
    pole.qrImageUrl = `${publicBaseUrl}/uploads/qr/${qrFileName}`;

    return this.polesRepository.save(pole);
  }

  async getMaintenanceHistory(code: string) {
    // Verify pole exists
    await this.findOneByCode(code);

    // Get all maintenance schedules (logs) for this pole
    const schedules = await this.maintenanceSchedulesRepository.find({
      where: { poleCode: code },
      relations: ['performedBy', 'attachments'],
      order: { createdAt: 'DESC' },
    });

    return schedules;
  }

  async getPolesBySubcityWithIssues(subcity: string) {
    // Get poles by subcity that have at least one issue
    const poles = await this.polesRepository
      .createQueryBuilder('pole')
      .innerJoin('pole.issues', 'issue')
      .where('pole.subcity = :subcity', { subcity })
      .select([
        'pole.code',
        'pole.subcity',
        'pole.street',
        'pole.status',
        'pole.gpsLat',
        'pole.gpsLng',
        'pole.poleType',
        'pole.heightMeters',
        'pole.lampType',
        'pole.powerRatingWatt',
        'pole.hasLedDisplay',
        'pole.ledModel',
        'pole.qrImageUrl',
        'pole.createdAt',
        'pole.updatedAt',
      ])
      .distinct(true)
      .orderBy('pole.createdAt', 'DESC')
      .getMany();

    return poles;
  }
}


import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PublicPark, ParkStatus } from './entities/public-park.entity';
import { CreateParkDto } from './dto/create-park.dto';
import { UpdateParkDto } from './dto/update-park.dto';
import { QueryParksDto } from './dto/query-parks.dto';
import { ParkIssue, IssueStatus } from '../issues/entities/park-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ParksService {
  constructor(
    @InjectRepository(PublicPark)
    private parksRepository: Repository<PublicPark>,
    @InjectRepository(ParkIssue)
    private issuesRepository: Repository<ParkIssue>,
    @InjectRepository(MaintenanceSchedule)
    private maintenanceSchedulesRepository: Repository<MaintenanceSchedule>,
    private configService: ConfigService,
  ) {}

  async create(createParkDto: CreateParkDto): Promise<PublicPark> {
    // Check if code already exists
    const existing = await this.parksRepository.findOne({
      where: { code: createParkDto.code },
    });
    if (existing) {
      throw new BadRequestException(`Park with code ${createParkDto.code} already exists`);
    }

    // Set default status if not provided
    const parkData: any = {
      code: createParkDto.code,
      name: createParkDto.name,
      district: createParkDto.district,
      street: createParkDto.street,
      areaHectares: createParkDto.areaHectares,
      parkType: createParkDto.parkType || 'COMMUNITY',
      hasPaidEntrance: createParkDto.hasPaidEntrance || false,
      status: createParkDto.status || ParkStatus.ACTIVE,
    };

    // Add entrance fee only if hasPaidEntrance is true
    if (createParkDto.hasPaidEntrance && createParkDto.entranceFee !== undefined && createParkDto.entranceFee !== null) {
      parkData.entranceFee = createParkDto.entranceFee;
    } else {
      parkData.entranceFee = null;
    }

    // Add GPS coordinates only if provided
    if (createParkDto.gpsLat !== undefined && createParkDto.gpsLat !== null) {
      parkData.gpsLat = createParkDto.gpsLat;
    }
    if (createParkDto.gpsLng !== undefined && createParkDto.gpsLng !== null) {
      parkData.gpsLng = createParkDto.gpsLng;
    }

    // Add description if provided
    if (createParkDto.description) {
      parkData.description = createParkDto.description;
    }

    const park = this.parksRepository.create(parkData);
    const parkEntity = Array.isArray(park) ? park[0] : park;
    return await this.parksRepository.save(parkEntity);
  }

  async findAll(queryDto: QueryParksDto) {
    const { page = 1, limit = 10, district, status, search } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.parksRepository.createQueryBuilder('park');

    if (district) {
      queryBuilder.andWhere('park.district = :district', { district });
    }

    if (status) {
      queryBuilder.andWhere('park.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(park.code ILIKE :search OR park.name ILIKE :search OR park.street ILIKE :search OR park.district ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('park.createdAt', 'DESC')
      .getManyAndCount();

    return {
      page,
      limit,
      total,
      items,
    };
  }

  private async findOneByCode(code: string): Promise<PublicPark> {
    const park = await this.parksRepository.findOne({
      where: { code },
    });
    if (!park) {
      throw new NotFoundException(`Park with code ${code} not found`);
    }
    return park;
  }

  async findOne(code: string) {
    const park = await this.findOneByCode(code);

    // Get latest issues (last 5)
    const latestIssues = await this.issuesRepository.find({
      where: { parkCode: code },
      relations: ['reportedBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Get latest maintenance schedules (last 5)
    const latestMaintenanceSchedules = await this.maintenanceSchedulesRepository.find({
      where: { parkCode: code },
      relations: ['performedBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Get counts
    const totalIssues = await this.issuesRepository.count({
      where: { parkCode: code },
    });

    const openIssues = await this.issuesRepository.count({
      where: {
        parkCode: code,
        status: In([
          IssueStatus.REPORTED,
          IssueStatus.IN_PROGRESS,
        ]),
      },
    });

    const totalMaintenanceSchedules = await this.maintenanceSchedulesRepository.count({
      where: { parkCode: code },
    });

    return {
      ...park,
      latestIssues,
      latestMaintenanceSchedules,
      counts: {
        totalIssues,
        openIssues,
        totalMaintenanceSchedules,
      },
    };
  }

  async update(code: string, updateParkDto: UpdateParkDto): Promise<PublicPark> {
    const park = await this.findOneByCode(code);
    Object.assign(park, updateParkDto);
    return this.parksRepository.save(park);
  }

  async remove(code: string): Promise<void> {
    const park = await this.findOneByCode(code);
    await this.parksRepository.remove(park);
  }

  async generateQR(code: string): Promise<PublicPark> {
    const park = await this.findOneByCode(code);
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');

    // Create uploads directory if it doesn't exist
    await fs.mkdir(path.join(uploadDir, 'qr'), { recursive: true });

    // Generate QR payload
    const qrPayload = JSON.stringify({
      code: park.code,
      publicUrl: `${publicBaseUrl}/api/v1/parks/${park.code}`,
    });

    // Generate QR code image
    const qrFileName = `qr-${park.code}-${Date.now()}.png`;
    const qrFilePath = path.join(uploadDir, 'qr', qrFileName);

    await QRCode.toFile(qrFilePath, qrPayload, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 300,
      margin: 1,
    });

    // Update park with QR data
    park.qrPayload = qrPayload;
    park.qrImageUrl = `${publicBaseUrl}/uploads/qr/${qrFileName}`;

    return this.parksRepository.save(park);
  }

  async getMaintenanceHistory(code: string) {
    // Verify park exists
    await this.findOneByCode(code);

    // Get all maintenance schedules (logs) for this park
    const schedules = await this.maintenanceSchedulesRepository.find({
      where: { parkCode: code },
      relations: ['performedBy', 'attachments'],
      order: { createdAt: 'DESC' },
    });

    return schedules;
  }

  async getParksBySubcityWithIssues(subcity: string) {
    // Get parks by subcity that have at least one issue
    const parks = await this.parksRepository
      .createQueryBuilder('park')
      .innerJoin('park.issues', 'issue')
      .where('park.district = :subcity', { subcity })
      .select([
        'park.code',
        'park.name',
        'park.district',
        'park.street',
        'park.status',
        'park.gpsLat',
        'park.gpsLng',
        'park.parkType',
        'park.areaHectares',
        'park.qrImageUrl',
        'park.createdAt',
        'park.updatedAt',
      ])
      .distinct(true)
      .orderBy('park.createdAt', 'DESC')
      .getMany();

    return parks;
  }
}


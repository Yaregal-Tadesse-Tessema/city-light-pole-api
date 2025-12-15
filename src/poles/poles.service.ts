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
import { MaintenanceLog } from '../maintenance/entities/maintenance-log.entity';
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
    @InjectRepository(MaintenanceLog)
    private maintenanceLogsRepository: Repository<MaintenanceLog>,
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
      district: createPoleDto.district,
      street: createPoleDto.street,
      heightMeters: createPoleDto.heightMeters,
      powerRatingWatt: createPoleDto.powerRatingWatt,
      poleType: createPoleDto.poleType || 'STANDARD',
      lampType: createPoleDto.lampType || 'LED',
      hasLedDisplay: createPoleDto.hasLedDisplay || false,
      status: createPoleDto.status || PoleStatus.ACTIVE,
    };

    // Add GPS coordinates only if provided
    if (createPoleDto.gpsLat !== undefined && createPoleDto.gpsLat !== null) {
      poleData.gpsLat = createPoleDto.gpsLat;
    }
    if (createPoleDto.gpsLng !== undefined && createPoleDto.gpsLng !== null) {
      poleData.gpsLng = createPoleDto.gpsLng;
    }

    // Add LED model only if hasLedDisplay is true
    if (createPoleDto.hasLedDisplay && createPoleDto.ledModel) {
      poleData.ledModel = createPoleDto.ledModel;
    }

    const pole = this.polesRepository.create(poleData);
    // TypeORM create can return array if passed array, but we're passing object so it's single entity
    const poleEntity = Array.isArray(pole) ? pole[0] : pole;
    return await this.polesRepository.save(poleEntity);
  }

  async findAll(queryDto: QueryPolesDto) {
    const { page = 1, limit = 10, district, status, search } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.polesRepository.createQueryBuilder('pole');

    if (district) {
      queryBuilder.andWhere('pole.district = :district', { district });
    }

    if (status) {
      queryBuilder.andWhere('pole.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(pole.code ILIKE :search OR pole.street ILIKE :search OR pole.district ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('pole.createdAt', 'DESC')
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

    // Get latest maintenance logs (last 5)
    const latestMaintenanceLogs = await this.maintenanceLogsRepository.find({
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

    const totalMaintenanceLogs = await this.maintenanceLogsRepository.count({
      where: { poleCode: code },
    });

    return {
      ...pole,
      latestIssues,
      latestMaintenanceLogs,
      counts: {
        totalIssues,
        openIssues,
        totalMaintenanceLogs,
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
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');

    // Create uploads directory if it doesn't exist
    await fs.mkdir(path.join(uploadDir, 'qr'), { recursive: true });

    // Generate QR payload
    const qrPayload = JSON.stringify({
      code: pole.code,
      publicUrl: `${publicBaseUrl}/api/v1/poles/${pole.code}`,
    });

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
}


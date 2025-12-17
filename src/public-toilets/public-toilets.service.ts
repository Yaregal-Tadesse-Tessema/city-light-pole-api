import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { PublicToilet, PublicToiletStatus } from './entities/public-toilet.entity';
import { CreatePublicToiletDto } from './dto/create-public-toilet.dto';
import { UpdatePublicToiletDto } from './dto/update-public-toilet.dto';
import { QueryPublicToiletsDto } from './dto/query-public-toilets.dto';
import { PublicToiletIssue, IssueStatus } from '../issues/entities/public-toilet-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';

@Injectable()
export class PublicToiletsService {
  constructor(
    @InjectRepository(PublicToilet)
    private toiletsRepository: Repository<PublicToilet>,
    @InjectRepository(PublicToiletIssue)
    private issuesRepository: Repository<PublicToiletIssue>,
    @InjectRepository(MaintenanceSchedule)
    private maintenanceSchedulesRepository: Repository<MaintenanceSchedule>,
    private configService: ConfigService,
  ) {}

  async create(dto: CreatePublicToiletDto): Promise<PublicToilet> {
    const existing = await this.toiletsRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException(`Public toilet with code ${dto.code} already exists`);

    const data: any = {
      code: dto.code,
      district: dto.district,
      street: dto.street,
      toiletType: dto.toiletType || null,
      hasPaidAccess: dto.hasPaidAccess || false,
      status: dto.status || PublicToiletStatus.ACTIVE,
    };
    if (dto.hasPaidAccess && dto.accessFee !== undefined && dto.accessFee !== null) data.accessFee = dto.accessFee;
    if (!dto.hasPaidAccess) data.accessFee = null;
    if (dto.description) data.description = dto.description;
    if (dto.gpsLat !== undefined && dto.gpsLat !== null) data.gpsLat = dto.gpsLat;
    if (dto.gpsLng !== undefined && dto.gpsLng !== null) data.gpsLng = dto.gpsLng;

    const entity = this.toiletsRepository.create(data);
    return this.toiletsRepository.save(Array.isArray(entity) ? entity[0] : entity);
  }

  async findAll(queryDto: QueryPublicToiletsDto) {
    const { page = 1, limit = 10, district, status, search } = queryDto;
    const skip = (page - 1) * limit;

    const qb = this.toiletsRepository.createQueryBuilder('t');
    if (district) qb.andWhere('t.district = :district', { district });
    if (status) qb.andWhere('t.status = :status', { status });
    if (search) {
      qb.andWhere('(t.code ILIKE :search OR t.street ILIKE :search OR t.district ILIKE :search)', { search: `%${search}%` });
    }

    const [items, total] = await qb.skip(skip).take(limit).orderBy('t.createdAt', 'DESC').getManyAndCount();
    return { page, limit, total, items };
  }

  private async findOneByCode(code: string) {
    const t = await this.toiletsRepository.findOne({ where: { code } });
    if (!t) throw new NotFoundException(`Public toilet with code ${code} not found`);
    return t;
  }

  async findOne(code: string) {
    const toilet = await this.findOneByCode(code);

    const latestIssues = await this.issuesRepository.find({
      where: { publicToiletCode: code },
      relations: ['reportedBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const latestMaintenanceSchedules = await this.maintenanceSchedulesRepository.find({
      where: { publicToiletCode: code },
      relations: ['performedBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const totalIssues = await this.issuesRepository.count({ where: { publicToiletCode: code } });
    const openIssues = await this.issuesRepository.count({
      where: { publicToiletCode: code, status: In([IssueStatus.REPORTED, IssueStatus.IN_PROGRESS]) },
    });
    const totalMaintenanceSchedules = await this.maintenanceSchedulesRepository.count({ where: { publicToiletCode: code } });

    return {
      ...toilet,
      latestIssues,
      latestMaintenanceSchedules,
      counts: { totalIssues, openIssues, totalMaintenanceSchedules },
    };
  }

  async update(code: string, dto: UpdatePublicToiletDto) {
    const toilet = await this.findOneByCode(code);
    Object.assign(toilet, dto);
    return this.toiletsRepository.save(toilet);
  }

  async remove(code: string) {
    const toilet = await this.findOneByCode(code);
    await this.toiletsRepository.remove(toilet);
  }

  async generateQR(code: string) {
    const toilet = await this.findOneByCode(code);
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    await fs.mkdir(path.join(uploadDir, 'qr'), { recursive: true });

    const qrPayload = JSON.stringify({ code: toilet.code, publicUrl: `${publicBaseUrl}/api/v1/public-toilets/${toilet.code}` });
    const qrFileName = `qr-${toilet.code}-${Date.now()}.png`;
    const qrFilePath = path.join(uploadDir, 'qr', qrFileName);
    await QRCode.toFile(qrFilePath, qrPayload, { errorCorrectionLevel: 'M', type: 'png', width: 300, margin: 1 });

    toilet.qrPayload = qrPayload;
    toilet.qrImageUrl = `${publicBaseUrl}/uploads/qr/${qrFileName}`;
    return this.toiletsRepository.save(toilet);
  }

  async getMaintenanceHistory(code: string) {
    await this.findOneByCode(code);
    return this.maintenanceSchedulesRepository.find({
      where: { publicToiletCode: code },
      relations: ['performedBy', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }
}



import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Museum, MuseumStatus } from './entities/museum.entity';
import { CreateMuseumDto } from './dto/create-museum.dto';
import { UpdateMuseumDto } from './dto/update-museum.dto';
import { QueryMuseumsDto } from './dto/query-museums.dto';
import { MuseumIssue, IssueStatus } from '../issues/entities/museum-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';

@Injectable()
export class MuseumsService {
  constructor(
    @InjectRepository(Museum)
    private museumsRepository: Repository<Museum>,
    @InjectRepository(MuseumIssue)
    private issuesRepository: Repository<MuseumIssue>,
    @InjectRepository(MaintenanceSchedule)
    private maintenanceSchedulesRepository: Repository<MaintenanceSchedule>,
    private configService: ConfigService,
  ) {}

  async create(dto: CreateMuseumDto): Promise<Museum> {
    const existing = await this.museumsRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException(`Museum with code ${dto.code} already exists`);

    const data: any = {
      code: dto.code,
      name: dto.name,
      district: dto.district,
      street: dto.street,
      museumType: dto.museumType || null,
      status: dto.status || MuseumStatus.ACTIVE,
    };
    if (dto.description) data.description = dto.description;
    if (dto.gpsLat !== undefined && dto.gpsLat !== null) data.gpsLat = dto.gpsLat;
    if (dto.gpsLng !== undefined && dto.gpsLng !== null) data.gpsLng = dto.gpsLng;

    const entity = this.museumsRepository.create(data);
    return this.museumsRepository.save(Array.isArray(entity) ? entity[0] : entity);
  }

  async findAll(queryDto: QueryMuseumsDto) {
    const { page = 1, limit = 10, district, status, search } = queryDto;
    const skip = (page - 1) * limit;

    const qb = this.museumsRepository.createQueryBuilder('m');
    if (district) qb.andWhere('m.district = :district', { district });
    if (status) qb.andWhere('m.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(m.code ILIKE :search OR m.name ILIKE :search OR m.street ILIKE :search OR m.district ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [items, total] = await qb.skip(skip).take(limit).orderBy('m.createdAt', 'DESC').getManyAndCount();
    return { page, limit, total, items };
  }

  private async findOneByCode(code: string) {
    const museum = await this.museumsRepository.findOne({ where: { code } });
    if (!museum) throw new NotFoundException(`Museum with code ${code} not found`);
    return museum;
  }

  async findOne(code: string) {
    const museum = await this.findOneByCode(code);

    const latestIssues = await this.issuesRepository.find({
      where: { museumCode: code },
      relations: ['reportedBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const latestMaintenanceSchedules = await this.maintenanceSchedulesRepository.find({
      where: { museumCode: code },
      relations: ['performedBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const totalIssues = await this.issuesRepository.count({ where: { museumCode: code } });
    const openIssues = await this.issuesRepository.count({
      where: { museumCode: code, status: In([IssueStatus.REPORTED, IssueStatus.IN_PROGRESS]) },
    });
    const totalMaintenanceSchedules = await this.maintenanceSchedulesRepository.count({ where: { museumCode: code } });

    return {
      ...museum,
      latestIssues,
      latestMaintenanceSchedules,
      counts: { totalIssues, openIssues, totalMaintenanceSchedules },
    };
  }

  async update(code: string, dto: UpdateMuseumDto) {
    const museum = await this.findOneByCode(code);
    Object.assign(museum, dto);
    return this.museumsRepository.save(museum);
  }

  async remove(code: string) {
    const museum = await this.findOneByCode(code);
    await this.museumsRepository.remove(museum);
  }

  async generateQR(code: string) {
    const museum = await this.findOneByCode(code);
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    await fs.mkdir(path.join(uploadDir, 'qr'), { recursive: true });

    const qrPayload = JSON.stringify({ code: museum.code, publicUrl: `${publicBaseUrl}/api/v1/museums/${museum.code}` });
    const qrFileName = `qr-${museum.code}-${Date.now()}.png`;
    const qrFilePath = path.join(uploadDir, 'qr', qrFileName);
    await QRCode.toFile(qrFilePath, qrPayload, { errorCorrectionLevel: 'M', type: 'png', width: 300, margin: 1 });

    museum.qrPayload = qrPayload;
    museum.qrImageUrl = `${publicBaseUrl}/uploads/qr/${qrFileName}`;
    return this.museumsRepository.save(museum);
  }

  async getMaintenanceHistory(code: string) {
    await this.findOneByCode(code);
    return this.maintenanceSchedulesRepository.find({
      where: { museumCode: code },
      relations: ['performedBy', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }
}



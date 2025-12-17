import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { FootballField, FootballFieldStatus } from './entities/football-field.entity';
import { CreateFootballFieldDto } from './dto/create-football-field.dto';
import { UpdateFootballFieldDto } from './dto/update-football-field.dto';
import { QueryFootballFieldsDto } from './dto/query-football-fields.dto';
import { FootballFieldIssue, IssueStatus } from '../issues/entities/football-field-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';

@Injectable()
export class FootballFieldsService {
  constructor(
    @InjectRepository(FootballField)
    private fieldsRepository: Repository<FootballField>,
    @InjectRepository(FootballFieldIssue)
    private issuesRepository: Repository<FootballFieldIssue>,
    @InjectRepository(MaintenanceSchedule)
    private maintenanceSchedulesRepository: Repository<MaintenanceSchedule>,
    private configService: ConfigService,
  ) {}

  async create(dto: CreateFootballFieldDto): Promise<FootballField> {
    const existing = await this.fieldsRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException(`Football field with code ${dto.code} already exists`);

    const data: any = {
      code: dto.code,
      name: dto.name,
      district: dto.district,
      street: dto.street,
      fieldType: dto.fieldType || null,
      capacity: dto.capacity ?? null,
      status: dto.status || FootballFieldStatus.ACTIVE,
    };
    if (dto.description) data.description = dto.description;
    if (dto.gpsLat !== undefined && dto.gpsLat !== null) data.gpsLat = dto.gpsLat;
    if (dto.gpsLng !== undefined && dto.gpsLng !== null) data.gpsLng = dto.gpsLng;

    const entity = this.fieldsRepository.create(data);
    return this.fieldsRepository.save(Array.isArray(entity) ? entity[0] : entity);
  }

  async findAll(queryDto: QueryFootballFieldsDto) {
    const { page = 1, limit = 10, district, status, search } = queryDto;
    const skip = (page - 1) * limit;
    const qb = this.fieldsRepository.createQueryBuilder('f');
    if (district) qb.andWhere('f.district = :district', { district });
    if (status) qb.andWhere('f.status = :status', { status });
    if (search) {
      qb.andWhere('(f.code ILIKE :search OR f.name ILIKE :search OR f.street ILIKE :search OR f.district ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    const [items, total] = await qb.skip(skip).take(limit).orderBy('f.createdAt', 'DESC').getManyAndCount();
    return { page, limit, total, items };
  }

  private async findOneByCode(code: string) {
    const field = await this.fieldsRepository.findOne({ where: { code } });
    if (!field) throw new NotFoundException(`Football field with code ${code} not found`);
    return field;
  }

  async findOne(code: string) {
    const field = await this.findOneByCode(code);

    const latestIssues = await this.issuesRepository.find({
      where: { footballFieldCode: code },
      relations: ['reportedBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });
    const latestMaintenanceSchedules = await this.maintenanceSchedulesRepository.find({
      where: { footballFieldCode: code },
      relations: ['performedBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const totalIssues = await this.issuesRepository.count({ where: { footballFieldCode: code } });
    const openIssues = await this.issuesRepository.count({
      where: { footballFieldCode: code, status: In([IssueStatus.REPORTED, IssueStatus.IN_PROGRESS]) },
    });
    const totalMaintenanceSchedules = await this.maintenanceSchedulesRepository.count({ where: { footballFieldCode: code } });

    return {
      ...field,
      latestIssues,
      latestMaintenanceSchedules,
      counts: { totalIssues, openIssues, totalMaintenanceSchedules },
    };
  }

  async update(code: string, dto: UpdateFootballFieldDto) {
    const field = await this.findOneByCode(code);
    Object.assign(field, dto);
    return this.fieldsRepository.save(field);
  }

  async remove(code: string) {
    const field = await this.findOneByCode(code);
    await this.fieldsRepository.remove(field);
  }

  async generateQR(code: string) {
    const field = await this.findOneByCode(code);
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    await fs.mkdir(path.join(uploadDir, 'qr'), { recursive: true });

    const qrPayload = JSON.stringify({ code: field.code, publicUrl: `${publicBaseUrl}/api/v1/football-fields/${field.code}` });
    const qrFileName = `qr-${field.code}-${Date.now()}.png`;
    const qrFilePath = path.join(uploadDir, 'qr', qrFileName);
    await QRCode.toFile(qrFilePath, qrPayload, { errorCorrectionLevel: 'M', type: 'png', width: 300, margin: 1 });

    field.qrPayload = qrPayload;
    field.qrImageUrl = `${publicBaseUrl}/uploads/qr/${qrFileName}`;
    return this.fieldsRepository.save(field);
  }

  async getMaintenanceHistory(code: string) {
    await this.findOneByCode(code);
    return this.maintenanceSchedulesRepository.find({
      where: { footballFieldCode: code },
      relations: ['performedBy', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }
}



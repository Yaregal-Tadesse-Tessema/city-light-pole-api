import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ParkingLot, ParkingLotStatus } from './entities/parking-lot.entity';
import { CreateParkingLotDto } from './dto/create-parking-lot.dto';
import { UpdateParkingLotDto } from './dto/update-parking-lot.dto';
import { QueryParkingLotsDto } from './dto/query-parking-lots.dto';
import { ParkingLotIssue, IssueStatus } from '../issues/entities/parking-lot-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';

@Injectable()
export class ParkingLotsService {
  constructor(
    @InjectRepository(ParkingLot)
    private parkingLotsRepository: Repository<ParkingLot>,
    @InjectRepository(ParkingLotIssue)
    private issuesRepository: Repository<ParkingLotIssue>,
    @InjectRepository(MaintenanceSchedule)
    private maintenanceSchedulesRepository: Repository<MaintenanceSchedule>,
    private configService: ConfigService,
  ) {}

  async create(dto: CreateParkingLotDto): Promise<ParkingLot> {
    const existing = await this.parkingLotsRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException(`Parking lot with code ${dto.code} already exists`);

    const data: any = {
      code: dto.code,
      name: dto.name,
      district: dto.district,
      street: dto.street,
      parkingType: dto.parkingType || null,
      capacity: dto.capacity ?? null,
      hasPaidParking: dto.hasPaidParking || false,
      status: dto.status || ParkingLotStatus.ACTIVE,
    };

    if (dto.hasPaidParking && dto.hourlyRate !== undefined && dto.hourlyRate !== null) data.hourlyRate = dto.hourlyRate;
    if (!dto.hasPaidParking) data.hourlyRate = null;
    if (dto.description) data.description = dto.description;
    if (dto.gpsLat !== undefined && dto.gpsLat !== null) data.gpsLat = dto.gpsLat;
    if (dto.gpsLng !== undefined && dto.gpsLng !== null) data.gpsLng = dto.gpsLng;

    const entity = this.parkingLotsRepository.create(data);
    return this.parkingLotsRepository.save(Array.isArray(entity) ? entity[0] : entity);
  }

  async findAll(queryDto: QueryParkingLotsDto) {
    const { page = 1, limit = 10, district, status, search } = queryDto;
    const skip = (page - 1) * limit;

    const qb = this.parkingLotsRepository.createQueryBuilder('lot');
    if (district) qb.andWhere('lot.district = :district', { district });
    if (status) qb.andWhere('lot.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(lot.code ILIKE :search OR lot.name ILIKE :search OR lot.street ILIKE :search OR lot.district ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [items, total] = await qb.skip(skip).take(limit).orderBy('lot.createdAt', 'DESC').getManyAndCount();
    return { page, limit, total, items };
  }

  private async findOneByCode(code: string) {
    const lot = await this.parkingLotsRepository.findOne({ where: { code } });
    if (!lot) throw new NotFoundException(`Parking lot with code ${code} not found`);
    return lot;
  }

  async findOne(code: string) {
    const lot = await this.findOneByCode(code);

    const latestIssues = await this.issuesRepository.find({
      where: { parkingLotCode: code },
      relations: ['reportedBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const latestMaintenanceSchedules = await this.maintenanceSchedulesRepository.find({
      where: { parkingLotCode: code },
      relations: ['performedBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const totalIssues = await this.issuesRepository.count({ where: { parkingLotCode: code } });
    const openIssues = await this.issuesRepository.count({
      where: { parkingLotCode: code, status: In([IssueStatus.REPORTED, IssueStatus.IN_PROGRESS]) },
    });
    const totalMaintenanceSchedules = await this.maintenanceSchedulesRepository.count({ where: { parkingLotCode: code } });

    return {
      ...lot,
      latestIssues,
      latestMaintenanceSchedules,
      counts: { totalIssues, openIssues, totalMaintenanceSchedules },
    };
  }

  async update(code: string, dto: UpdateParkingLotDto) {
    const lot = await this.findOneByCode(code);
    Object.assign(lot, dto);
    return this.parkingLotsRepository.save(lot);
  }

  async remove(code: string) {
    const lot = await this.findOneByCode(code);
    await this.parkingLotsRepository.remove(lot);
  }

  async generateQR(code: string): Promise<ParkingLot> {
    const lot = await this.findOneByCode(code);
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    await fs.mkdir(path.join(uploadDir, 'qr'), { recursive: true });

    const qrPayload = JSON.stringify({ code: lot.code, publicUrl: `${publicBaseUrl}/api/v1/parking-lots/${lot.code}` });
    const qrFileName = `qr-${lot.code}-${Date.now()}.png`;
    const qrFilePath = path.join(uploadDir, 'qr', qrFileName);
    await QRCode.toFile(qrFilePath, qrPayload, { errorCorrectionLevel: 'M', type: 'png', width: 300, margin: 1 });

    lot.qrPayload = qrPayload;
    lot.qrImageUrl = `${publicBaseUrl}/uploads/qr/${qrFileName}`;
    return this.parkingLotsRepository.save(lot);
  }

  async getMaintenanceHistory(code: string) {
    await this.findOneByCode(code);
    return this.maintenanceSchedulesRepository.find({
      where: { parkingLotCode: code },
      relations: ['performedBy', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }
}



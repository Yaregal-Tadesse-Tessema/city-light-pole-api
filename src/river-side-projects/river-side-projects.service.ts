import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { In, Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { RiverSideProject, RiverSideProjectStatus } from './entities/river-side-project.entity';
import { CreateRiverSideProjectDto } from './dto/create-river-side-project.dto';
import { UpdateRiverSideProjectDto } from './dto/update-river-side-project.dto';
import { QueryRiverSideProjectsDto } from './dto/query-river-side-projects.dto';
import {
  RiverSideProjectIssue,
  IssueStatus as RiverIssueStatus,
} from '../issues/entities/river-side-project-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';

@Injectable()
export class RiverSideProjectsService {
  constructor(
    @InjectRepository(RiverSideProject)
    private repo: Repository<RiverSideProject>,
    @InjectRepository(RiverSideProjectIssue)
    private issuesRepo: Repository<RiverSideProjectIssue>,
    @InjectRepository(MaintenanceSchedule)
    private maintenanceRepo: Repository<MaintenanceSchedule>,
    private configService: ConfigService,
  ) {}

  async create(dto: CreateRiverSideProjectDto): Promise<RiverSideProject> {
    const existing = await this.repo.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException(`River side project with code ${dto.code} already exists`);

    const entity = this.repo.create({
      code: dto.code,
      name: dto.name,
      district: dto.district,
      street: dto.street,
      gpsLat: dto.gpsLat ?? null,
      gpsLng: dto.gpsLng ?? null,
      projectType: dto.projectType ?? null,
      description: dto.description ?? null,
      status: dto.status || RiverSideProjectStatus.ACTIVE,
    });
    return this.repo.save(entity);
  }

  async findAll(queryDto: QueryRiverSideProjectsDto) {
    const { page = 1, limit = 10, district, status, search } = queryDto;
    const skip = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('project');
    if (district) qb.andWhere('project.district = :district', { district });
    if (status) qb.andWhere('project.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(project.code ILIKE :search OR project.name ILIKE :search OR project.street ILIKE :search OR project.district ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [items, total] = await qb.skip(skip).take(limit).orderBy('project.createdAt', 'DESC').getManyAndCount();
    return { page, limit, total, items };
  }

  private async findOneByCode(code: string) {
    const entity = await this.repo.findOne({ where: { code } });
    if (!entity) throw new NotFoundException(`River side project with code ${code} not found`);
    return entity;
  }

  async findOne(code: string) {
    const project = await this.findOneByCode(code);

    const latestIssues = await this.issuesRepo.find({
      where: { riverSideProjectCode: code },
      relations: ['reportedBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const latestMaintenanceSchedules = await this.maintenanceRepo.find({
      where: { riverSideProjectCode: code },
      relations: ['performedBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const totalIssues = await this.issuesRepo.count({ where: { riverSideProjectCode: code } });
    const openIssues = await this.issuesRepo.count({
      where: { riverSideProjectCode: code, status: In([RiverIssueStatus.REPORTED, RiverIssueStatus.IN_PROGRESS]) },
    });
    const totalMaintenanceSchedules = await this.maintenanceRepo.count({ where: { riverSideProjectCode: code } });

    return { ...project, latestIssues, latestMaintenanceSchedules, counts: { totalIssues, openIssues, totalMaintenanceSchedules } };
  }

  async update(code: string, dto: UpdateRiverSideProjectDto) {
    const project = await this.findOneByCode(code);
    Object.assign(project, dto);
    return this.repo.save(project);
  }

  async remove(code: string) {
    const project = await this.findOneByCode(code);
    await this.repo.remove(project);
  }

  async generateQR(code: string): Promise<RiverSideProject> {
    const project = await this.findOneByCode(code);
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    await fs.mkdir(path.join(uploadDir, 'qr'), { recursive: true });

    const qrPayload = JSON.stringify({ code: project.code, publicUrl: `${publicBaseUrl}/api/v1/river-side-projects/${project.code}` });
    const qrFileName = `qr-${project.code}-${Date.now()}.png`;
    const qrFilePath = path.join(uploadDir, 'qr', qrFileName);
    await QRCode.toFile(qrFilePath, qrPayload, { errorCorrectionLevel: 'M', type: 'png', width: 300, margin: 1 });

    project.qrPayload = qrPayload;
    project.qrImageUrl = `${publicBaseUrl}/uploads/qr/${qrFileName}`;
    return this.repo.save(project);
  }

  async getMaintenanceHistory(code: string) {
    await this.findOneByCode(code);
    return this.maintenanceRepo.find({
      where: { riverSideProjectCode: code },
      relations: ['performedBy', 'attachments'],
      order: { createdAt: 'DESC' },
    });
  }
}



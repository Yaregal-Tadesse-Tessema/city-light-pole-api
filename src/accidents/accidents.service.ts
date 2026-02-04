import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThanOrEqual } from 'typeorm';
import * as puppeteer from 'puppeteer';
import { Accident } from './entities/accident.entity';
import { AccidentPhoto } from './entities/accident-photo.entity';
import { AccidentAttachment } from './entities/accident-attachment.entity';
import { AccidentApproval } from './entities/accident-approval.entity';
import { AccidentsDamagedComponets } from './entities/accidents-damaged-componets.entity';
import { PolesService } from '../poles/poles.service';
import { PoleStatus } from '../poles/entities/light-pole.entity';
import { FileService } from '../file/file.service';
import { DamagedComponentsService } from './damaged-components.service';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { UpdateAccidentDto } from './dto/update-accident.dto';
import { QueryAccidentsDto } from './dto/query-accidents.dto';
import { ApproveAccidentDto } from './dto/approve-accident.dto';
import {
  AccidentType,
  AccidentStatus,
  ClaimStatus,
  ApprovalAction,
  ApprovalStage,
  COST_ESTIMATION_TABLES,
  DamagedComponent,
  DamageLevel,
} from './enums/accident.enums';

@Injectable()
export class AccidentsService {
  constructor(
    @InjectRepository(Accident)
    private readonly accidentRepository: Repository<Accident>,
    @InjectRepository(AccidentPhoto)
    private readonly photoRepository: Repository<AccidentPhoto>,
    @InjectRepository(AccidentAttachment)
    private readonly attachmentRepository: Repository<AccidentAttachment>,
    @InjectRepository(AccidentApproval)
    private readonly approvalRepository: Repository<AccidentApproval>,
    private readonly polesService: PolesService,
    private readonly dataSource: DataSource,
    private readonly fileService: FileService,
    private readonly damagedComponentsService: DamagedComponentsService,
  ) {}

  async create(createAccidentDto: CreateAccidentDto, userId: string): Promise<Accident> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const incidentId = await this.generateIncidentId();

      const accident = this.accidentRepository.create({
        ...createAccidentDto,
        incidentId,
        reportedById: userId,
        accidentDate: new Date(createAccidentDto.accidentDate),
      });

      const savedAccident = await queryRunner.manager.save(accident);

      // Update pole status if pole is linked
      if (createAccidentDto.poleId) {
        await this.polesService.update(createAccidentDto.poleId, { status: PoleStatus.FAULT_DAMAGED });
      }

      await queryRunner.commitTransaction();
      return savedAccident;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: QueryAccidentsDto): Promise<{ data: Accident[]; total: number; page: number; limit: number }> {
    const qb = this.accidentRepository
      .createQueryBuilder('accident')
      .leftJoinAndSelect('accident.reportedBy', 'reportedBy')
      .leftJoinAndSelect('accident.inspectedBy', 'inspectedBy')
      .leftJoinAndSelect('accident.supervisorApprovedBy', 'supervisorApprovedBy')
      .leftJoinAndSelect('accident.financeApprovedBy', 'financeApprovedBy')
      .leftJoinAndSelect('accident.pole', 'pole')
      .leftJoinAndSelect('accident.photos', 'photos')
      .leftJoinAndSelect('accident.attachments', 'attachments')
      .leftJoinAndSelect('accident.approvals', 'approvals')
      .orderBy('accident.createdAt', 'DESC');

    // Apply filters
    if (query.search) {
      qb.andWhere(
        '(accident.incidentId ILIKE :search OR accident.poleId ILIKE :search OR accident.locationDescription ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.accidentType) {
      qb.andWhere('accident.accidentType = :accidentType', { accidentType: query.accidentType });
    }

    if (query.status) {
      qb.andWhere('accident.status = :status', { status: query.status });
    }

    if (query.claimStatus) {
      qb.andWhere('accident.claimStatus = :claimStatus', { claimStatus: query.claimStatus });
    }

    if (query.poleId) {
      qb.andWhere('accident.poleId = :poleId', { poleId: query.poleId });
    }

    if (query.startDate) {
      qb.andWhere('accident.accidentDate >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      qb.andWhere('accident.accidentDate <= :endDate', { endDate: query.endDate });
    }

    // Only apply pagination if page or limit are explicitly provided
    const hasPagination = query.page !== undefined || query.limit !== undefined;
    let page = query.page || 1;
    let limit = query.limit || 10;
    let skip = (page - 1) * limit;

    if (hasPagination) {
      qb.skip(skip).take(limit);
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async generateIncidentReport(accidentId: string): Promise<Buffer> {
    const accident = await this.findOne(accidentId);
    const html = this.generateIncidentReportHtml(accident);
    return this.generatePdf(html);
  }

  async generateDamageAssessmentReport(accidentId: string): Promise<Buffer> {
    const accident = await this.findOne(accidentId);
    const html = this.generateDamageAssessmentHtml(accident);
    return this.generatePdf(html);
  }

  async generateCostEstimateReport(accidentId: string): Promise<Buffer> {
    const accident = await this.findOne(accidentId);
    const html = this.generateCostEstimateHtml(accident);
    return this.generatePdf(html);
  }

  private async generatePdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private generateIncidentReportHtml(accident: Accident): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Incident Report - ${accident.incidentId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .field { margin-bottom: 10px; }
          .label { font-weight: bold; display: inline-block; width: 200px; }
          .value { display: inline-block; }
          .photos { margin-top: 20px; }
          .photo { margin: 10px; display: inline-block; }
          .photo img { max-width: 200px; max-height: 150px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Addis Ababa Light Poles Management System</h1>
          <h2>Incident Report</h2>
          <h3>${accident.incidentId}</h3>
        </div>

        <div class="section">
          <h3>Incident Details</h3>
          <div class="field">
            <span class="label">Incident ID:</span>
            <span class="value">${accident.incidentId}</span>
          </div>
          <div class="field">
            <span class="label">Accident Type:</span>
            <span class="value">${accident.accidentType.replace(/_/g, ' ')}</span>
          </div>
          <div class="field">
            <span class="label">Date & Time:</span>
            <span class="value">${accident.accidentDate.toLocaleDateString()} ${accident.accidentTime}</span>
          </div>
          <div class="field">
            <span class="label">Location:</span>
            <span class="value">${accident.locationDescription || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="label">Pole ID:</span>
            <span class="value">${accident.poleId || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="label">GPS Coordinates:</span>
            <span class="value">${accident.latitude && accident.longitude ? `${accident.latitude}, ${accident.longitude}` : 'N/A'}</span>
          </div>
        </div>

        <div class="section">
          <h3>Vehicle & Insurance Information</h3>
          <div class="field">
            <span class="label">Vehicle Plate Number:</span>
            <span class="value">${accident.vehiclePlateNumber || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="label">Driver Name:</span>
            <span class="value">${accident.driverName || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="label">Insurance Company:</span>
            <span class="value">${accident.insuranceCompany || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="label">Claim Reference:</span>
            <span class="value">${accident.claimReferenceNumber || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="label">Claim Status:</span>
            <span class="value">${accident.claimStatus.replace(/_/g, ' ')}</span>
          </div>
        </div>

        <div class="section">
          <h3>Reporting Information</h3>
          <div class="field">
            <span class="label">Reported By:</span>
            <span class="value">${accident.reportedBy?.fullName || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="label">Reported Date:</span>
            <span class="value">${accident.createdAt.toLocaleDateString()}</span>
          </div>
          <div class="field">
            <span class="label">Status:</span>
            <span class="value">${accident.status.replace(/_/g, ' ')}</span>
          </div>
        </div>

        ${accident.photos && accident.photos.length > 0 ? `
          <div class="photos">
            <h3>Incident Photos</h3>
            ${accident.photos.map(photo => `
              <div class="photo">
                <img src="http://localhost:3011/uploads/accidents/${photo.filename}" alt="${photo.description || 'Incident photo'}" />
                <br><small>${photo.description || ''}</small>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateDamageAssessmentHtml(accident: Accident): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Damage Assessment - ${accident.incidentId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .field { margin-bottom: 10px; }
          .label { font-weight: bold; display: inline-block; width: 200px; }
          .value { display: inline-block; }
          .assessment { background: #f9f9f9; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Addis Ababa Light Poles Management System</h1>
          <h2>Damage Assessment Report</h2>
          <h3>${accident.incidentId}</h3>
        </div>

        <div class="assessment">
          <h3>Damage Assessment</h3>
          <div class="field">
            <span class="label">Damage Level:</span>
            <span class="value">${accident.damageLevel || 'Not assessed'}</span>
          </div>
          <div class="field">
            <span class="label">Damage Description:</span>
            <span class="value">${accident.damageDescription || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="label">Safety Risk:</span>
            <span class="value">${accident.safetyRisk ? 'Yes' : 'No'}</span>
          </div>
          <div class="field">
            <span class="label">Inspected By:</span>
            <span class="value">${accident.inspectedBy?.fullName || 'Not inspected'}</span>
          </div>
          <div class="field">
            <span class="label">Inspection Date:</span>
            <span class="value">${accident.updatedAt.toLocaleDateString()}</span>
          </div>
        </div>

        <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateCostEstimateHtml(accident: Accident): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Cost Estimate - ${accident.incidentId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .total { font-weight: bold; background-color: #e8f4f8; }
          .section { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Addis Ababa Light Poles Management System</h1>
          <h2>Cost Estimate Report</h2>
          <h3>${accident.incidentId}</h3>
        </div>

        <div class="section">
          <h3>Detailed Cost Breakdown</h3>
          ${accident.damagedComponents && accident.damagedComponents.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Cost (ETB)</th>
                </tr>
              </thead>
              <tbody>
                ${accident.damagedComponents.map((damagedComponent: any) => {
                  const componentName = damagedComponent.damagedComponent?.name || damagedComponent.damagedComponentId;
                  return `
                    <tr>
                      <td>${componentName}</td>
                      <td>2,000.00</td>
                    </tr>
                  `;
                }).join('')}
                <tr class="total">
                  <td><strong>Total Loss Cost</strong></td>
                  <td><strong>${(accident.damagedComponents.length * 2000).toLocaleString()} ETB</strong></td>
                </tr>
              </tbody>
            </table>
          ` : '<p>No damaged components specified</p>'}
        </div>

        <div class="section">
          <h3>Approval Information</h3>
          <p><strong>Status:</strong> ${accident.status.replace(/_/g, ' ')}</p>
          ${accident.supervisorApprovedBy ? `<p><strong>Supervisor Approved By:</strong> ${accident.supervisorApprovedBy.fullName}</p>` : ''}
          ${accident.financeApprovedBy ? `<p><strong>Finance Approved By:</strong> ${accident.financeApprovedBy.fullName}</p>` : ''}
        </div>

        <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  async findOne(id: string): Promise<Accident> {
    const accident = await this.accidentRepository.findOne({
      where: { id },
      relations: [
        'reportedBy',
        'inspectedBy',
        'supervisorApprovedBy',
        'financeApprovedBy',
        'pole',
        'photos',
        'attachments',
        'approvals',
        'approvals.approvedBy',
        'damagedComponents',
        'damagedComponents.damagedComponent',
      ],
    });

    if (!accident) {
      throw new NotFoundException(`Accident with ID ${id} not found`);
    }

    return accident;
  }

  async update(id: string, updateAccidentDto: UpdateAccidentDto, userId: string): Promise<Accident> {
    console.log('🔄 Updating accident:', id, 'with data:', updateAccidentDto);
    const accident = await this.findOne(id);
    console.log('📊 Current accident status:', accident.status, 'inspectedById:', accident.inspectedById);

    // FORCE STATUS CHANGE FOR DAMAGE ASSESSMENT - THIS IS WHAT YOU WANT
    if (updateAccidentDto.damageLevel || updateAccidentDto.damageDescription) {
      console.log('🎯 DAMAGE ASSESSMENT DETECTED - FORCING STATUS TO INSPECTED');
      updateAccidentDto.status = AccidentStatus.INSPECTED;
      updateAccidentDto.inspectedById = userId;
    }

    // Handle damaged components - update junction table
    if (updateAccidentDto.damagedComponents !== undefined) {
      await this.updateAccidentDamagedComponents(accident.id, updateAccidentDto.damagedComponents);
    }

    // Auto-calculate cost if damage assessment is complete
    if (updateAccidentDto.damageLevel) {
      const damagedComponentIds = updateAccidentDto.damagedComponents || [];

      updateAccidentDto.estimatedCost = await this.calculateCostFromComponents(
        updateAccidentDto.damageLevel,
        damagedComponentIds
      );

      updateAccidentDto.costBreakdown = await this.generateCostBreakdownFromComponents(
        updateAccidentDto.damageLevel,
        damagedComponentIds
      );
    }

    // FORCE STATUS CHANGE FOR DAMAGE ASSESSMENT - THIS IS WHAT YOU WANT
    if (updateAccidentDto.damageLevel || updateAccidentDto.damageDescription) {
      console.log('🎯 DAMAGE ASSESSMENT DETECTED - FORCING STATUS TO INSPECTED');
      updateAccidentDto.status = AccidentStatus.INSPECTED;
      updateAccidentDto.inspectedById = userId;
    }

    // Exclude damagedComponents from assignment since we handle it separately
    const { damagedComponents, ...updateData } = updateAccidentDto;
    Object.assign(accident, updateData);

    // Clear loaded damagedComponents entities to prevent cascade issues
    accident.damagedComponents = undefined;

    const savedAccident = await this.accidentRepository.save(accident);
    console.log('✅ Accident updated successfully. Status:', savedAccident.status);
    return savedAccident;
  }

  async remove(id: string): Promise<void> {
    const accident = await this.findOne(id);
    await this.accidentRepository.remove(accident);
  }

  async approve(id: string, approveDto: ApproveAccidentDto, userId: string, userRole: string): Promise<Accident> {
    console.log('🎯 Approval request for accident ID:', id, 'type:', typeof id, 'userRole:', userRole, 'userId:', userId);
    console.log('🎯 Approve DTO:', approveDto);
    const accident = await this.findOne(id);
    console.log('📊 Accident status:', accident.status, 'accident ID from DB:', accident.id);

    // Determine approval stage and permissions FIRST
    console.log('🎯 Checking approval logic - accident status:', accident.status, 'user role:', userRole, 'action:', approveDto.action);

    let newStatus: AccidentStatus;
    let stage: ApprovalStage;

    if (accident.status === AccidentStatus.INSPECTED) {
      console.log('📋 Accident is INSPECTED - checking supervisor permissions');
      if (!this.canApproveAsSupervisor(userRole)) {
        console.log('❌ Supervisor permission denied for role:', userRole);
        throw new ForbiddenException('Insufficient permissions for supervisor approval');
      }
      stage = ApprovalStage.SUPERVISOR_REVIEW;
      newStatus = approveDto.action === ApprovalAction.APPROVE
        ? AccidentStatus.SUPERVISOR_REVIEW
        : AccidentStatus.REJECTED;
      console.log('✅ Supervisor approval processed. New status:', newStatus);
      } else if (accident.status === AccidentStatus.SUPERVISOR_REVIEW) {
        console.log('📋 Accident is SUPERVISOR_REVIEW - checking finance permissions');
        if (!this.canApproveAsFinance(userRole)) {
          console.log('❌ Finance permission denied for role:', userRole);
          throw new ForbiddenException('Insufficient permissions for finance approval');
        }
        stage = ApprovalStage.FINANCE_REVIEW;
        newStatus = approveDto.action === ApprovalAction.APPROVE
          ? AccidentStatus.UNDER_REPAIR  // Move to repair phase after finance approval
          : AccidentStatus.REJECTED;
        console.log('✅ Finance approval processed. New status:', newStatus);
      } else if (accident.status === AccidentStatus.UNDER_REPAIR) {
        console.log('📋 Accident is UNDER_REPAIR - checking repair completion permissions');
        // Allow inspectors and supervisors to mark repairs as complete
        if (!this.canApproveAsSupervisor(userRole) && userRole !== 'INSPECTOR') {
          console.log('❌ Repair completion permission denied for role:', userRole);
          throw new ForbiddenException('Insufficient permissions to complete repairs');
        }
        stage = ApprovalStage.SUPERVISOR_REVIEW; // Reuse for repair completion
        newStatus = approveDto.action === ApprovalAction.APPROVE
          ? AccidentStatus.COMPLETED
          : AccidentStatus.UNDER_REPAIR; // Stay in repair if not approved
        console.log('✅ Repair completion processed. New status:', newStatus);
      } else {
        console.log('❌ Accident status not approvable:', accident.status);
        throw new BadRequestException('Accident is not in an approvable state');
      }

    // Update accident status and create approval record in transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update accident status
      accident.status = newStatus;
      if (stage === ApprovalStage.SUPERVISOR_REVIEW && approveDto.action === ApprovalAction.APPROVE) {
        accident.supervisorApprovedById = userId;
      } else if (stage === ApprovalStage.FINANCE_REVIEW && approveDto.action === ApprovalAction.APPROVE) {
        accident.financeApprovedById = userId;
      }

      // Save accident first
      await queryRunner.manager.save(accident);

      // Create and save approval record with proper accident relationship
      console.log('🎯 Creating approval record with accidentId:', id);

      const approval = queryRunner.manager.create(AccidentApproval, {
        accidentId: id,
        stage,
        action: approveDto.action,
        comments: approveDto.comments,
        previousStatus: accident.status,
        newStatus,
        approvedById: userId,
      });

      console.log('🎯 Saving approval record...');
      const savedApproval = await queryRunner.manager.save(approval);
      console.log('✅ Approval saved with ID:', savedApproval.id, 'accidentId:', savedApproval.accidentId);

      // Update pole status based on new accident status
      if (accident.poleId) {
        const poleStatus = this.getPoleStatusFromAccidentStatus(newStatus);
        if (poleStatus) {
          await this.polesService.update(accident.poleId, { status: poleStatus });
        }
      }

      await queryRunner.commitTransaction();

      return accident;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async addPhoto(accidentId: string, file: Express.Multer.File, description?: string): Promise<AccidentPhoto> {
    const accident = await this.findOne(accidentId);

    // Upload file to MinIO
    const uploadResult = await this.fileService.uploadFile(file, `accidents/${accidentId}/photos`);

    const photo = this.photoRepository.create({
      accidentId,
      filename: uploadResult.fileName,
      originalName: uploadResult.originalName,
      mimeType: uploadResult.mimeType,
      size: uploadResult.size,
      path: uploadResult.url,
      description,
      isVideo: uploadResult.mimeType.startsWith('video/'),
    });

    return this.photoRepository.save(photo);
  }

  async addAttachment(accidentId: string, file: Express.Multer.File, attachmentType: string, description?: string): Promise<AccidentAttachment> {
    const accident = await this.findOne(accidentId);

    // Upload file to MinIO
    const uploadResult = await this.fileService.uploadFile(file, `accidents/${accidentId}/attachments`);

    const attachment = this.attachmentRepository.create({
      accidentId,
      filename: uploadResult.fileName,
      originalName: uploadResult.originalName,
      mimeType: uploadResult.mimeType,
      size: uploadResult.size,
      path: uploadResult.url,
      attachmentType: attachmentType as any,
      description,
    });

    return this.attachmentRepository.save(attachment);
  }

  async removePhoto(photoId: string, userId: string): Promise<void> {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId },
      relations: ['accident'],
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }

    // Only allow removal by the reporter or inspector
    if (photo.accident.reportedById !== userId && photo.accident.inspectedById !== userId) {
      throw new ForbiddenException('Insufficient permissions to remove photo');
    }

    await this.photoRepository.remove(photo);
  }

  async getDashboardStats(): Promise<{
    totalAccidents: number;
    monthlyAccidents: number;
    totalEstimatedCost: number;
    claimsSubmitted: number;
    claimsPaid: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalAccidents, monthlyAccidents, totalEstimatedCost, claimsStats] = await Promise.all([
      this.accidentRepository.count(),
      this.accidentRepository.count({
        where: { createdAt: { $gte: startOfMonth } as any },
      }),
      this.accidentRepository
        .createQueryBuilder('accident')
        .select('SUM(accident.estimatedCost)', 'total')
        .getRawOne(),
      this.accidentRepository
        .createQueryBuilder('accident')
        .select([
          'COUNT(CASE WHEN claimStatus = :submitted THEN 1 END) as submitted',
          'COUNT(CASE WHEN claimStatus = :paid THEN 1 END) as paid',
        ])
        .setParameters({ submitted: ClaimStatus.SUBMITTED, paid: ClaimStatus.PAID })
        .getRawOne(),
    ]);

    return {
      totalAccidents,
      monthlyAccidents,
      totalEstimatedCost: totalEstimatedCost?.total || 0,
      claimsSubmitted: parseInt(claimsStats?.submitted || '0'),
      claimsPaid: parseInt(claimsStats?.paid || '0'),
    };
  }

  private async generateIncidentId(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    // Get count of accidents this month
    const startOfMonth = new Date(year, now.getMonth(), 1);
    const count = await this.accidentRepository.count({
      where: { createdAt: MoreThanOrEqual(startOfMonth) },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `ACC-${year}${month}-${sequence}`;
  }

  private async getDamagedComponentEnumsForAccident(accidentId: string): Promise<DamagedComponent[]> {
    const junctionEntities = await this.dataSource
      .getRepository(AccidentsDamagedComponets)
      .find({
        where: { accidentId },
        relations: ['damagedComponent'],
      });

    return junctionEntities.map(junction => {
      // Map componentType string to enum value
      switch (junction.damagedComponent.componentType) {
        case 'POLE':
          return DamagedComponent.POLE;
        case 'LUMINAIRE':
          return DamagedComponent.LUMINAIRE;
        case 'ARM_BRACKET':
          return DamagedComponent.ARM_BRACKET;
        case 'FOUNDATION':
          return DamagedComponent.FOUNDATION;
        case 'CABLE':
          return DamagedComponent.CABLE;
        default:
          return DamagedComponent.POLE; // fallback
      }
    });
  }

  private async updateAccidentDamagedComponents(accidentId: string, damagedComponentIds: string[]): Promise<void> {
    // Delete existing junction table entries
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(AccidentsDamagedComponets)
      .where('accidentId = :accidentId', { accidentId })
      .execute();

    // Create new junction table entries
    if (damagedComponentIds.length > 0) {
      const junctionEntities = damagedComponentIds.map(componentId => ({
        accidentId,
        damagedComponentId: componentId,
      }));

      await this.dataSource
        .createQueryBuilder()
        .insert()
        .into(AccidentsDamagedComponets)
        .values(junctionEntities)
        .execute();
    }
  }

  private transformToEnumValues(damagedComponents: string[]): DamagedComponent[] {
    return damagedComponents.map(component => {
      // Try to match by enum value first
      const enumValue = Object.values(DamagedComponent).find(enumVal => enumVal === component);
      if (enumValue) return enumValue as DamagedComponent;

      // Try to match by component name (case insensitive)
      switch (component.toUpperCase()) {
        case 'POLE':
        case 'LIGHT POLE':
          return DamagedComponent.POLE;
        case 'LUMINAIRE':
        case 'LUMINAIRE':
          return DamagedComponent.LUMINAIRE;
        case 'ARM_BRACKET':
        case 'ARM BRACKET':
        case 'ARM & BRACKET':
          return DamagedComponent.ARM_BRACKET;
        case 'FOUNDATION':
          return DamagedComponent.FOUNDATION;
        case 'CABLE':
        case 'ELECTRICAL CABLE':
          return DamagedComponent.CABLE;
        default:
          // If no match found, try to find it in the enum
          const found = Object.values(DamagedComponent).find(enumVal =>
            enumVal.toLowerCase() === component.toLowerCase()
          );
          if (found) return found as DamagedComponent;

          // Default fallback
          console.warn(`Unknown damaged component: ${component}, defaulting to POLE`);
          return DamagedComponent.POLE;
      }
    });
  }

  private calculateCost(poleType: string, damageLevel: DamageLevel, damagedComponents: DamagedComponent[]): Promise<number> {
    let total = 0;

    // Add pole cost if pole is included
    if (damagedComponents.includes(DamagedComponent.POLE)) {
      const poleCosts = COST_ESTIMATION_TABLES.POLE_TYPES[poleType as keyof typeof COST_ESTIMATION_TABLES.POLE_TYPES] || COST_ESTIMATION_TABLES.POLE_TYPES.STANDARD;
      total += poleCosts[damageLevel];
    }

    // Add costs for each selected component
    for (const component of damagedComponents) {
      if (component !== DamagedComponent.POLE) { // Pole cost already added above
        const componentCosts = COST_ESTIMATION_TABLES.COMPONENTS[component as keyof typeof COST_ESTIMATION_TABLES.COMPONENTS];
        if (componentCosts) {
          total += componentCosts[damageLevel];
        }
      }
    }

    // Add fixed costs (labor and transport)
    total += COST_ESTIMATION_TABLES.FIXED_COSTS.LABOR;
    total += COST_ESTIMATION_TABLES.FIXED_COSTS.TRANSPORT_TRAFFIC_CONTROL;

    return Promise.resolve(total);
  }

  private async generateCostBreakdownFromComponents(damageLevel: DamageLevel, damagedComponentIds: string[]): Promise<any> {
    const allComponents = await this.damagedComponentsService.findActive();
    const breakdown: { [key: string]: number } = {
      labor: COST_ESTIMATION_TABLES.FIXED_COSTS.LABOR,
      transport: COST_ESTIMATION_TABLES.FIXED_COSTS.TRANSPORT_TRAFFIC_CONTROL,
      total: 0,
    };

    // Calculate costs for selected components based on damage level
    for (const componentId of damagedComponentIds) {
      const component = allComponents.find(c => c.id === componentId);
      if (component) {
        // Get cost based on damage level
        let cost = 0;
        switch (damageLevel) {
          case DamageLevel.MINOR:
            cost = Number(component.minorCost);
            break;
          case DamageLevel.MODERATE:
            cost = Number(component.moderateCost);
            break;
          case DamageLevel.SEVERE:
            cost = Number(component.severeCost);
            break;
          case DamageLevel.TOTAL_LOSS:
            cost = Number(component.totalLossCost);
            break;
        }
        // Use component ID as key for reliability
        breakdown[componentId] = cost;
      }
    }

    breakdown.total = Object.values(breakdown).reduce((sum: number, cost: number) => sum + cost, 0);
    return breakdown;
  }

  private async calculateCostFromComponents(damageLevel: DamageLevel, damagedComponentIds: string[]): Promise<number> {
    const breakdown = await this.generateCostBreakdownFromComponents(damageLevel, damagedComponentIds);
    return breakdown.total;
  }

  private generateCostBreakdown(poleType: string, damageLevel: DamageLevel, damagedComponents: DamagedComponent[]): any {
    const breakdown = {
      pole: 0,
      luminaire: 0,
      armBracket: 0,
      foundation: 0,
      cable: 0,
      labor: COST_ESTIMATION_TABLES.FIXED_COSTS.LABOR,
      transport: COST_ESTIMATION_TABLES.FIXED_COSTS.TRANSPORT_TRAFFIC_CONTROL,
      total: 0,
    };

    const poleCosts = COST_ESTIMATION_TABLES.POLE_TYPES[poleType as keyof typeof COST_ESTIMATION_TABLES.POLE_TYPES] || COST_ESTIMATION_TABLES.POLE_TYPES.STANDARD;
    breakdown.pole = poleCosts[damageLevel];

    for (const component of damagedComponents) {
      const componentCosts = COST_ESTIMATION_TABLES.COMPONENTS[component as keyof typeof COST_ESTIMATION_TABLES.COMPONENTS];
      if (componentCosts) {
        switch (component) {
          case DamagedComponent.LUMINAIRE:
            breakdown.luminaire = componentCosts[damageLevel];
            break;
          case DamagedComponent.ARM_BRACKET:
            breakdown.armBracket = componentCosts[damageLevel];
            break;
          case DamagedComponent.FOUNDATION:
            breakdown.foundation = componentCosts[damageLevel];
            break;
          case DamagedComponent.CABLE:
            breakdown.cable = componentCosts[damageLevel];
            break;
        }
      }
    }

    breakdown.total = breakdown.pole + breakdown.luminaire + breakdown.armBracket + breakdown.foundation + breakdown.cable + breakdown.labor + breakdown.transport;
    return breakdown;
  }

  async updateClaimStatus(id: string, claimStatus: string, userId: string): Promise<Accident> {
    console.log('🎯 Updating claim status for accident:', id, 'to:', claimStatus);

    const accident = await this.findOne(id);

    // Validate claim status
    const validStatuses = ['NOT_SUBMITTED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID'];
    if (!validStatuses.includes(claimStatus)) {
      throw new BadRequestException('Invalid claim status');
    }

    accident.claimStatus = claimStatus as any;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(accident);
      await queryRunner.commitTransaction();
      console.log('✅ Claim status updated to:', claimStatus);
      return accident;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private canApproveAsSupervisor(userRole: string): boolean {
    const role = userRole.toLowerCase();
    console.log('🔍 Checking supervisor approval for role:', userRole, '->', role);
    // Admin can do everything
    if (role === 'admin') return true;
    return ['supervisor', 'manager'].includes(role);
  }

  private canApproveAsFinance(userRole: string): boolean {
    const role = userRole.toLowerCase();
    console.log('🔍 Checking finance approval for role:', userRole, '->', role);
    // Admin can do everything
    if (role === 'admin') return true;
    return ['finance', 'manager'].includes(role);
  }


  private getPoleStatusFromAccidentStatus(accidentStatus: AccidentStatus): PoleStatus | null {
    switch (accidentStatus) {
      case AccidentStatus.REPORTED:
      case AccidentStatus.INSPECTED:
        return PoleStatus.FAULT_DAMAGED;
      case AccidentStatus.APPROVED:
      case AccidentStatus.UNDER_REPAIR:
        return PoleStatus.UNDER_MAINTENANCE;
      case AccidentStatus.COMPLETED:
        return PoleStatus.OPERATIONAL;
      default:
        return null;
    }
  }
}

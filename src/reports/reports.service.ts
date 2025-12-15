import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LightPole, PoleStatus } from '../poles/entities/light-pole.entity';
import { PoleIssue, IssueStatus } from '../issues/entities/pole-issue.entity';
import { MaintenanceLog, LogStatus } from '../maintenance/entities/maintenance-log.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(LightPole)
    private polesRepository: Repository<LightPole>,
    @InjectRepository(PoleIssue)
    private issuesRepository: Repository<PoleIssue>,
    @InjectRepository(MaintenanceLog)
    private logsRepository: Repository<MaintenanceLog>,
  ) {}

  async getSummary() {
    const totalPoles = await this.polesRepository.count();
    const activePoles = await this.polesRepository.count({
      where: { status: PoleStatus.ACTIVE },
    });
    const faultyPoles = await this.polesRepository.count({
      where: { status: PoleStatus.FAULT_DAMAGED },
    });
    const underMaintenancePoles = await this.polesRepository.count({
      where: { status: PoleStatus.UNDER_MAINTENANCE },
    });
    const operationalPoles = await this.polesRepository.count({
      where: { status: PoleStatus.OPERATIONAL },
    });

    const totalIssues = await this.issuesRepository.count();
    const openIssues = await this.issuesRepository.count({
      where: { status: IssueStatus.REPORTED },
    });
    const inProgressIssues = await this.issuesRepository.count({
      where: { status: IssueStatus.IN_PROGRESS },
    });
    const resolvedIssues = await this.issuesRepository.count({
      where: { status: IssueStatus.RESOLVED },
    });

    const totalMaintenanceLogs = await this.logsRepository.count();
    const completedMaintenance = await this.logsRepository.count({
      where: { status: LogStatus.COMPLETED },
    });

    return {
      poles: {
        total: totalPoles,
        active: activePoles,
        faulty: faultyPoles,
        underMaintenance: underMaintenancePoles,
        operational: operationalPoles,
      },
      issues: {
        total: totalIssues,
        open: openIssues,
        inProgress: inProgressIssues,
        resolved: resolvedIssues,
      },
      maintenance: {
        total: totalMaintenanceLogs,
        completed: completedMaintenance,
      },
    };
  }

  async getFaultyByDistrict() {
    const faultyPoles = await this.polesRepository.find({
      where: { status: PoleStatus.FAULT_DAMAGED },
      select: ['district', 'code'],
    });

    const districtCounts = faultyPoles.reduce((acc, pole) => {
      acc[pole.district] = (acc[pole.district] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(districtCounts).map(([district, count]) => ({
      district,
      count,
    }));
  }

  async getMaintenanceCost(query: { from?: string; to?: string; district?: string }) {
    const queryBuilder = this.logsRepository.createQueryBuilder('log');

    queryBuilder.where('log.status = :status', { status: LogStatus.COMPLETED });
    queryBuilder.andWhere('log.cost IS NOT NULL');

    if (query.from && query.to) {
      queryBuilder.andWhere('log.completedDate BETWEEN :from AND :to', {
        from: query.from,
        to: query.to,
      });
    }

    if (query.district) {
      queryBuilder
        .leftJoin('log.pole', 'pole')
        .andWhere('pole.district = :district', { district: query.district });
    }

    const logs = await queryBuilder.getMany();

    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const averageCost = logs.length > 0 ? totalCost / logs.length : 0;

    return {
      totalCost,
      averageCost,
      count: logs.length,
      period: {
        from: query.from,
        to: query.to,
      },
      district: query.district || 'all',
    };
  }

  async getInspectionReport() {
    const poles = await this.polesRepository.find({
      relations: ['issues'],
      order: { createdAt: 'DESC' },
    });

    return poles.map((pole) => ({
      code: pole.code,
      district: pole.district,
      street: pole.street,
      status: pole.status,
      issueCount: pole.issues?.length || 0,
      lastIssueDate: pole.issues?.[0]?.createdAt || null,
    }));
  }
}


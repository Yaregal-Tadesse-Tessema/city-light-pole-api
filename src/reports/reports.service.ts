import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LightPole, PoleStatus } from '../poles/entities/light-pole.entity';
import { PoleIssue, IssueStatus } from '../issues/entities/pole-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
import { ScheduleStatus } from '../maintenance/enums/maintenance.enums';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(LightPole)
    private polesRepository: Repository<LightPole>,
    @InjectRepository(PoleIssue)
    private issuesRepository: Repository<PoleIssue>,
    @InjectRepository(MaintenanceSchedule)
    private schedulesRepository: Repository<MaintenanceSchedule>,
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
    // Open issues = REPORTED + IN_PROGRESS (not yet resolved/closed)
    const totalOpenIssues = openIssues + inProgressIssues;

    const totalMaintenanceSchedules = await this.schedulesRepository.count();
    const completedMaintenance = await this.schedulesRepository.count({
      where: { status: ScheduleStatus.COMPLETED },
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
        open: totalOpenIssues, // Includes both REPORTED and IN_PROGRESS
        reported: openIssues,
        inProgress: inProgressIssues,
        resolved: resolvedIssues,
      },
      maintenance: {
        total: totalMaintenanceSchedules,
        completed: completedMaintenance,
      },
    };
  }

  async getFaultyByDistrict() {
    const queryBuilder = this.issuesRepository.createQueryBuilder('issue')
      .leftJoin('issue.pole', 'pole')
      .where('pole.status = :status', { status: PoleStatus.UNDER_MAINTENANCE })
      .select('pole.subcity', 'subcity')
      .addSelect('COUNT(pole.code)', 'count')
      .groupBy('pole.subcity');

    const results = await queryBuilder.getRawMany();

    return results.map((result) => ({
      district: result.subcity,
      count: parseInt(result.count, 10),
    }));
  }

  async getMaintenanceCost(query: { from?: string; to?: string; district?: string }) {
    const queryBuilder = this.schedulesRepository.createQueryBuilder('schedule');

    queryBuilder.where('schedule.status = :status', { status: ScheduleStatus.COMPLETED });
    queryBuilder.andWhere('schedule.cost IS NOT NULL');

    if (query.from && query.to) {
      queryBuilder.andWhere('schedule.completedDate BETWEEN :from AND :to', {
        from: query.from,
        to: query.to,
      });
    }
    if (query.district) {
      queryBuilder
        .leftJoin('schedule.pole', 'pole')
        .andWhere('pole.district = :district', { district: query.district });
    }

    const schedules = await queryBuilder.getMany();

    const totalCost = schedules.reduce((sum, schedule) => sum + (schedule.cost || 0), 0);
    const averageCost = schedules.length > 0 ? totalCost / schedules.length : 0;

    return {
      totalCost,
      averageCost,
      count: schedules.length,
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
      subcity: pole.subcity,
      street: pole.street,
      status: pole.status,
      issueCount: pole.issues?.length || 0,
      lastIssueDate: pole.issues?.[0]?.createdAt || null,
    }));
  }
}


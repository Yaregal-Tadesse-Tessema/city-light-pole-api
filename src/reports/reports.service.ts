import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LightPole, PoleStatus } from '../poles/entities/light-pole.entity';
import { PoleIssue, IssueStatus } from '../issues/entities/pole-issue.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
import { ScheduleStatus } from '../maintenance/enums/maintenance.enums';
import { PublicPark, ParkStatus } from '../parks/entities/public-park.entity';
import { ParkingLot, ParkingLotStatus } from '../parking-lots/entities/parking-lot.entity';
import { Museum, MuseumStatus } from '../museums/entities/museum.entity';
import { PublicToilet, PublicToiletStatus } from '../public-toilets/entities/public-toilet.entity';
import { FootballField, FootballFieldStatus } from '../football-fields/entities/football-field.entity';
import { RiverSideProject, RiverSideProjectStatus } from '../river-side-projects/entities/river-side-project.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(LightPole)
    private polesRepository: Repository<LightPole>,
    @InjectRepository(PoleIssue)
    private issuesRepository: Repository<PoleIssue>,
    @InjectRepository(MaintenanceSchedule)
    private schedulesRepository: Repository<MaintenanceSchedule>,
    @InjectRepository(PublicPark)
    private parksRepository: Repository<PublicPark>,
    @InjectRepository(ParkingLot)
    private parkingLotsRepository: Repository<ParkingLot>,
    @InjectRepository(Museum)
    private museumsRepository: Repository<Museum>,
    @InjectRepository(PublicToilet)
    private publicToiletsRepository: Repository<PublicToilet>,
    @InjectRepository(FootballField)
    private footballFieldsRepository: Repository<FootballField>,
    @InjectRepository(RiverSideProject)
    private riverSideProjectsRepository: Repository<RiverSideProject>,
  ) {}

  async getSummary() {
    const totalPoles = await this.polesRepository.count();
    const activePoles = await this.polesRepository.count({
      where: { status: PoleStatus.OPERATIONAL },
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

  async getPolesByType(subcity?: string) {
    const queryBuilder = this.polesRepository.createQueryBuilder('pole');

    if (subcity) {
      queryBuilder.where('pole.subcity = :subcity', { subcity });
    }

    queryBuilder
      .select('pole.poleType', 'poleType')
      .addSelect('COUNT(DISTINCT pole.code)', 'count')
      .groupBy('pole.poleType')
      .orderBy('pole.poleType', 'ASC');

    const results = await queryBuilder.getRawMany();

    return results.map((result) => ({
      poleType: result.poleType,
      count: parseInt(result.count, 10),
    }));
  }

  async getFaultyByDistrict(subcity?: string, assetType?: string) {
    if (!assetType || assetType === 'pole') {
      return this.getFaultyPolesByDistrict(subcity);
    }

    switch (assetType) {
      case 'park':
        return this.getFaultyParksByDistrict(subcity);
      case 'parking':
        return this.getFaultyParkingLotsByDistrict(subcity);
      case 'museum':
        return this.getFaultyMuseumsByDistrict(subcity);
      case 'toilet':
        return this.getFaultyPublicToiletsByDistrict(subcity);
      case 'football':
        return this.getFaultyFootballFieldsByDistrict(subcity);
      case 'river':
        return this.getFaultyRiverSideProjectsByDistrict(subcity);
      default:
        return this.getFaultyPolesByDistrict(subcity);
    }
  }

  private async getFaultyPolesByDistrict(subcity?: string) {
    const queryBuilder = this.polesRepository.createQueryBuilder('pole')
      .where('(pole.status = :status1 OR pole.status = :status2)', { 
        status1: PoleStatus.FAULT_DAMAGED,
        status2: PoleStatus.UNDER_MAINTENANCE 
      });

    if (subcity) {
      queryBuilder.andWhere('pole.subcity = :subcity', { subcity });
    }

    queryBuilder
      .select('pole.subcity', 'subcity')
      .addSelect('COUNT(DISTINCT pole.code)', 'count')
      .groupBy('pole.subcity');

    const results = await queryBuilder.getRawMany();

    return results.map((result) => ({
      district: result.subcity,
      count: parseInt(result.count, 10),
    }));
  }

  private async getFaultyParksByDistrict(subcity?: string) {
    const queryBuilder = this.parksRepository.createQueryBuilder('park')
      .where('(park.status = :status1 OR park.status = :status2)', { 
        status1: ParkStatus.FAULT_DAMAGED,
        status2: ParkStatus.UNDER_MAINTENANCE 
      });

    if (subcity) {
      queryBuilder.andWhere('park.district = :subcity', { subcity });
    }

    queryBuilder
      .select('park.district', 'subcity')
      .addSelect('COUNT(DISTINCT park.code)', 'count')
      .groupBy('park.district');

    const results = await queryBuilder.getRawMany();

    return results.map((result) => ({
      district: result.subcity,
      count: parseInt(result.count, 10),
    }));
  }

  private async getFaultyParkingLotsByDistrict(subcity?: string) {
    const queryBuilder = this.parkingLotsRepository.createQueryBuilder('lot')
      .where('(lot.status = :status1 OR lot.status = :status2)', { 
        status1: ParkingLotStatus.FAULT_DAMAGED,
        status2: ParkingLotStatus.UNDER_MAINTENANCE 
      });

    if (subcity) {
      queryBuilder.andWhere('lot.district = :subcity', { subcity });
    }

    queryBuilder
      .select('lot.district', 'subcity')
      .addSelect('COUNT(DISTINCT lot.code)', 'count')
      .groupBy('lot.district');

    const results = await queryBuilder.getRawMany();

    return results.map((result) => ({
      district: result.subcity,
      count: parseInt(result.count, 10),
    }));
  }

  private async getFaultyMuseumsByDistrict(subcity?: string) {
    const queryBuilder = this.museumsRepository.createQueryBuilder('museum')
      .where('(museum.status = :status1 OR museum.status = :status2)', { 
        status1: MuseumStatus.FAULT_DAMAGED,
        status2: MuseumStatus.UNDER_MAINTENANCE 
      });

    if (subcity) {
      queryBuilder.andWhere('museum.district = :subcity', { subcity });
    }

    queryBuilder
      .select('museum.district', 'subcity')
      .addSelect('COUNT(DISTINCT museum.code)', 'count')
      .groupBy('museum.district');

    const results = await queryBuilder.getRawMany();

    return results.map((result) => ({
      district: result.subcity,
      count: parseInt(result.count, 10),
    }));
  }

  private async getFaultyPublicToiletsByDistrict(subcity?: string) {
    const queryBuilder = this.publicToiletsRepository.createQueryBuilder('toilet')
      .where('(toilet.status = :status1 OR toilet.status = :status2)', { 
        status1: PublicToiletStatus.FAULT_DAMAGED,
        status2: PublicToiletStatus.UNDER_MAINTENANCE 
      });

    if (subcity) {
      queryBuilder.andWhere('toilet.district = :subcity', { subcity });
    }

    queryBuilder
      .select('toilet.district', 'subcity')
      .addSelect('COUNT(DISTINCT toilet.code)', 'count')
      .groupBy('toilet.district');

    const results = await queryBuilder.getRawMany();

    return results.map((result) => ({
      district: result.subcity,
      count: parseInt(result.count, 10),
    }));
  }

  private async getFaultyFootballFieldsByDistrict(subcity?: string) {
    const queryBuilder = this.footballFieldsRepository.createQueryBuilder('field')
      .where('(field.status = :status1 OR field.status = :status2)', { 
        status1: FootballFieldStatus.FAULT_DAMAGED,
        status2: FootballFieldStatus.UNDER_MAINTENANCE 
      });

    if (subcity) {
      queryBuilder.andWhere('field.district = :subcity', { subcity });
    }

    queryBuilder
      .select('field.district', 'subcity')
      .addSelect('COUNT(DISTINCT field.code)', 'count')
      .groupBy('field.district');

    const results = await queryBuilder.getRawMany();

    return results.map((result) => ({
      district: result.subcity,
      count: parseInt(result.count, 10),
    }));
  }

  private async getFaultyRiverSideProjectsByDistrict(subcity?: string) {
    const queryBuilder = this.riverSideProjectsRepository.createQueryBuilder('project')
      .where('(project.status = :status1 OR project.status = :status2)', { 
        status1: RiverSideProjectStatus.FAULT_DAMAGED,
        status2: RiverSideProjectStatus.UNDER_MAINTENANCE 
      });

    if (subcity) {
      queryBuilder.andWhere('project.district = :subcity', { subcity });
    }

    queryBuilder
      .select('project.district', 'subcity')
      .addSelect('COUNT(DISTINCT project.code)', 'count')
      .groupBy('project.district');

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

  async getMaintenancePolesByStreet() {
    const queryBuilder = this.polesRepository.createQueryBuilder('pole')
      .where('pole.status = :status', { status: PoleStatus.UNDER_MAINTENANCE })
      .andWhere('pole.street IS NOT NULL')
      .select('pole.street', 'street')
      .addSelect('COUNT(DISTINCT pole.code)', 'count')
      .groupBy('pole.street')
      .orderBy('count', 'DESC');

    const results = await queryBuilder.getRawMany();

    return results
      .filter((result) => result.street && result.street.trim() !== '')
      .map((result) => ({
        street: result.street,
        count: parseInt(result.count, 10),
      }));
  }

  async getMaintenancePolesBySubcity() {
    const queryBuilder = this.polesRepository.createQueryBuilder('pole')
      .where('pole.status = :status', { status: PoleStatus.UNDER_MAINTENANCE })
      .andWhere('pole.subcity IS NOT NULL')
      .select('pole.subcity', 'subcity')
      .addSelect('COUNT(DISTINCT pole.code)', 'count')
      .groupBy('pole.subcity')
      .orderBy('count', 'DESC');

    const results = await queryBuilder.getRawMany();

    return results
      .filter((result) => result.subcity && result.subcity.trim() !== '')
      .map((result) => ({
        subcity: result.subcity,
        count: parseInt(result.count, 10),
      }));
  }

  async getFailedPolesByStreet() {
    const queryBuilder = this.polesRepository.createQueryBuilder('pole')
      .where('pole.status = :status', { status: PoleStatus.FAULT_DAMAGED })
      .andWhere('pole.street IS NOT NULL')
      .select('pole.street', 'street')
      .addSelect('COUNT(DISTINCT pole.code)', 'count')
      .groupBy('pole.street')
      .orderBy('count', 'DESC');

    const results = await queryBuilder.getRawMany();

    return results
      .filter((result) => result.street && result.street.trim() !== '')
      .map((result) => ({
        street: result.street,
        count: parseInt(result.count, 10),
      }));
  }

  async getFailedPolesBySubcity() {
    const queryBuilder = this.polesRepository.createQueryBuilder('pole')
      .where('pole.status = :status', { status: PoleStatus.FAULT_DAMAGED })
      .andWhere('pole.subcity IS NOT NULL')
      .select('pole.subcity', 'subcity')
      .addSelect('COUNT(DISTINCT pole.code)', 'count')
      .groupBy('pole.subcity')
      .orderBy('count', 'DESC');

    const results = await queryBuilder.getRawMany();

    return results
      .filter((result) => result.subcity && result.subcity.trim() !== '')
      .map((result) => ({
        subcity: result.subcity,
        count: parseInt(result.count, 10),
      }));
  }

  async getOperationalPolesByStreet() {
    const queryBuilder = this.polesRepository.createQueryBuilder('pole')
      .where('pole.status = :status', { status: PoleStatus.OPERATIONAL })
      .andWhere('pole.street IS NOT NULL')
      .select('pole.street', 'street')
      .addSelect('COUNT(DISTINCT pole.code)', 'count')
      .groupBy('pole.street')
      .orderBy('count', 'DESC');

    const results = await queryBuilder.getRawMany();

    return results
      .filter((result) => result.street && result.street.trim() !== '')
      .map((result) => ({
        street: result.street,
        count: parseInt(result.count, 10),
      }));
  }

  async getOperationalPolesBySubcity() {
    const queryBuilder = this.polesRepository.createQueryBuilder('pole')
      .where('pole.status = :status', { status: PoleStatus.OPERATIONAL })
      .andWhere('pole.subcity IS NOT NULL')
      .select('pole.subcity', 'subcity')
      .addSelect('COUNT(DISTINCT pole.code)', 'count')
      .groupBy('pole.subcity')
      .orderBy('count', 'DESC');

    const results = await queryBuilder.getRawMany();

    return results
      .filter((result) => result.subcity && result.subcity.trim() !== '')
      .map((result) => ({
        subcity: result.subcity,
        count: parseInt(result.count, 10),
      }));
  }
}

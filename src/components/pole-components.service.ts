import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LightPole } from '../poles/entities/light-pole.entity';
import { Component } from './entities/component.entity';
import { PoleComponent } from './entities/pole-component.entity';
import { AssignComponentToPoleDto } from './dto/assign-component-to-pole.dto';
import { BulkAssignComponentsDto } from './dto/bulk-assign-components.dto';
import { UpdatePoleComponentStatusDto } from './dto/update-pole-component-status.dto';
import { ComponentStatus } from './enums/component.enums';

@Injectable()
export class PoleComponentsService {
  constructor(
    @InjectRepository(LightPole)
    private polesRepository: Repository<LightPole>,
    @InjectRepository(Component)
    private componentsRepository: Repository<Component>,
    @InjectRepository(PoleComponent)
    private poleComponentsRepository: Repository<PoleComponent>,
  ) {}

  private async getPoleOrFail(poleCode: string): Promise<LightPole> {
    const pole = await this.polesRepository.findOne({ where: { code: poleCode } });
    if (!pole) {
      throw new NotFoundException(`Pole with code ${poleCode} not found`);
    }
    return pole;
  }

  private async getComponentOrFail(componentId: string): Promise<Component> {
    const component = await this.componentsRepository.findOne({
      where: { id: componentId },
    });
    if (!component) {
      throw new NotFoundException(`Component with ID ${componentId} not found`);
    }
    return component;
  }

  async assignComponent(
    poleCode: string,
    dto: AssignComponentToPoleDto,
    installedById?: string,
  ): Promise<PoleComponent> {
    await this.getPoleOrFail(poleCode);
    const component = await this.getComponentOrFail(dto.componentId);

    if (!component.isActive) {
      throw new BadRequestException('Cannot assign inactive component to pole');
    }
    if (dto.quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const installationDate = new Date(dto.installationDate);
    if (installationDate > new Date()) {
      throw new BadRequestException('Installation date cannot be in the future');
    }

    // Check if component is already INSTALLED (active) on this pole
    const existingActiveInstallation = await this.poleComponentsRepository.findOne({
      where: {
        poleId: poleCode,
        componentId: dto.componentId,
        status: ComponentStatus.INSTALLED,
      },
    });

    if (existingActiveInstallation) {
      throw new BadRequestException(
        `Component is already installed on this pole. Update the existing installation instead.`,
      );
    }

    // If component was previously REMOVED, we can create a new installation
    // Create new assignment
    const poleComponent = this.poleComponentsRepository.create({
      poleId: poleCode,
      componentId: dto.componentId,
      quantity: dto.quantity,
      installationDate,
      installedById: installedById || null,
      status: ComponentStatus.INSTALLED,
      notes: dto.notes,
    });
    return this.poleComponentsRepository.save(poleComponent);
  }

  async bulkAssignComponents(
    poleCode: string,
    dto: BulkAssignComponentsDto,
    installedById?: string,
  ): Promise<PoleComponent[]> {
    await this.getPoleOrFail(poleCode);
    const results: PoleComponent[] = [];

    for (const item of dto.components) {
      const result = await this.assignComponent(poleCode, item, installedById);
      results.push(result);
    }
    return results;
  }

  async getPoleComponents(
    poleCode: string,
    options?: { status?: ComponentStatus; includeRemoved?: boolean },
  ) {
    await this.getPoleOrFail(poleCode);

    const queryBuilder = this.poleComponentsRepository
      .createQueryBuilder('pc')
      .leftJoinAndSelect('pc.component', 'component')
      .leftJoinAndSelect('pc.installedBy', 'installedBy')
      .leftJoinAndSelect('pc.removedBy', 'removedBy')
      .where('pc.poleId = :poleCode', { poleCode });

    if (options?.status) {
      queryBuilder.andWhere('pc.status = :status', { status: options.status });
    } else if (!options?.includeRemoved) {
      queryBuilder.andWhere('pc.status != :removed', {
        removed: ComponentStatus.REMOVED,
      });
    }

    queryBuilder.orderBy('pc.installationDate', 'DESC');

    return queryBuilder.getMany();
  }

  async getPoleComponent(poleCode: string, componentId: string) {
    await this.getPoleOrFail(poleCode);
    const poleComponent = await this.poleComponentsRepository.findOne({
      where: { poleId: poleCode, componentId },
      relations: ['component', 'pole', 'installedBy', 'removedBy'],
    });
    if (!poleComponent) {
      throw new NotFoundException(
        `Component ${componentId} is not installed on pole ${poleCode}`,
      );
    }
    return poleComponent;
  }

  async updatePoleComponent(
    poleCode: string,
    componentId: string,
    dto: UpdatePoleComponentStatusDto,
    removedById?: string,
  ) {
    const poleComponent = await this.getPoleComponent(poleCode, componentId);

    if (dto.status) {
      poleComponent.status = dto.status;
      if (dto.status === ComponentStatus.REMOVED) {
        poleComponent.removedDate = dto.removedDate
          ? new Date(dto.removedDate)
          : new Date();
        poleComponent.removedById = removedById || null;
      }
    }

    if (dto.quantity !== undefined) {
      if (dto.quantity < 0) {
        throw new BadRequestException('Quantity cannot be negative');
      }
      if (dto.quantity === 0) {
        poleComponent.status = ComponentStatus.REMOVED;
        poleComponent.removedDate = new Date();
        poleComponent.removedById = removedById || null;
      }
      poleComponent.quantity = dto.quantity;
    }

    if (dto.notes !== undefined) {
      poleComponent.notes = dto.notes;
    }

    return this.poleComponentsRepository.save(poleComponent);
  }

  async removeComponent(
    poleCode: string,
    componentId: string,
    quantity?: number,
    removedById?: string,
  ) {
    const poleComponent = await this.getPoleComponent(poleCode, componentId);

    if (poleComponent.status === ComponentStatus.REMOVED) {
      throw new BadRequestException('Component is already removed from this pole');
    }

    if (quantity !== undefined) {
      if (quantity <= 0 || quantity > poleComponent.quantity) {
        throw new BadRequestException(
          `Quantity must be between 1 and ${poleComponent.quantity}`,
        );
      }
      poleComponent.quantity -= quantity;
      if (poleComponent.quantity === 0) {
        poleComponent.status = ComponentStatus.REMOVED;
        poleComponent.removedDate = new Date();
        poleComponent.removedById = removedById || null;
      }
    } else {
      poleComponent.status = ComponentStatus.REMOVED;
      poleComponent.removedDate = new Date();
      poleComponent.removedById = removedById || null;
    }

    return this.poleComponentsRepository.save(poleComponent);
  }

  async getComponentPoles(
    componentId: string,
    options?: { status?: ComponentStatus; includeRemoved?: boolean },
  ) {
    await this.getComponentOrFail(componentId);

    const queryBuilder = this.poleComponentsRepository
      .createQueryBuilder('pc')
      .leftJoinAndSelect('pc.pole', 'pole')
      .leftJoinAndSelect('pc.installedBy', 'installedBy')
      .leftJoinAndSelect('pc.removedBy', 'removedBy')
      .where('pc.componentId = :componentId', { componentId });

    if (options?.status) {
      queryBuilder.andWhere('pc.status = :status', { status: options.status });
    } else if (!options?.includeRemoved) {
      queryBuilder.andWhere('pc.status != :removed', {
        removed: ComponentStatus.REMOVED,
      });
    }

    queryBuilder.orderBy('pc.installationDate', 'DESC');

    return queryBuilder.getMany();
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Component } from './entities/component.entity';
import { PoleComponent } from './entities/pole-component.entity';
import { CreateComponentDto } from './dto/create-component.dto';
import { UpdateComponentDto } from './dto/update-component.dto';
import { QueryComponentsDto } from './dto/query-components.dto';
import { ComponentStatus, ComponentType } from './enums/component.enums';

@Injectable()
export class ComponentsService {
  constructor(
    @InjectRepository(Component)
    private componentsRepository: Repository<Component>,
    @InjectRepository(PoleComponent)
    private poleComponentsRepository: Repository<PoleComponent>,
  ) {}

  async create(createComponentDto: CreateComponentDto): Promise<Component> {
    await this.validateComponentData(createComponentDto);

    if (createComponentDto.sku) {
      const existingSku = await this.componentsRepository.findOne({
        where: { sku: createComponentDto.sku },
      });
      if (existingSku) {
        throw new ConflictException(`Component with SKU ${createComponentDto.sku} already exists`);
      }
    }
    if (createComponentDto.barcode) {
      const existingBarcode = await this.componentsRepository.findOne({
        where: { barcode: createComponentDto.barcode },
      });
      if (existingBarcode) {
        throw new ConflictException(`Component with barcode ${createComponentDto.barcode} already exists`);
      }
    }
    if (createComponentDto.qrCode) {
      const existingQr = await this.componentsRepository.findOne({
        where: { qrCode: createComponentDto.qrCode },
      });
      if (existingQr) {
        throw new ConflictException(`Component with QR code ${createComponentDto.qrCode} already exists`);
      }
    }

    const component = this.componentsRepository.create({
      ...createComponentDto,
      manufactureDate: createComponentDto.manufactureDate
        ? new Date(createComponentDto.manufactureDate)
        : null,
      type: createComponentDto.type ?? ComponentType.OTHER,
      isActive: createComponentDto.isActive ?? true,
    });
    return this.componentsRepository.save(component);
  }

  private async validateComponentData(dto: CreateComponentDto | UpdateComponentDto): Promise<void> {
    if (dto.operatingTempMin !== undefined && dto.operatingTempMax !== undefined) {
      if (dto.operatingTempMin >= dto.operatingTempMax) {
        throw new BadRequestException('operatingTempMin must be less than operatingTempMax');
      }
    }
    if (dto.manufactureDate) {
      const manufactureDate = new Date(dto.manufactureDate);
      if (manufactureDate > new Date()) {
        throw new BadRequestException('manufactureDate cannot be in the future');
      }
    }
  }

  async findAll(queryDto: QueryComponentsDto) {
    const {
      page = 1,
      limit = 10,
      type,
      manufacturer,
      manufacturerCountry,
      isActive,
      tag,
      search,
      sortBy = 'createdAt',
      sortDirection = 'desc',
    } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.componentsRepository.createQueryBuilder('component');

    if (type) {
      queryBuilder.andWhere('component.type = :type', { type });
    }
    if (manufacturer) {
      queryBuilder.andWhere('component.manufacturerName ILIKE :manufacturer', {
        manufacturer: `%${manufacturer}%`,
      });
    }
    if (manufacturerCountry) {
      queryBuilder.andWhere('component.manufacturerCountry ILIKE :manufacturerCountry', {
        manufacturerCountry: `%${manufacturerCountry}%`,
      });
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere('component.isActive = :isActive', { isActive });
    }
    if (tag) {
      queryBuilder.andWhere(
        "(',' || COALESCE(component.tags, '') || ',') LIKE (:tagPattern)",
        { tagPattern: `%,${tag},%` },
      );
    }
    if (search) {
      queryBuilder.andWhere(
        '(component.name ILIKE :search OR component.model ILIKE :search OR component.partNumber ILIKE :search OR component.sku ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const sortColumn = sortBy === 'manufacturerName' ? 'component.manufacturerName' :
      sortBy === 'manufacturerCountry' ? 'component.manufacturerCountry' :
      `component.${sortBy}`;
    queryBuilder.orderBy(sortColumn, sortDirection.toUpperCase() as 'ASC' | 'DESC');

    const [items, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      page,
      limit,
      total,
      items,
    };
  }

  async findOne(id: string): Promise<Component> {
    const component = await this.componentsRepository.findOne({
      where: { id },
      relations: ['poleComponents', 'poleComponents.pole'],
    });
    if (!component) {
      throw new NotFoundException(`Component with ID ${id} not found`);
    }
    return component;
  }

  async update(id: string, updateComponentDto: UpdateComponentDto): Promise<Component> {
    const component = await this.findOne(id);

    const installedCount = await this.poleComponentsRepository.count({
      where: {
        componentId: id,
        status: ComponentStatus.INSTALLED,
      },
    });
    if (installedCount > 0) {
      throw new BadRequestException(
        'Cannot update component that is currently installed on poles. Remove from poles first.',
      );
    }

    await this.validateComponentData(updateComponentDto);

    if (updateComponentDto.sku && updateComponentDto.sku !== component.sku) {
      const existingSku = await this.componentsRepository.findOne({
        where: { sku: updateComponentDto.sku },
      });
      if (existingSku) {
        throw new ConflictException(`Component with SKU ${updateComponentDto.sku} already exists`);
      }
    }
    if (updateComponentDto.barcode && updateComponentDto.barcode !== component.barcode) {
      const existingBarcode = await this.componentsRepository.findOne({
        where: { barcode: updateComponentDto.barcode },
      });
      if (existingBarcode) {
        throw new ConflictException(`Component with barcode ${updateComponentDto.barcode} already exists`);
      }
    }
    if (updateComponentDto.qrCode && updateComponentDto.qrCode !== component.qrCode) {
      const existingQr = await this.componentsRepository.findOne({
        where: { qrCode: updateComponentDto.qrCode },
      });
      if (existingQr) {
        throw new ConflictException(`Component with QR code ${updateComponentDto.qrCode} already exists`);
      }
    }

    Object.assign(component, {
      ...updateComponentDto,
      manufactureDate: updateComponentDto.manufactureDate
        ? new Date(updateComponentDto.manufactureDate)
        : component.manufactureDate,
    });
    return this.componentsRepository.save(component);
  }

  async remove(id: string): Promise<void> {
    const component = await this.findOne(id);

    const installedCount = await this.poleComponentsRepository.count({
      where: {
        componentId: id,
        status: ComponentStatus.INSTALLED,
      },
    });
    if (installedCount > 0) {
      throw new BadRequestException(
        'Cannot delete component that is currently installed on poles. Remove from poles first.',
      );
    }

    component.isActive = false;
    await this.componentsRepository.save(component);
  }

  async getInstallationHistory(componentId: string) {
    await this.findOne(componentId);
    const poleComponents = await this.poleComponentsRepository.find({
      where: { componentId },
      relations: ['pole', 'installedBy', 'removedBy'],
      order: { installationDate: 'DESC' },
    });
    return poleComponents;
  }
}

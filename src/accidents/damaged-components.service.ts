import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DamagedComponent } from './entities/damaged-component.entity';
import { CreateDamagedComponentDto } from './dto/create-damaged-component.dto';
import { UpdateDamagedComponentDto } from './dto/update-damaged-component.dto';

@Injectable()
export class DamagedComponentsService {
  constructor(
    @InjectRepository(DamagedComponent)
    private readonly damagedComponentRepository: Repository<DamagedComponent>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  getDataSource(): DataSource {
    return this.dataSource;
  }

  async create(createDamagedComponentDto: CreateDamagedComponentDto): Promise<DamagedComponent> {
    // Check if component with same name already exists
    const existingComponent = await this.damagedComponentRepository.findOne({
      where: { name: createDamagedComponentDto.name }
    });

    if (existingComponent) {
      throw new ConflictException(`Damaged component with name '${createDamagedComponentDto.name}' already exists`);
    }

    const component = this.damagedComponentRepository.create({
      ...createDamagedComponentDto,
      isActive: createDamagedComponentDto.isActive ?? true,
      sortOrder: createDamagedComponentDto.sortOrder ?? 0,
    });

    return await this.damagedComponentRepository.save(component);
  }

  async findAll(): Promise<DamagedComponent[]> {
    return await this.damagedComponentRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' }
    });
  }

  async findOne(id: string): Promise<DamagedComponent> {
    const component = await this.damagedComponentRepository.findOne({
      where: { id }
    });

    if (!component) {
      throw new NotFoundException(`Damaged component with ID ${id} not found`);
    }

    return component;
  }

  async update(id: string, updateDamagedComponentDto: UpdateDamagedComponentDto): Promise<DamagedComponent> {
    const component = await this.findOne(id);

    // Check if updating name and it conflicts with existing component
    if (updateDamagedComponentDto.name && updateDamagedComponentDto.name !== component.name) {
      const existingComponent = await this.damagedComponentRepository.findOne({
        where: { name: updateDamagedComponentDto.name }
      });

      if (existingComponent) {
        throw new ConflictException(`Damaged component with name '${updateDamagedComponentDto.name}' already exists`);
      }
    }

    Object.assign(component, updateDamagedComponentDto);
    return await this.damagedComponentRepository.save(component);
  }

  async remove(id: string): Promise<void> {
    const component = await this.findOne(id);
    await this.damagedComponentRepository.remove(component);
  }

  async findActive(): Promise<DamagedComponent[]> {
    return await this.damagedComponentRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' }
    });
  }
}

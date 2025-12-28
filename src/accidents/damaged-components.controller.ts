import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { DamagedComponentsService } from './damaged-components.service';
import { DamagedComponent } from './entities/damaged-component.entity';
import { CreateDamagedComponentDto } from './dto/create-damaged-component.dto';
import { UpdateDamagedComponentDto } from './dto/update-damaged-component.dto';

@ApiTags('damaged-components')
@Controller('damaged-components')
export class DamagedComponentsController {
  constructor(private readonly damagedComponentsService: DamagedComponentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new damaged component' })
  @ApiResponse({
    status: 201,
    description: 'The damaged component has been successfully created',
    type: DamagedComponent,
  })
  @ApiResponse({ status: 409, description: 'Damaged component with this name already exists' })
  create(@Body() createDamagedComponentDto: CreateDamagedComponentDto): Promise<DamagedComponent> {
    return this.damagedComponentsService.create(createDamagedComponentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all damaged components' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter to only return active components'
  })
  @ApiResponse({
    status: 200,
    description: 'List of all damaged components',
    type: [DamagedComponent],
  })
  findAll(@Query('activeOnly') activeOnly?: string): Promise<DamagedComponent[]> {
    if (activeOnly === 'true') {
      return this.damagedComponentsService.findActive();
    }
    return this.damagedComponentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific damaged component by ID' })
  @ApiParam({
    name: 'id',
    description: 'Damaged component ID',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({
    status: 200,
    description: 'The damaged component',
    type: DamagedComponent,
  })
  @ApiResponse({ status: 404, description: 'Damaged component not found' })
  findOne(@Param('id') id: string): Promise<DamagedComponent> {
    return this.damagedComponentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a damaged component' })
  @ApiParam({
    name: 'id',
    description: 'Damaged component ID',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({
    status: 200,
    description: 'The damaged component has been successfully updated',
    type: DamagedComponent,
  })
  @ApiResponse({ status: 404, description: 'Damaged component not found' })
  @ApiResponse({ status: 409, description: 'Damaged component with this name already exists' })
  update(
    @Param('id') id: string,
    @Body() updateDamagedComponentDto: UpdateDamagedComponentDto,
  ): Promise<DamagedComponent> {
    return this.damagedComponentsService.update(id, updateDamagedComponentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a damaged component' })
  @ApiParam({
    name: 'id',
    description: 'Damaged component ID',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({
    status: 200,
    description: 'The damaged component has been successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Damaged component not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.damagedComponentsService.remove(id);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed the database with initial damaged component data' })
  @ApiResponse({
    status: 201,
    description: 'Damaged components have been seeded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Damaged components seeded successfully' },
        count: { type: 'number', example: 5 }
      }
    }
  })
  async seed(): Promise<{ message: string; count: number }> {
    // Import here to avoid circular dependencies
    const { seedDamagedComponents } = await import('./seed-damaged-components');

    const dataSource = this.damagedComponentsService.getDataSource();
    await seedDamagedComponents(dataSource);

    const count = await this.damagedComponentsService.findAll().then(components => components.length);
    return { message: 'Damaged components seeded successfully', count };
  }
}

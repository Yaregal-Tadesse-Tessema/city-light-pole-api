import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ComponentsService } from './components.service';
import { PoleComponentsService } from './pole-components.service';
import { CreateComponentDto } from './dto/create-component.dto';
import { UpdateComponentDto } from './dto/update-component.dto';
import { QueryComponentsDto } from './dto/query-components.dto';

@ApiTags('Components')
@Controller('components')
export class ComponentsController {
  constructor(
    private readonly componentsService: ComponentsService,
    private readonly poleComponentsService: PoleComponentsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new component' })
  async create(@Body() createComponentDto: CreateComponentDto) {
    return this.componentsService.create(createComponentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all components',
    description: 'Returns paginated list with filters: type, manufacturer, manufacturerCountry, isActive, tags, search',
  })
  async findAll(@Query() queryDto: QueryComponentsDto) {
    return this.componentsService.findAll(queryDto);
  }

  @Get(':id/installation-history')
  @ApiOperation({ summary: 'Get installation history for a component' })
  @ApiParam({ name: 'id', description: 'Component UUID' })
  async getInstallationHistory(@Param('id') id: string) {
    return this.componentsService.getInstallationHistory(id);
  }

  @Get(':id/poles')
  @ApiOperation({ summary: 'Get all poles where component is/was installed' })
  @ApiParam({ name: 'id', description: 'Component UUID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'includeRemoved', required: false, type: Boolean })
  async getComponentPoles(
    @Param('id') id: string,
    @Query('status') status?: string,
    @Query('includeRemoved') includeRemoved?: string,
  ) {
    return this.poleComponentsService.getComponentPoles(id, {
      status: status as any,
      includeRemoved: includeRemoved === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get component details' })
  @ApiParam({ name: 'id', description: 'Component UUID' })
  async findOne(@Param('id') id: string) {
    return this.componentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a component' })
  @ApiParam({ name: 'id', description: 'Component UUID' })
  async update(@Param('id') id: string, @Body() updateComponentDto: UpdateComponentDto) {
    return this.componentsService.update(id, updateComponentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a component (soft delete)' })
  @ApiParam({ name: 'id', description: 'Component UUID' })
  async remove(@Param('id') id: string) {
    await this.componentsService.remove(id);
    return { message: 'Component deleted successfully' };
  }
}

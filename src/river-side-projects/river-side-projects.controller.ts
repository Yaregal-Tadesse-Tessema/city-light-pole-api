import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RiverSideProjectsService } from './river-side-projects.service';
import { CreateRiverSideProjectDto } from './dto/create-river-side-project.dto';
import { UpdateRiverSideProjectDto } from './dto/update-river-side-project.dto';
import { QueryRiverSideProjectsDto } from './dto/query-river-side-projects.dto';

@ApiTags('River Side Projects')
@Controller('river-side-projects')
export class RiverSideProjectsController {
  constructor(private readonly service: RiverSideProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new river side project (ADMIN only)' })
  create(@Body() dto: CreateRiverSideProjectDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all river side projects with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'district', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(@Query() queryDto: QueryRiverSideProjectsDto) {
    return this.service.findAll(queryDto);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get river side project by code (includes latest issues + maintenance)' })
  findOne(@Param('code') code: string) {
    return this.service.findOne(code);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update a river side project (ADMIN only)' })
  update(@Param('code') code: string, @Body() dto: UpdateRiverSideProjectDto) {
    return this.service.update(code, dto);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Delete a river side project (ADMIN only)' })
  async remove(@Param('code') code: string) {
    await this.service.remove(code);
    return { message: 'River side project deleted successfully' };
  }

  @Post(':code/qr')
  @ApiOperation({ summary: 'Generate QR code for a river side project (ADMIN only)' })
  generateQR(@Param('code') code: string) {
    return this.service.generateQR(code);
  }

  @Get(':code/maintenance-history')
  @ApiOperation({ summary: 'Get maintenance history for a river side project by code' })
  getMaintenanceHistory(@Param('code') code: string) {
    return this.service.getMaintenanceHistory(code);
  }
}



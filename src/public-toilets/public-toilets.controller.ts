import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PublicToiletsService } from './public-toilets.service';
import { CreatePublicToiletDto } from './dto/create-public-toilet.dto';
import { UpdatePublicToiletDto } from './dto/update-public-toilet.dto';
import { QueryPublicToiletsDto } from './dto/query-public-toilets.dto';
import { MaintenanceSchedule } from '@/maintenance/entities/maintenance-schedule.entity';

@ApiTags('Public Toilets')
@Controller('public-toilets')
export class PublicToiletsController {
  constructor(private readonly service: PublicToiletsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new public toilet (ADMIN only)' })
  async create(@Body() dto: CreatePublicToiletDto) {
    return await this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all public toilets with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'district', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async findAll(@Query() queryDto: QueryPublicToiletsDto) {
    return await this.service.findAll(queryDto);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get public toilet by code (includes latest issues + maintenance)' })
  async findOne(@Param('code') code: string) {
    return await this.service.findOne(code);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update a public toilet (ADMIN only)' })
  async update(@Param('code') code: string, @Body() dto: UpdatePublicToiletDto) {
    return await this.service.update(code, dto);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Delete a public toilet (ADMIN only)' })
  async remove(@Param('code') code: string): Promise<{ message: string }> {
    await this.service.remove(code);
    return { message: 'Public toilet deleted successfully' };
  }

  @Post(':code/qr')
  @ApiOperation({ summary: 'Generate QR code for a public toilet (ADMIN only)' })
  async generateQR(@Param('code') code: string): Promise<{ qrPayload: string, qrImageUrl: string }> {
    return await this.service.generateQR(code);
  }

  @Get(':code/maintenance-history')
  @ApiOperation({ summary: 'Get maintenance history for a public toilet by code' })
  async getMaintenanceHistory(@Param('code') code: string): Promise<MaintenanceSchedule[]> {
    return await this.service.getMaintenanceHistory(code);
  }
}



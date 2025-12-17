import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FootballFieldsService } from './football-fields.service';
import { CreateFootballFieldDto } from './dto/create-football-field.dto';
import { UpdateFootballFieldDto } from './dto/update-football-field.dto';
import { QueryFootballFieldsDto } from './dto/query-football-fields.dto';

@ApiTags('Football Fields')
@Controller('football-fields')
export class FootballFieldsController {
  constructor(private readonly service: FootballFieldsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new football field (ADMIN only)' })
  create(@Body() dto: CreateFootballFieldDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all football fields with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'district', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(@Query() queryDto: QueryFootballFieldsDto) {
    return this.service.findAll(queryDto);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get football field by code (includes latest issues + maintenance)' })
  findOne(@Param('code') code: string) {
    return this.service.findOne(code);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update a football field (ADMIN only)' })
  update(@Param('code') code: string, @Body() dto: UpdateFootballFieldDto) {
    return this.service.update(code, dto);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Delete a football field (ADMIN only)' })
  async remove(@Param('code') code: string) {
    await this.service.remove(code);
    return { message: 'Football field deleted successfully' };
  }

  @Post(':code/qr')
  @ApiOperation({ summary: 'Generate QR code for a football field (ADMIN only)' })
  generateQR(@Param('code') code: string) {
    return this.service.generateQR(code);
  }

  @Get(':code/maintenance-history')
  @ApiOperation({ summary: 'Get maintenance history for a football field by code' })
  getMaintenanceHistory(@Param('code') code: string) {
    return this.service.getMaintenanceHistory(code);
  }
}



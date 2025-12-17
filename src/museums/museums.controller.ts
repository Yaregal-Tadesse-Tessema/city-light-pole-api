import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MuseumsService } from './museums.service';
import { CreateMuseumDto } from './dto/create-museum.dto';
import { UpdateMuseumDto } from './dto/update-museum.dto';
import { QueryMuseumsDto } from './dto/query-museums.dto';

@ApiTags('Museums')
@Controller('museums')
export class MuseumsController {
  constructor(private readonly museumsService: MuseumsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new museum (ADMIN only)' })
  create(@Body() dto: CreateMuseumDto) {
    return this.museumsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all museums with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'district', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(@Query() queryDto: QueryMuseumsDto) {
    return this.museumsService.findAll(queryDto);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get museum by code (includes latest issues + maintenance)' })
  findOne(@Param('code') code: string) {
    return this.museumsService.findOne(code);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update a museum (ADMIN only)' })
  update(@Param('code') code: string, @Body() dto: UpdateMuseumDto) {
    return this.museumsService.update(code, dto);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Delete a museum (ADMIN only)' })
  async remove(@Param('code') code: string) {
    await this.museumsService.remove(code);
    return { message: 'Museum deleted successfully' };
  }

  @Post(':code/qr')
  @ApiOperation({ summary: 'Generate QR code for a museum (ADMIN only)' })
  generateQR(@Param('code') code: string) {
    return this.museumsService.generateQR(code);
  }

  @Get(':code/maintenance-history')
  @ApiOperation({ summary: 'Get maintenance history for a museum by code' })
  getMaintenanceHistory(@Param('code') code: string) {
    return this.museumsService.getMaintenanceHistory(code);
  }
}



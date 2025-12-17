import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ParkingLotsService } from './parking-lots.service';
import { CreateParkingLotDto } from './dto/create-parking-lot.dto';
import { UpdateParkingLotDto } from './dto/update-parking-lot.dto';
import { QueryParkingLotsDto } from './dto/query-parking-lots.dto';

@ApiTags('Parking Lots')
@Controller('parking-lots')
export class ParkingLotsController {
  constructor(private readonly parkingLotsService: ParkingLotsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new parking lot (ADMIN only)' })
  create(@Body() dto: CreateParkingLotDto) {
    return this.parkingLotsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all parking lots with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'district', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(@Query() queryDto: QueryParkingLotsDto) {
    return this.parkingLotsService.findAll(queryDto);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get parking lot by code (includes latest issues + maintenance)' })
  findOne(@Param('code') code: string) {
    return this.parkingLotsService.findOne(code);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update a parking lot (ADMIN only)' })
  update(@Param('code') code: string, @Body() dto: UpdateParkingLotDto) {
    return this.parkingLotsService.update(code, dto);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Delete a parking lot (ADMIN only)' })
  async remove(@Param('code') code: string) {
    await this.parkingLotsService.remove(code);
    return { message: 'Parking lot deleted successfully' };
  }

  @Post(':code/qr')
  @ApiOperation({ summary: 'Generate QR code for a parking lot (ADMIN only)' })
  generateQR(@Param('code') code: string) {
    return this.parkingLotsService.generateQR(code);
  }

  @Get(':code/maintenance-history')
  @ApiOperation({ summary: 'Get maintenance history for a parking lot by code' })
  getMaintenanceHistory(@Param('code') code: string) {
    return this.parkingLotsService.getMaintenanceHistory(code);
  }
}



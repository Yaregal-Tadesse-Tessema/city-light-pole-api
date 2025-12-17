import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ParksService } from './parks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateParkDto } from './dto/create-park.dto';
import { UpdateParkDto } from './dto/update-park.dto';
import { QueryParksDto } from './dto/query-parks.dto';

@ApiTags('Parks')
@Controller('parks')
export class ParksController {
  constructor(private readonly parksService: ParksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new public park (ADMIN only)' })
  async create(@Body() createParkDto: CreateParkDto) {
    return this.parksService.create(createParkDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all public parks with filters',
    description: 'Returns paginated list of public parks. Supports filtering by district, status, and search query.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in code, name, district, or street' })
  @ApiQuery({ name: 'district', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'FAULT_DAMAGED', 'UNDER_MAINTENANCE', 'OPERATIONAL'] })
  async findAll(@Query() queryDto: QueryParksDto) {
    return await this.parksService.findAll(queryDto);
  }

  @Get('subcity/:subcity/with-issues')
  @ApiOperation({ summary: 'Get parks by subcity that have issues' })
  async getParksBySubcityWithIssues(@Param('subcity') subcity: string) {
    return await this.parksService.getParksBySubcityWithIssues(subcity);
  }

  @Get(':code/maintenance-history')
  @ApiOperation({ summary: 'Get maintenance history for a public park by code' })
  async getMaintenanceHistory(@Param('code') code: string) {
    return await this.parksService.getMaintenanceHistory(code);
  }

  @Get(':code')
  @ApiOperation({ 
    summary: 'Get a public park by code',
    description: 'Returns park details with latest issues (5), latest maintenance logs (5), and counts.',
  })
  async findOne(@Param('code') code: string) {
    return await this.parksService.findOne(code);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update a public park (ADMIN only)' })
  async update(@Param('code') code: string, @Body() updateParkDto: UpdateParkDto) {
    return await this.parksService.update(code, updateParkDto);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Delete a public park (ADMIN only)' })
  async remove(@Param('code') code: string) {
    await this.parksService.remove(code);
    return { message: 'Park deleted successfully' };
  }

  @Post(':code/qr')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Generate QR code for a public park (ADMIN only)' })
  async generateQR(@Param('code') code: string) {
    return this.parksService.generateQR(code);
  }
}



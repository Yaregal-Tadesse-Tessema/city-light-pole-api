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
import { PolesService } from './poles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreatePoleDto } from './dto/create-pole.dto';
import { UpdatePoleDto } from './dto/update-pole.dto';
import { QueryPolesDto } from './dto/query-poles.dto';

@ApiTags('Poles')
// @ApiBearerAuth()
@Controller('poles')
// @UseGuards(JwtAuthGuard)
export class PolesController {
  constructor(private readonly polesService: PolesService) {}

  @Post()
  // @Roles(UserRole.ADMIN)
  // @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new light pole (ADMIN only)' })
  async create(@Body() createPoleDto: CreatePoleDto) {
    return this.polesService.create(createPoleDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all light poles with filters',
    description: 'Returns paginated list of light poles. Supports filtering by subcity, status, and search query.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in code, subcity, or street' })
  @ApiQuery({ name: 'subcity', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['OPERATIONAL', 'FAULT_DAMAGED', 'UNDER_MAINTENANCE'] })
  @ApiQuery({ name: 'street', required: false, type: String, description: 'Filter by exact street name' })
  @ApiQuery({ name: 'hasLedDisplay', required: false, type: Boolean, description: 'Filter by LED display presence' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['subcity', 'street'], description: 'Field to sort by' })
  @ApiQuery({ name: 'sortDirection', required: false, enum: ['asc', 'desc'], description: 'Sort direction' })
  async findAll(@Query() queryDto: QueryPolesDto) {
    return await this.polesService.findAll(queryDto);
  }

  @Get('subcity/:subcity/with-issues')
  @ApiOperation({ summary: 'Get poles by subcity that have issues' })
  async getPolesBySubcityWithIssues(@Param('subcity') subcity: string) {
    return await this.polesService.getPolesBySubcityWithIssues(subcity);
  }

  @Get(':code')
  @ApiOperation({ 
    summary: 'Get a light pole by code',
    description: 'Returns pole details with latest issues (5), latest maintenance logs (5), and counts.',
  })
  async findOne(@Param('code') code: string) {
    return await  this.polesService.findOne(code);
  }

  @Patch(':code')
  // @Roles(UserRole.ADMIN)
  // @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update a light pole (ADMIN only)' })
  async update(@Param('code') code: string, @Body() updatePoleDto: UpdatePoleDto) {
    return await this.polesService.update(code, updatePoleDto);
  }

  @Delete(':code')
  // @Roles(UserRole.ADMIN)
  // @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a light pole (ADMIN only)' })
  async remove(@Param('code') code: string) {
    await this.polesService.remove(code);
    return { message: 'Pole deleted successfully' };
  }

  @Post(':code/qr')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Generate QR code for a light pole (ADMIN only)' })
  async generateQR(@Param('code') code: string) {
    return this.polesService.generateQR(code);
  }

  @Get(':code/maintenance-history')
  @ApiOperation({ summary: 'Get maintenance history for a light pole by code' })
  async getMaintenanceHistory(@Param('code') code: string) {
    return await this.polesService.getMaintenanceHistory(code);
  }
}



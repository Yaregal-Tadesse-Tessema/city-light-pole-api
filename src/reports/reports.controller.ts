import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get summary statistics' })
  async getSummary() {
    return await this.reportsService.getSummary();
  }

  @Get('poles-by-type')
  @ApiOperation({ summary: 'Get poles grouped by pole type' })
  @ApiQuery({ name: 'subcity', required: false, type: String, description: 'Limit results to a specific subcity' })
  async getPolesByType(@Query('subcity') subcity?: string) {
    return await this.reportsService.getPolesByType(subcity);
  }

  @Get('faulty-by-district')
  @ApiOperation({ summary: 'Get faulty assets grouped by subcity' })
  @ApiQuery({ name: 'subcity', required: false, type: String, description: 'Filter by specific subcity' })
  @ApiQuery({ name: 'assetType', required: false, type: String, description: 'Asset type: pole, park, parking, museum, toilet, football, river' })
  async getFaultyByDistrict(
    @Query('subcity') subcity?: string,
    @Query('assetType') assetType?: string,
  ) {
    return await this.reportsService.getFaultyByDistrict(subcity, assetType);
  }

  @Get('maintenance-cost')
  @ApiOperation({ summary: 'Get maintenance cost report' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'district', required: false, type: String })
  async getMaintenanceCost(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('district') district?: string,
  ) {
    return await this.reportsService.getMaintenanceCost({ from, to, district });
  }

  @Get('inspection')
  @ApiOperation({ summary: 'Get inspection report' })
  async getInspectionReport() {
    return await this.reportsService.getInspectionReport();
  }

  @Get('maintenance-poles-by-street')
  @ApiOperation({ summary: 'Get maintenance poles grouped by street' })
  async getMaintenancePolesByStreet() {
    return await this.reportsService.getMaintenancePolesByStreet();
  }

  @Get('maintenance-poles-by-subcity')
  @ApiOperation({ summary: 'Get maintenance poles grouped by subcity' })
  async getMaintenancePolesBySubcity() {
    return await this.reportsService.getMaintenancePolesBySubcity();
  }

  @Get('failed-poles-by-street')
  @ApiOperation({ summary: 'Get failed poles grouped by street' })
  async getFailedPolesByStreet() {
    return await this.reportsService.getFailedPolesByStreet();
  }

  @Get('failed-poles-by-subcity')
  @ApiOperation({ summary: 'Get failed poles grouped by subcity' })
  async getFailedPolesBySubcity() {
    return await this.reportsService.getFailedPolesBySubcity();
  }

  @Get('operational-poles-by-street')
  @ApiOperation({ summary: 'Get operational poles grouped by street' })
  async getOperationalPolesByStreet() {
    return await this.reportsService.getOperationalPolesByStreet();
  }

  @Get('operational-poles-by-subcity')
  @ApiOperation({ summary: 'Get operational poles grouped by subcity' })
  async getOperationalPolesBySubcity() {
    return await this.reportsService.getOperationalPolesBySubcity();
  }
}




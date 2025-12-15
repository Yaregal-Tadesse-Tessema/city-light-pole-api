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
    return this.reportsService.getSummary();
  }

  @Get('faulty-by-district')
  @ApiOperation({ summary: 'Get faulty poles grouped by district' })
  async getFaultyByDistrict() {
    return this.reportsService.getFaultyByDistrict();
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
    return this.reportsService.getMaintenanceCost({ from, to, district });
  }

  @Get('inspection')
  @ApiOperation({ summary: 'Get inspection report' })
  async getInspectionReport() {
    return this.reportsService.getInspectionReport();
  }
}



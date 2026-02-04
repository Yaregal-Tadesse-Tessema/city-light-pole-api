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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MaterialRequestService } from './material-request.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMaterialRequestDto } from './dto/create-material-request.dto';
import { ApproveMaterialRequestDto, ReceiveMaterialRequestDto } from './dto/approve-material-request.dto';
import { MaterialRequestStatus } from './entities/material-request.entity';

@ApiTags('Material Requests')
@ApiBearerAuth()
@Controller('material-requests')
@UseGuards(JwtAuthGuard)
export class MaterialRequestController {
  constructor(private readonly materialRequestService: MaterialRequestService) {}

  @Post()
  @ApiOperation({ summary: 'Create a material request for maintenance' })
  async create(@Body() createDto: CreateMaterialRequestDto, @Request() req: any) {
    return this.materialRequestService.create(createDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all material requests' })
  @ApiQuery({ name: 'status', required: false, enum: MaterialRequestStatus })
  @ApiQuery({ name: 'maintenanceScheduleId', required: false, type: String })
  async findAll(
    @Query('status') status?: MaterialRequestStatus,
    @Query('maintenanceScheduleId') maintenanceScheduleId?: string,
  ) {
    return this.materialRequestService.findAll({
      status,
      maintenanceScheduleId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material request by ID' })
  async findOne(@Param('id') id: string) {
    return this.materialRequestService.findOne(id);
  }

  @Get('maintenance/:maintenanceScheduleId')
  @ApiOperation({ summary: 'Get material request for a maintenance schedule' })
  async getByMaintenanceSchedule(@Param('maintenanceScheduleId') maintenanceScheduleId: string) {
    return this.materialRequestService.getByMaintenanceScheduleId(maintenanceScheduleId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve or reject a material request' })
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveMaterialRequestDto,
    @Request() req: any,
  ) {
    return this.materialRequestService.approve(id, approveDto, req.user.userId);
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Mark material request as received/delivered' })
  async receive(
    @Param('id') id: string,
    @Body() receiveDto: ReceiveMaterialRequestDto,
    @Request() req: any,
  ) {
    return this.materialRequestService.receive(id, receiveDto, req.user.userId);
  }

}



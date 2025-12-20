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
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { QueryMaintenanceDto } from './dto/query-maintenance.dto';

@ApiTags('Maintenance')
@ApiBearerAuth()
@Controller('maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post('schedules')
  @ApiOperation({ summary: 'Create a maintenance schedule' })
  async createSchedule(@Body() createScheduleDto: CreateScheduleDto) {
    return this.maintenanceService.createSchedule(createScheduleDto);
  }

  @Get('schedules')
  @ApiOperation({
    summary: 'Get all maintenance schedules with pagination and filters',
    description: 'Returns paginated list of maintenance schedules. Supports filtering by asset type, status, and search query.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 10000)' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by asset type (pole, park, parking, museum, toilet, football, river)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in description or asset code' })
  @ApiQuery({ name: 'status', required: false, enum: ['REQUESTED', 'STARTED', 'PAUSED', 'COMPLETED'], description: 'Filter by status' })
  async findAllSchedules(@Query() queryDto: QueryMaintenanceDto) {
    return this.maintenanceService.findAllSchedules(queryDto);
  }

  @Patch('schedules/:id')
  @ApiOperation({ summary: 'Update a maintenance schedule' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return this.maintenanceService.updateSchedule(id, updateScheduleDto);
  }

  @Delete('schedules/:id')
  @ApiOperation({ summary: 'Delete a maintenance schedule (only REQUESTED status)' })
  async removeSchedule(@Param('id') id: string) {
    await this.maintenanceService.removeSchedule(id);
    return { message: 'Maintenance schedule deleted successfully' };
  }

  @Post('schedules/:id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload attachment to a maintenance schedule' })
  async addAttachment(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|pdf)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.maintenanceService.addAttachment(id, file);
  }
}




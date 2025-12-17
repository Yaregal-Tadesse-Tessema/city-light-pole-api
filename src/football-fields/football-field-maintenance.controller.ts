import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FootballFieldMaintenanceService } from './football-field-maintenance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFootballFieldMaintenanceDto } from './dto/create-football-field-maintenance.dto';
import { UpdateFootballFieldMaintenanceDto } from './dto/update-football-field-maintenance.dto';

@ApiTags('Football Field Maintenance')
@ApiBearerAuth()
@Controller('football-fields/maintenance')
@UseGuards(JwtAuthGuard)
export class FootballFieldMaintenanceController {
  constructor(private readonly service: FootballFieldMaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a football field maintenance schedule' })
  async create(@Body() createDto: CreateFootballFieldMaintenanceDto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all football field maintenance schedules' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a football field maintenance schedule by ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a football field maintenance schedule' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateFootballFieldMaintenanceDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a football field maintenance schedule (only REQUESTED status)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { message: 'Football field maintenance schedule deleted successfully' };
  }

  @Post(':id/attachments')
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
  @ApiOperation({ summary: 'Upload attachment to a football field maintenance schedule' })
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
    return this.service.addAttachment(id, file);
  }
}


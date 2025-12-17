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
import { ParkMaintenanceService } from './park-maintenance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateParkMaintenanceDto } from './dto/create-park-maintenance.dto';
import { UpdateParkMaintenanceDto } from './dto/update-park-maintenance.dto';

@ApiTags('Park Maintenance')
@ApiBearerAuth()
@Controller('parks/maintenance')
@UseGuards(JwtAuthGuard)
export class ParkMaintenanceController {
  constructor(private readonly service: ParkMaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a park maintenance schedule' })
  async create(@Body() createDto: CreateParkMaintenanceDto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all park maintenance schedules' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a park maintenance schedule by ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a park maintenance schedule' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateParkMaintenanceDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a park maintenance schedule (only REQUESTED status)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { message: 'Park maintenance schedule deleted successfully' };
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
  @ApiOperation({ summary: 'Upload attachment to a park maintenance schedule' })
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


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
import { MuseumMaintenanceService } from './museum-maintenance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMuseumMaintenanceDto } from './dto/create-museum-maintenance.dto';
import { UpdateMuseumMaintenanceDto } from './dto/update-museum-maintenance.dto';

@ApiTags('Museum Maintenance')
@ApiBearerAuth()
@Controller('museums/maintenance')
@UseGuards(JwtAuthGuard)
export class MuseumMaintenanceController {
  constructor(private readonly service: MuseumMaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a museum maintenance schedule' })
  async create(@Body() createDto: CreateMuseumMaintenanceDto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all museum maintenance schedules' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a museum maintenance schedule by ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a museum maintenance schedule' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateMuseumMaintenanceDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a museum maintenance schedule (only REQUESTED status)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { message: 'Museum maintenance schedule deleted successfully' };
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
  @ApiOperation({ summary: 'Upload attachment to a museum maintenance schedule' })
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


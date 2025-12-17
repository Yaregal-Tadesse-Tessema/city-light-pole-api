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
import { PublicToiletMaintenanceService } from './public-toilet-maintenance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePublicToiletMaintenanceDto } from './dto/create-public-toilet-maintenance.dto';
import { UpdatePublicToiletMaintenanceDto } from './dto/update-public-toilet-maintenance.dto';

@ApiTags('Public Toilet Maintenance')
@ApiBearerAuth()
@Controller('public-toilets/maintenance')
@UseGuards(JwtAuthGuard)
export class PublicToiletMaintenanceController {
  constructor(private readonly service: PublicToiletMaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a public toilet maintenance schedule' })
  async create(@Body() createDto: CreatePublicToiletMaintenanceDto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all public toilet maintenance schedules' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a public toilet maintenance schedule by ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a public toilet maintenance schedule' })
  async update(@Param('id') id: string, @Body() updateDto: UpdatePublicToiletMaintenanceDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a public toilet maintenance schedule (only REQUESTED status)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { message: 'Public toilet maintenance schedule deleted successfully' };
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
  @ApiOperation({ summary: 'Upload attachment to a public toilet maintenance schedule' })
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


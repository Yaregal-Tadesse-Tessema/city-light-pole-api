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
import { ParkingLotMaintenanceService } from './parking-lot-maintenance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateParkingLotMaintenanceDto } from './dto/create-parking-lot-maintenance.dto';
import { UpdateParkingLotMaintenanceDto } from './dto/update-parking-lot-maintenance.dto';

@ApiTags('Parking Lot Maintenance')
@ApiBearerAuth()
@Controller('parking-lots/maintenance')
@UseGuards(JwtAuthGuard)
export class ParkingLotMaintenanceController {
  constructor(private readonly service: ParkingLotMaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a parking lot maintenance schedule' })
  async create(@Body() createDto: CreateParkingLotMaintenanceDto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all parking lot maintenance schedules' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a parking lot maintenance schedule by ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a parking lot maintenance schedule' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateParkingLotMaintenanceDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a parking lot maintenance schedule (only REQUESTED status)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { message: 'Parking lot maintenance schedule deleted successfully' };
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
  @ApiOperation({ summary: 'Upload attachment to a parking lot maintenance schedule' })
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


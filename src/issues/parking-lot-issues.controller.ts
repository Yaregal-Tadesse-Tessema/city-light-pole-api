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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ParkingLotIssuesService } from './parking-lot-issues.service';
import { CreateParkingLotIssueDto } from './dto/create-parking-lot-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { PoleIssueAttachment } from './entities/pole-issue-attachment.entity';

@ApiTags('Parking Lot Issues')
@ApiBearerAuth()
@Controller('parking-lot-issues')
@UseGuards(JwtAuthGuard)
export class ParkingLotIssuesController {
  constructor(private readonly service: ParkingLotIssuesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new parking lot issue' })
  async create(@Body() dto: CreateParkingLotIssueDto, @CurrentUser() user: any) {
    return await this.service.create(dto, user.userId);
  }
  @Get()
  @ApiOperation({ summary: 'Get all parking lot issues' })
  async findAll() {
    return await this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a parking lot issue by ID' })
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update parking lot issue status' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateIssueStatusDto) {
    return await this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a parking lot issue (only REPORTED status)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { message: 'Parking lot issue deleted successfully' };
  }

  @Post(':id/attachments')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', enum: ['BEFORE', 'AFTER'] },
      },
    },
  })
  @ApiOperation({ summary: 'Upload attachment to a parking lot issue' })
  async addAttachment(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('type') type: string,
  ): Promise<any> {
    return await this.service.addAttachment(id, file, type);
  }
}



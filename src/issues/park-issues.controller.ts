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
import { ParkIssuesService } from './park-issues.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateParkIssueDto } from './dto/create-park-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';

@ApiTags('Park Issues')
@ApiBearerAuth()
@Controller('park-issues')
@UseGuards(JwtAuthGuard)
export class ParkIssuesController {
  constructor(private readonly parkIssuesService: ParkIssuesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new park issue' })
  async create(
    @Body() createIssueDto: CreateParkIssueDto,
    @CurrentUser() user: any,
  ) {
    return this.parkIssuesService.create(createIssueDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all park issues' })
  async findAll() {
    return this.parkIssuesService.findAll();
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a park issue (only REPORTED status)' })
  async remove(@Param('id') id: string) {
    await this.parkIssuesService.remove(id);
    return { message: 'Park issue deleted successfully' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a park issue by ID' })
  async findOne(@Param('id') id: string) {
    return this.parkIssuesService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update park issue status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateIssueStatusDto,
  ) {
    return this.parkIssuesService.updateStatus(id, updateStatusDto);
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
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: ['BEFORE', 'AFTER'],
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload attachment to a park issue' })
  async addAttachment(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('type') type: string,
  ) {
    return this.parkIssuesService.addAttachment(id, file, type);
  }
}



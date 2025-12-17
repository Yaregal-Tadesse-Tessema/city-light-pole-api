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
import { MuseumIssuesService } from './museum-issues.service';
import { CreateMuseumIssueDto } from './dto/create-museum-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';

@ApiTags('Museum Issues')
@ApiBearerAuth()
@Controller('museum-issues')
@UseGuards(JwtAuthGuard)
export class MuseumIssuesController {
  constructor(private readonly service: MuseumIssuesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new museum issue' })
  create(@Body() dto: CreateMuseumIssueDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all museum issues' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a museum issue by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update museum issue status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateIssueStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a museum issue (only REPORTED status)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { message: 'Museum issue deleted successfully' };
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
  @ApiOperation({ summary: 'Upload attachment to a museum issue' })
  addAttachment(
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
  ) {
    return this.service.addAttachment(id, file, type);
  }
}



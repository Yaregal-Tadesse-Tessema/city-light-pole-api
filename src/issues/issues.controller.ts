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
  UploadedFiles,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { QueryIssuesDto } from './dto/query-issues.dto';

@ApiTags('Issues')
@ApiBearerAuth()
@Controller('issues')
@UseGuards(JwtAuthGuard)
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new issue' })
  async create(
    @Body() createIssueDto: CreateIssueDto,
    @CurrentUser() user: any,
  ) {
    return this.issuesService.create(createIssueDto, user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all issues with pagination and filters',
    description: 'Returns paginated list of issues. Supports filtering by status, severity, and search query.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in description or pole code' })
  @ApiQuery({ name: 'status', required: false, enum: ['REPORTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], description: 'Filter by status' })
  @ApiQuery({ name: 'severity', required: false, enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Filter by severity' })
  async findAll(@Query() queryDto: QueryIssuesDto) {
    return this.issuesService.findAll(queryDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete an issue (only REPORTED status)' })
  async remove(@Param('id') id: string) {
    await this.issuesService.remove(id);
    return { message: 'Issue deleted successfully' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an issue by ID' })
  async findOne(@Param('id') id: string) {
    return this.issuesService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update issue status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateIssueStatusDto,
  ) {
    return this.issuesService.updateStatus(id, updateStatusDto);
  }

  @Post(':id/attachments')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        type: {
          type: 'string',
          enum: ['BEFORE', 'AFTER'],
          default: 'AFTER',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload multiple attachments to an issue' })
  async addAttachments(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('type') type: string = 'AFTER',
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    return this.issuesService.addAttachments(id, files, type);
  }

  @Delete(':id/attachments/:attachmentId')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete an attachment from an issue (only if issue is not closed)' })
  async deleteAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.issuesService.deleteAttachment(id, attachmentId);
  }
}




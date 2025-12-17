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
import { IssuesService } from './issues.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';

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
  @ApiOperation({ summary: 'Get all issues' })
  async findAll() {
    return this.issuesService.findAll();
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
  @ApiOperation({ summary: 'Upload attachment to an issue' })
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
    return this.issuesService.addAttachment(id, file, type);
  }
}




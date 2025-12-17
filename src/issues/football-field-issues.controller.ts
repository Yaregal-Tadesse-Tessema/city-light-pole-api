import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { FootballFieldIssuesService } from './football-field-issues.service';
import { CreateFootballFieldIssueDto } from './dto/create-football-field-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';

@ApiTags('Football Field Issues')
@ApiBearerAuth()
@Controller('football-field-issues')
@UseGuards(JwtAuthGuard)
export class FootballFieldIssuesController {
  constructor(private readonly service: FootballFieldIssuesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new football field issue' })
  create(@Body() dto: CreateFootballFieldIssueDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all football field issues' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a football field issue by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update football field issue status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateIssueStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a football field issue (only REPORTED status)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { message: 'Football field issue deleted successfully' };
  }
}



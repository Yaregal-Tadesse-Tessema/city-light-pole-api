import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PublicToiletIssuesService } from './public-toilet-issues.service';
import { CreatePublicToiletIssueDto } from './dto/create-public-toilet-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
@ApiTags('Public Toilet Issues')
@ApiBearerAuth()
@Controller('toilet-issues')
@UseGuards(JwtAuthGuard)
export class PublicToiletIssuesController {
  constructor(private readonly service: PublicToiletIssuesService) {}
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new public toilet issue' })
  create(@Body() dto: CreatePublicToiletIssueDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all public toilet issues' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a public toilet issue by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update public toilet issue status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateIssueStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a public toilet issue (only REPORTED status)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { message: 'Public toilet issue deleted successfully' };
  }
}



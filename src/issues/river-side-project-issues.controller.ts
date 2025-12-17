import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateRiverSideProjectIssueDto } from './dto/create-river-side-project-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { RiverSideProjectIssuesService } from './river-side-project-issues.service';

@ApiTags('River Side Project Issues')
@ApiBearerAuth()
@Controller('river-issues')
@UseGuards(JwtAuthGuard)
export class RiverSideProjectIssuesController {
  constructor(private readonly service: RiverSideProjectIssuesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new river side project issue' })
  create(@Body() dto: CreateRiverSideProjectIssueDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all river side project issues' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a river side project issue by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update river side project issue status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateIssueStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a river side project issue (only REPORTED status)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { message: 'River project issue deleted successfully' };
  }
}



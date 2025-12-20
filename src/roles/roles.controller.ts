import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto, AssignMultipleRolesDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new role' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by ID' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post('assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign a role to a user' })
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.rolesService.assignRole(assignRoleDto);
  }

  @Post('assign-multiple')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign multiple roles to a user' })
  assignMultipleRoles(@Body() assignMultipleRolesDto: AssignMultipleRolesDto) {
    return this.rolesService.assignMultipleRoles(assignMultipleRolesDto);
  }

  @Delete(':userId/:roleId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a role from a user' })
  removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rolesService.removeRole(userId, roleId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get roles for a specific user' })
  getUserRoles(@Param('userId') userId: string) {
    return this.rolesService.getUserRoles(userId);
  }

  @Get(':roleId/users')
  @ApiOperation({ summary: 'Get users assigned to a specific role' })
  getRoleUsers(@Param('roleId') roleId: string) {
    return this.rolesService.getRoleUsers(roleId);
  }
}

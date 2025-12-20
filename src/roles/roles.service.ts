import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role, SystemRole } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new BadRequestException(`Role with name ${createRoleDto.name} already exists`);
    }

    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      where: { isActive: true },
      order: { displayName: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id, isActive: true },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async findByName(name: SystemRole): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name, isActive: true },
    });
  }

  async assignRole(assignRoleDto: AssignRoleDto): Promise<UserRole> {
    // Check if role exists
    await this.findOne(assignRoleDto.roleId);

    // Check if assignment already exists
    const existingAssignment = await this.userRoleRepository.findOne({
      where: {
        userId: assignRoleDto.userId,
        roleId: assignRoleDto.roleId,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException('User already has this role assigned');
    }

    const userRole = this.userRoleRepository.create(assignRoleDto);
    return this.userRoleRepository.save(userRole);
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    const userRole = await this.userRoleRepository.findOne({
      where: { userId, roleId },
    });

    if (!userRole) {
      throw new NotFoundException('Role assignment not found');
    }

    await this.userRoleRepository.remove(userRole);
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId, isActive: true },
      relations: ['role'],
    });

    return userRoles.map(userRole => userRole.role);
  }

  async getRoleUsers(roleId: string): Promise<UserRole[]> {
    return this.userRoleRepository.find({
      where: { roleId, isActive: true },
      relations: ['user'],
    });
  }

  async getUsersByRole(roleName: SystemRole): Promise<UserRole[]> {
    const role = await this.findByName(roleName);
    if (!role) {
      return [];
    }

    return this.userRoleRepository.find({
      where: { roleId: role.id, isActive: true },
      relations: ['user'],
    });
  }

  async assignMultipleRoles(assignMultipleRolesDto: { userId: string; roleIds: string[]; isActive?: boolean }): Promise<UserRole[]> {
    // Validate all roles exist
    for (const roleId of assignMultipleRolesDto.roleIds) {
      await this.findOne(roleId);
    }

    // Check for existing assignments to avoid duplicates
    const existingAssignments = await this.userRoleRepository.find({
      where: {
        userId: assignMultipleRolesDto.userId,
        roleId: In(assignMultipleRolesDto.roleIds),
      },
    });

    const existingRoleIds = existingAssignments.map(assignment => assignment.roleId);
    const newRoleIds = assignMultipleRolesDto.roleIds.filter(roleId => !existingRoleIds.includes(roleId));

    if (newRoleIds.length === 0) {
      throw new BadRequestException('All specified roles are already assigned to this user');
    }

    // Create new assignments
    const userRoles = newRoleIds.map(roleId =>
      this.userRoleRepository.create({
        userId: assignMultipleRolesDto.userId,
        roleId,
        isActive: assignMultipleRolesDto.isActive ?? true,
      })
    );

    return this.userRoleRepository.save(userRoles);
  }
}

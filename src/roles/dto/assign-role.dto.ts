import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ example: 'user-uuid-here' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'role-uuid-here' })
  @IsUUID()
  roleId: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignMultipleRolesDto {
  @ApiProperty({ example: 'user-uuid-here' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: ['role-uuid-1', 'role-uuid-2'], type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  roleIds: string[];

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

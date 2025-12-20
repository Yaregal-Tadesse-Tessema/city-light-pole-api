import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { SystemRole } from '../entities/role.entity';

export class CreateRoleDto {
  @ApiProperty({ enum: SystemRole, example: SystemRole.INVENTORY_MANAGER })
  @IsEnum(SystemRole)
  name: SystemRole;

  @ApiProperty({ example: 'Inventory Manager' })
  @IsString()
  displayName: string;

  @ApiProperty({ required: false, example: 'Manages inventory and stock levels' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

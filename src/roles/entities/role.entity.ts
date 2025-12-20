import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from './user-role.entity';

export enum SystemRole {
  INVENTORY_MANAGER = 'inventory_manager',
  MAINTENANCE_MANAGER = 'maintenance_manager',
  ISSUE_MANAGER = 'issue_manager',
  PURCHASE_MANAGER = 'purchase_manager',
  ADMIN = 'admin',
  OPERATOR = 'operator',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SystemRole,
    unique: true,
  })
  name: SystemRole;

  @Column()
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

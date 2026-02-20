import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSystemAdminRole1767300000000 implements MigrationInterface {
  name = 'AddSystemAdminRole1767300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add SYSTEM_ADMIN to the users_role_enum
    await queryRunner.query(`
      ALTER TYPE "public"."users_role_enum"
      ADD VALUE IF NOT EXISTS 'SYSTEM_ADMIN'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't allow removing enum values once added
    // So we can't remove SYSTEM_ADMIN in down migration
    // The code will handle SYSTEM_ADMIN appropriately
  }
}

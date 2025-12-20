import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMaterialRequestStatusEnum1734740000000 implements MigrationInterface {
  name = 'UpdateMaterialRequestStatusEnum1734740000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, update existing APPROVED records to AWAITING_DELIVERY
    await queryRunner.query(`
      UPDATE material_requests
      SET status = 'AWAITING_DELIVERY'
      WHERE status = 'APPROVED'
    `);

    // Add the new enum values
    await queryRunner.query(`
      ALTER TYPE "public"."material_requests_status_enum"
      ADD VALUE IF NOT EXISTS 'AWAITING_DELIVERY'
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."material_requests_status_enum"
      ADD VALUE IF NOT EXISTS 'DELIVERED'
    `);

    // Note: We can't remove APPROVED from the enum in PostgreSQL once it's been used
    // The code will handle APPROVED status appropriately
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert APPROVED records back
    await queryRunner.query(`
      UPDATE material_requests
      SET status = 'APPROVED'
      WHERE status = 'AWAITING_DELIVERY'
    `);

    // Note: PostgreSQL doesn't allow removing enum values once added
    // So we can't remove AWAITING_DELIVERY and DELIVERED in down migration
  }
}

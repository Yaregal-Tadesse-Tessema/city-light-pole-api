import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePurchaseRequestStatusEnum1766431261719 implements MigrationInterface {
  name = 'UpdatePurchaseRequestStatusEnum1766431261719';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, update existing RECEIVED records to COMPLETED
    await queryRunner.query(`
      UPDATE purchase_requests
      SET status = 'COMPLETED'
      WHERE status = 'RECEIVED'
    `);

    // Add the new READY_TO_DELIVER enum value
    await queryRunner.query(`
      ALTER TYPE "public"."purchase_requests_status_enum"
      ADD VALUE IF NOT EXISTS 'READY_TO_DELIVER'
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."purchase_requests_status_enum"
      ADD VALUE IF NOT EXISTS 'COMPLETED'
    `);

    // Note: We can't remove RECEIVED from the enum in PostgreSQL once it's been used
    // The code will handle RECEIVED status appropriately by treating it as COMPLETED
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert COMPLETED records back to RECEIVED
    await queryRunner.query(`
      UPDATE purchase_requests
      SET status = 'RECEIVED'
      WHERE status = 'COMPLETED'
    `);

    // Note: PostgreSQL doesn't allow removing enum values once added
    // So we can't remove READY_TO_DELIVER and COMPLETED in down migration
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePurchaseRequestStatusEnum1766431261719 implements MigrationInterface {
  name = 'UpdatePurchaseRequestStatusEnum1766431261719';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."purchase_requests_status_enum"
      ADD VALUE IF NOT EXISTS 'COMPLETED'
    `);

    // Compare via text to avoid enum literal errors if RECEIVED is not present.
    await queryRunner.query(`
      UPDATE purchase_requests
      SET status = 'COMPLETED'
      WHERE status::text = 'RECEIVED'
    `);

    // Add the new READY_TO_DELIVER enum value
    await queryRunner.query(`
      ALTER TYPE "public"."purchase_requests_status_enum"
      ADD VALUE IF NOT EXISTS 'READY_TO_DELIVER'
    `);

    // Note: We can't remove RECEIVED from the enum in PostgreSQL once it's been used
    // The code will handle RECEIVED status appropriately by treating it as COMPLETED
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_enum
          WHERE enumlabel = 'RECEIVED'
            AND enumtypid = '"public"."purchase_requests_status_enum"'::regtype
        ) THEN
          UPDATE purchase_requests
          SET status = 'RECEIVED'
          WHERE status::text = 'COMPLETED';
        END IF;
      END
      $$;
    `);

    // Note: PostgreSQL doesn't allow removing enum values once added
    // So we can't remove READY_TO_DELIVER and COMPLETED in down migration
  }
}

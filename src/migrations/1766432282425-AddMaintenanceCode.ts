import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMaintenanceCode1766432282425 implements MigrationInterface {
  name = 'AddMaintenanceCode1766432282425';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the maintenanceCode column as nullable
    await queryRunner.query(`
      ALTER TABLE "maintenance_schedules"
      ADD COLUMN IF NOT EXISTS "maintenanceCode" varchar
    `);

    // Generate unique codes only for records that do not already have one.
    const schedules = await queryRunner.query(`
      SELECT id
      FROM maintenance_schedules
      WHERE "maintenanceCode" IS NULL
      ORDER BY "createdAt" ASC
    `);

    for (let i = 0; i < schedules.length; i++) {
      const code = `MNT-${String(i + 1).padStart(5, '0')}`;
      await queryRunner.query(`
        UPDATE maintenance_schedules
        SET "maintenanceCode" = $1
        WHERE id = $2
      `, [code, schedules[i].id]);
    }

    // Now make it NOT NULL and create unique index
    await queryRunner.query(`
      ALTER TABLE "maintenance_schedules"
      ALTER COLUMN "maintenanceCode" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_maintenance_code" ON "maintenance_schedules" ("maintenanceCode")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_maintenance_code"`);

    // Drop the column
    await queryRunner.query(`ALTER TABLE "maintenance_schedules" DROP COLUMN IF EXISTS "maintenanceCode"`);
  }
}

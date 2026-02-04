import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCodeToMaterialRequest1767100000001 implements MigrationInterface {
  name = 'AddCodeToMaterialRequest1767100000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('material_requests');
    const hasCodeColumn = table?.columns.some((c) => c.name === 'code');

    if (!hasCodeColumn) {
      await queryRunner.query(`
        ALTER TABLE "material_requests"
        ADD COLUMN "code" varchar
      `);
    }

    const maxResult = await queryRunner.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING("code" FROM 4) AS INTEGER)), 0) as max_num
      FROM material_requests WHERE "code" LIKE 'MR-%'
    `);
    let nextNum = parseInt(maxResult?.[0]?.max_num || '0', 10);

    const requests = await queryRunner.query(
      `SELECT id FROM material_requests WHERE "code" IS NULL ORDER BY "createdAt" ASC`,
    );

    for (let i = 0; i < requests.length; i++) {
      nextNum += 1;
      const code = `MR-${String(nextNum).padStart(5, '0')}`;
      await queryRunner.query(
        `
        UPDATE material_requests
        SET "code" = $1
        WHERE id = $2
      `,
        [code, requests[i].id],
      );
    }

    await queryRunner.query(`
      ALTER TABLE "material_requests"
      ALTER COLUMN "code" SET NOT NULL
    `);

    const hasIndex = await queryRunner.query(`
      SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_material_request_code'
    `);
    if (!hasIndex || hasIndex.length === 0) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX "IDX_material_request_code" ON "material_requests" ("code")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_material_request_code"`);

    await queryRunner.query(`
      ALTER TABLE "material_requests" DROP COLUMN "code"
    `);
  }
}

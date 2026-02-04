import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStructureToLightPoles1767100000000 implements MigrationInterface {
  name = 'AddStructureToLightPoles1767100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "structure_enum" AS ENUM('Wood', 'Concrete', 'Steel')
    `);

    await queryRunner.query(`
      ALTER TABLE "light_poles"
      ADD COLUMN "structure" "structure_enum" NOT NULL DEFAULT 'Steel'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "light_poles" DROP COLUMN "structure"
    `);

    await queryRunner.query(`DROP TYPE "structure_enum"`);
  }
}

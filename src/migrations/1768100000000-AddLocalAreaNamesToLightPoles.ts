import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocalAreaNamesToLightPoles1768100000000
  implements MigrationInterface
{
  name = 'AddLocalAreaNamesToLightPoles1768100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "light_poles"
      ADD COLUMN "localAreaName" character varying(120)
    `);

    await queryRunner.query(`
      ALTER TABLE "light_poles"
      ADD COLUMN "localAreaNameAm" character varying(120)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "light_poles" DROP COLUMN "localAreaNameAm"
    `);

    await queryRunner.query(`
      ALTER TABLE "light_poles" DROP COLUMN "localAreaName"
    `);
  }
}

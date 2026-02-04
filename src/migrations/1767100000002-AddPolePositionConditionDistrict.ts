import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPolePositionConditionDistrict1767100000002
  implements MigrationInterface
{
  name = 'AddPolePositionConditionDistrict1767100000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "pole_position_enum" AS ENUM('Up', 'Down', 'Middle')
    `);

    await queryRunner.query(`
      CREATE TYPE "pole_condition_enum" AS ENUM(
        'Not in Place',
        'Good',
        'Bend',
        'Broken Lamp',
        'Both Pole & Lamp Broken'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "district_enum" AS ENUM('west', 'north', 'south', 'east', 'center')
    `);

    await queryRunner.query(`
      ALTER TABLE "light_poles"
      ADD COLUMN "polePosition" "pole_position_enum" NOT NULL DEFAULT 'Up'
    `);

    await queryRunner.query(`
      ALTER TABLE "light_poles"
      ADD COLUMN "condition" "pole_condition_enum" NOT NULL DEFAULT 'Good'
    `);

    await queryRunner.query(`
      ALTER TABLE "light_poles"
      ADD COLUMN "district" "district_enum" NOT NULL DEFAULT 'center'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "light_poles" DROP COLUMN "district"`);
    await queryRunner.query(`ALTER TABLE "light_poles" DROP COLUMN "condition"`);
    await queryRunner.query(`ALTER TABLE "light_poles" DROP COLUMN "polePosition"`);

    await queryRunner.query(`DROP TYPE "district_enum"`);
    await queryRunner.query(`DROP TYPE "pole_condition_enum"`);
    await queryRunner.query(`DROP TYPE "pole_position_enum"`);
  }
}

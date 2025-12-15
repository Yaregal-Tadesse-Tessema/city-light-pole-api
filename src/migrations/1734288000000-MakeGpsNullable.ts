import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeGpsNullable1734288000000 implements MigrationInterface {
  name = 'MakeGpsNullable1734288000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "light_poles" 
      ALTER COLUMN "gpsLat" DROP NOT NULL,
      ALTER COLUMN "gpsLng" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "light_poles" 
      ALTER COLUMN "gpsLat" SET NOT NULL,
      ALTER COLUMN "gpsLng" SET NOT NULL;
    `);
  }
}


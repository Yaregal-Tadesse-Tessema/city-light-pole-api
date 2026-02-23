import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDriverIdentityFieldsToAccidents1768000000000 implements MigrationInterface {
  name = 'AddDriverIdentityFieldsToAccidents1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accidents"
      ADD COLUMN IF NOT EXISTS "driverPhoneNumber" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "accidents"
      ADD COLUMN IF NOT EXISTS "driverLicenseNumber" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "accidents"
      ADD COLUMN IF NOT EXISTS "driverLicenseFileUrl" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "accidents"
      ADD COLUMN IF NOT EXISTS "driverLicenseFileName" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "accidents"
      ADD COLUMN IF NOT EXISTS "driverNationalIdNumber" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accidents" DROP COLUMN IF EXISTS "driverNationalIdNumber"`);
    await queryRunner.query(`ALTER TABLE "accidents" DROP COLUMN IF EXISTS "driverLicenseFileName"`);
    await queryRunner.query(`ALTER TABLE "accidents" DROP COLUMN IF EXISTS "driverLicenseFileUrl"`);
    await queryRunner.query(`ALTER TABLE "accidents" DROP COLUMN IF EXISTS "driverLicenseNumber"`);
    await queryRunner.query(`ALTER TABLE "accidents" DROP COLUMN IF EXISTS "driverPhoneNumber"`);
  }
}


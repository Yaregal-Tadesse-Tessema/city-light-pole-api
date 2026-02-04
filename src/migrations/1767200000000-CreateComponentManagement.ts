import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateComponentManagement1767200000000 implements MigrationInterface {
  name = 'CreateComponentManagement1767200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create component_type enum
    await queryRunner.query(`
      CREATE TYPE "component_type_enum" AS ENUM(
        'CAMERA',
        'LED_DISPLAY',
        'PHONE_CHARGER',
        'LAMP',
        'BULB',
        'ARM_BRACKET',
        'FOUNDATION',
        'CABLE',
        'SENSOR',
        'CONTROLLER',
        'BATTERY',
        'SOLAR_PANEL',
        'WIRING',
        'MOUNTING_HARDWARE',
        'OTHER'
      )
    `);

    // Create component_status enum
    await queryRunner.query(`
      CREATE TYPE "component_status_enum" AS ENUM(
        'INSTALLED',
        'REMOVED',
        'UNDER_MAINTENANCE',
        'DAMAGED',
        'REPLACED'
      )
    `);

    // Create components table
    await queryRunner.query(`
      CREATE TABLE "components" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(200) NOT NULL,
        "type" "component_type_enum" NOT NULL DEFAULT 'OTHER',
        "model" character varying(100),
        "partNumber" character varying(100),
        "sku" character varying(100) UNIQUE,
        "description" text,
        "manufacturerName" character varying(200),
        "manufacturerContact" character varying(200),
        "manufacturerAddress" text,
        "manufacturerCountry" character varying(100),
        "manufacturerWarranty" character varying(200),
        "manufacturerWebsite" character varying(255),
        "serialNumber" character varying(100),
        "barcode" character varying(100) UNIQUE,
        "qrCode" character varying(100) UNIQUE,
        "manufactureDate" date,
        "lifespanMonths" integer,
        "powerUsageWatt" decimal(10,2),
        "voltage" decimal(10,2),
        "current" decimal(10,2),
        "dimensionsLength" decimal(10,2),
        "dimensionsWidth" decimal(10,2),
        "dimensionsHeight" decimal(10,2),
        "weight" decimal(10,2),
        "operatingTempMin" decimal(5,2),
        "operatingTempMax" decimal(5,2),
        "ipRating" character varying(20),
        "certifications" text,
        "compatibilityNotes" text,
        "supplierName" character varying(200),
        "supplierContact" character varying(200),
        "supplierAddress" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "tags" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_components" PRIMARY KEY ("id")
      )
    `);

    // Create indexes on components
    await queryRunner.query(`CREATE INDEX "IDX_components_type" ON "components" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_components_manufacturerName" ON "components" ("manufacturerName")`);
    await queryRunner.query(`CREATE INDEX "IDX_components_manufacturerCountry" ON "components" ("manufacturerCountry")`);
    await queryRunner.query(`CREATE INDEX "IDX_components_isActive" ON "components" ("isActive")`);

    // Create pole_components table
    await queryRunner.query(`
      CREATE TABLE "pole_components" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "poleId" character varying(50) NOT NULL,
        "componentId" uuid NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "installationDate" date NOT NULL,
        "installedById" uuid,
        "status" "component_status_enum" NOT NULL DEFAULT 'INSTALLED',
        "removedDate" date,
        "removedById" uuid,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pole_components" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pole_components_pole" FOREIGN KEY ("poleId") REFERENCES "light_poles"("code") ON DELETE CASCADE,
        CONSTRAINT "FK_pole_components_component" FOREIGN KEY ("componentId") REFERENCES "components"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pole_components_installedBy" FOREIGN KEY ("installedById") REFERENCES "users"("id"),
        CONSTRAINT "FK_pole_components_removedBy" FOREIGN KEY ("removedById") REFERENCES "users"("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_pole_components_poleId" ON "pole_components" ("poleId")`);
    await queryRunner.query(`CREATE INDEX "IDX_pole_components_componentId" ON "pole_components" ("componentId")`);
    await queryRunner.query(`CREATE INDEX "IDX_pole_components_status" ON "pole_components" ("status")`);

    // Remove old component columns from light_poles
    await queryRunner.query(`ALTER TABLE "light_poles" DROP COLUMN IF EXISTS "hasCamera"`);
    await queryRunner.query(`ALTER TABLE "light_poles" DROP COLUMN IF EXISTS "cameraInstallationDate"`);
    await queryRunner.query(`ALTER TABLE "light_poles" DROP COLUMN IF EXISTS "hasLedDisplay"`);
    await queryRunner.query(`ALTER TABLE "light_poles" DROP COLUMN IF EXISTS "ledModel"`);
    await queryRunner.query(`ALTER TABLE "light_poles" DROP COLUMN IF EXISTS "ledInstallationDate"`);
    await queryRunner.query(`ALTER TABLE "light_poles" DROP COLUMN IF EXISTS "ledStatus"`);
    await queryRunner.query(`ALTER TABLE "light_poles" DROP COLUMN IF EXISTS "hasPhoneCharger"`);
    await queryRunner.query(`ALTER TABLE "light_poles" DROP COLUMN IF EXISTS "phoneChargerInstallationDate"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add columns to light_poles (without data)
    await queryRunner.query(`ALTER TABLE "light_poles" ADD COLUMN IF NOT EXISTS "hasCamera" boolean DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "light_poles" ADD COLUMN IF NOT EXISTS "cameraInstallationDate" date`);
    await queryRunner.query(`ALTER TABLE "light_poles" ADD COLUMN IF NOT EXISTS "hasLedDisplay" boolean DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "light_poles" ADD COLUMN IF NOT EXISTS "ledModel" character varying`);
    await queryRunner.query(`ALTER TABLE "light_poles" ADD COLUMN IF NOT EXISTS "ledInstallationDate" date`);
    await queryRunner.query(`ALTER TABLE "light_poles" ADD COLUMN IF NOT EXISTS "ledStatus" character varying`);
    await queryRunner.query(`ALTER TABLE "light_poles" ADD COLUMN IF NOT EXISTS "hasPhoneCharger" boolean DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "light_poles" ADD COLUMN IF NOT EXISTS "phoneChargerInstallationDate" date`);

    // Drop pole_components table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pole_components_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pole_components_componentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pole_components_poleId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pole_components"`);

    // Drop components table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_components_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_components_manufacturerCountry"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_components_manufacturerName"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_components_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "components"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "component_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "component_type_enum"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDamagedComponentsData1767000000001 implements MigrationInterface {
  name = 'FixDamagedComponentsData1767000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, ensure all existing rows have names by updating any null names
    await queryRunner.query(`
      UPDATE "damaged_components"
      SET "name" = CASE
        WHEN "componentType" = 'POLE' THEN 'Light Pole'
        WHEN "componentType" = 'LUMINAIRE' THEN 'Luminaire'
        WHEN "componentType" = 'ARM_BRACKET' THEN 'Arm & Bracket'
        WHEN "componentType" = 'FOUNDATION' THEN 'Foundation'
        WHEN "componentType" = 'CABLE' THEN 'Electrical Cable'
        ELSE 'Unknown Component'
      END
      WHERE "name" IS NULL OR "name" = '';
    `);

    // Set default values for other nullable columns if needed
    await queryRunner.query(`
      UPDATE "damaged_components"
      SET "description" = CASE
        WHEN "componentType" = 'POLE' THEN 'Main support pole for street lighting'
        WHEN "componentType" = 'LUMINAIRE' THEN 'Light fixture and housing'
        WHEN "componentType" = 'ARM_BRACKET' THEN 'Support arm and mounting bracket'
        WHEN "componentType" = 'FOUNDATION' THEN 'Base and foundation structure'
        WHEN "componentType" = 'CABLE' THEN 'Power and control cables'
        ELSE 'Component description'
      END
      WHERE "description" IS NULL;
    `);

    // Ensure all cost columns have values
    await queryRunner.query(`
      UPDATE "damaged_components"
      SET
        "minorCost" = COALESCE("minorCost", 0),
        "moderateCost" = COALESCE("moderateCost", 0),
        "severeCost" = COALESCE("severeCost", 0),
        "totalLossCost" = COALESCE("totalLossCost", 0),
        "isActive" = COALESCE("isActive", true),
        "sortOrder" = COALESCE("sortOrder", 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No down migration needed - this just fixes data consistency
  }
}









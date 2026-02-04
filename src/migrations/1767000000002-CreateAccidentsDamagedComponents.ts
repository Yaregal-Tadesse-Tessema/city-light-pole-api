import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccidentsDamagedComponents1767000000002 implements MigrationInterface {
  name = 'CreateAccidentsDamagedComponents1767000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create accidents_damaged_componets table
    await queryRunner.query(`
      CREATE TABLE "accidents_damaged_componets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "accidentId" uuid NOT NULL,
        "damagedComponentId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_accidents_damaged_componets" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_accidents_damaged_components_accident_id"
      ON "accidents_damaged_componets" ("accidentId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_accidents_damaged_components_component_id"
      ON "accidents_damaged_componets" ("damagedComponentId")
    `);

    // Create unique constraint to prevent duplicate entries
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_accidents_damaged_components_unique"
      ON "accidents_damaged_componets" ("accidentId", "damagedComponentId")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "accidents_damaged_componets"
      ADD CONSTRAINT "FK_accidents_damaged_components_accident"
      FOREIGN KEY ("accidentId") REFERENCES "accidents"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "accidents_damaged_componets"
      ADD CONSTRAINT "FK_accidents_damaged_components_component"
      FOREIGN KEY ("damagedComponentId") REFERENCES "damaged_components"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "accidents_damaged_componets"
      DROP CONSTRAINT "FK_accidents_damaged_components_component"
    `);

    await queryRunner.query(`
      ALTER TABLE "accidents_damaged_componets"
      DROP CONSTRAINT "FK_accidents_damaged_components_accident"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_accidents_damaged_components_unique"`);
    await queryRunner.query(`DROP INDEX "IDX_accidents_damaged_components_component_id"`);
    await queryRunner.query(`DROP INDEX "IDX_accidents_damaged_components_accident_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "accidents_damaged_componets"`);
  }
}

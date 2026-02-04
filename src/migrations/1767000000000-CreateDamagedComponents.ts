import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateDamagedComponents1767000000000 implements MigrationInterface {
  name = 'CreateDamagedComponents1767000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create damaged_components table
    await queryRunner.createTable(
      new Table({
        name: 'damaged_components',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'componentType',
            type: 'enum',
            enum: ['POLE', 'LUMINAIRE', 'ARM_BRACKET', 'FOUNDATION', 'CABLE', 'OTHER'],
            enumName: 'component_type_enum',
            default: "'OTHER'",
            isNullable: false,
          },
          {
            name: 'minorCost',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'moderateCost',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'severeCost',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'totalLossCost',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'sortOrder',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
    );

    // Insert default data
    await queryRunner.query(`
      INSERT INTO "damaged_components" ("id", "name", "description", "componentType", "minorCost", "moderateCost", "severeCost", "totalLossCost", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
      (uuid_generate_v4(), 'Light Pole', 'Main support pole for street lighting', 'POLE', 500.00, 1500.00, 3000.00, 5000.00, true, 1, now(), now()),
      (uuid_generate_v4(), 'Luminaire', 'Light fixture and housing', 'LUMINAIRE', 200.00, 400.00, 600.00, 800.00, true, 2, now(), now()),
      (uuid_generate_v4(), 'Arm & Bracket', 'Support arm and mounting bracket', 'ARM_BRACKET', 150.00, 300.00, 500.00, 700.00, true, 3, now(), now()),
      (uuid_generate_v4(), 'Foundation', 'Base and foundation structure', 'FOUNDATION', 300.00, 600.00, 1000.00, 2000.00, true, 4, now(), now()),
      (uuid_generate_v4(), 'Electrical Cable', 'Power and control cables', 'CABLE', 100.00, 250.00, 500.00, 800.00, true, 5, now(), now());
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('damaged_components', 'IDX_damaged_components_sort_order');
    await queryRunner.dropIndex('damaged_components', 'IDX_damaged_components_is_active');
    await queryRunner.dropIndex('damaged_components', 'IDX_damaged_components_component_type');

    // Drop table
    await queryRunner.dropTable('damaged_components');

    // Drop enum
    await queryRunner.query(`DROP TYPE IF EXISTS "component_type_enum"`);
  }
}

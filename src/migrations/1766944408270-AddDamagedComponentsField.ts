import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDamagedComponentsField1766944408270 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accidents" ADD COLUMN "damagedComponents" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accidents" DROP COLUMN "damagedComponents"`);
    }

}

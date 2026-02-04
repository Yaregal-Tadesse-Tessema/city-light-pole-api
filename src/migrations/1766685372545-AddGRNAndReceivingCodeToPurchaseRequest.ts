import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGRNAndReceivingCodeToPurchaseRequest1766685372545 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "purchase_requests"
            ADD COLUMN "grnCode" character varying,
            ADD COLUMN "receivingCode" character varying
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "purchase_requests"
            DROP COLUMN "grnCode",
            DROP COLUMN "receivingCode"
        `);
    }

}

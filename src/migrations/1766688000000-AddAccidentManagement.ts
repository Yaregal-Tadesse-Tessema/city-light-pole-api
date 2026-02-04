import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccidentManagement1766688000000 implements MigrationInterface {
    name = 'AddAccidentManagement1766688000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create accident_types enum
        await queryRunner.query(`
            CREATE TYPE "accident_type_enum" AS ENUM(
                'VEHICLE_COLLISION',
                'FALLING_POLE',
                'VANDALISM',
                'NATURAL_DISASTER',
                'ELECTRICAL_FAULT',
                'OTHER'
            )
        `);

        // Create damage_level_enum
        await queryRunner.query(`
            CREATE TYPE "damage_level_enum" AS ENUM(
                'MINOR',
                'MODERATE',
                'SEVERE',
                'TOTAL_LOSS'
            )
        `);

        // Create accident_status_enum
        await queryRunner.query(`
            CREATE TYPE "accident_status_enum" AS ENUM(
                'REPORTED',
                'INSPECTED',
                'SUPERVISOR_REVIEW',
                'FINANCE_REVIEW',
                'APPROVED',
                'REJECTED',
                'UNDER_REPAIR',
                'COMPLETED'
            )
        `);

        // Create claim_status_enum
        await queryRunner.query(`
            CREATE TYPE "claim_status_enum" AS ENUM(
                'NOT_SUBMITTED',
                'SUBMITTED',
                'APPROVED',
                'REJECTED',
                'PAID'
            )
        `);

        // Create attachment_type_enum
        await queryRunner.query(`
            CREATE TYPE "attachment_type_enum" AS ENUM(
                'POLICE_REPORT',
                'INSURANCE_CLAIM',
                'OTHER'
            )
        `);

        // Create approval_stage_enum
        await queryRunner.query(`
            CREATE TYPE "approval_stage_enum" AS ENUM(
                'SUPERVISOR_REVIEW',
                'FINANCE_REVIEW'
            )
        `);

        // Create approval_action_enum
        await queryRunner.query(`
            CREATE TYPE "approval_action_enum" AS ENUM(
                'APPROVE',
                'REJECT'
            )
        `);

        // Create accidents table
        await queryRunner.query(`
            CREATE TABLE "accidents" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "incidentId" character varying NOT NULL,
                "accidentType" "accident_type_enum" NOT NULL,
                "accidentDate" TIMESTAMP NOT NULL,
                "accidentTime" TIME NOT NULL,
                "poleId" character varying,
                "latitude" decimal(10,8),
                "longitude" decimal(11,8),
                "locationDescription" character varying,
                "vehiclePlateNumber" character varying,
                "driverName" character varying,
                "insuranceCompany" character varying,
                "claimReferenceNumber" character varying,
                "claimStatus" "claim_status_enum" NOT NULL DEFAULT 'NOT_SUBMITTED',
                "damageLevel" "damage_level_enum",
                "damageDescription" character varying,
                "safetyRisk" boolean NOT NULL DEFAULT false,
                "estimatedCost" decimal(10,2),
                "costBreakdown" json,
                "status" "accident_status_enum" NOT NULL DEFAULT 'REPORTED',
                "reportedById" uuid NOT NULL,
                "inspectedById" uuid,
                "supervisorApprovedById" uuid,
                "financeApprovedById" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_accidents" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_accidents_incidentId" UNIQUE ("incidentId")
            )
        `);

        // Create accident_photos table
        await queryRunner.query(`
            CREATE TABLE "accident_photos" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "filename" character varying NOT NULL,
                "originalName" character varying NOT NULL,
                "mimeType" character varying NOT NULL,
                "size" bigint NOT NULL,
                "path" character varying NOT NULL,
                "description" character varying,
                "isVideo" boolean NOT NULL DEFAULT false,
                "accidentId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_accident_photos" PRIMARY KEY ("id")
            )
        `);

        // Create accident_attachments table
        await queryRunner.query(`
            CREATE TABLE "accident_attachments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "filename" character varying NOT NULL,
                "originalName" character varying NOT NULL,
                "mimeType" character varying NOT NULL,
                "size" bigint NOT NULL,
                "path" character varying NOT NULL,
                "attachmentType" "attachment_type_enum" NOT NULL DEFAULT 'OTHER',
                "description" character varying,
                "accidentId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_accident_attachments" PRIMARY KEY ("id")
            )
        `);

        // Create accident_approvals table
        await queryRunner.query(`
            CREATE TABLE "accident_approvals" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "stage" "approval_stage_enum" NOT NULL,
                "action" "approval_action_enum" NOT NULL,
                "comments" character varying,
                "previousStatus" "accident_status_enum" NOT NULL,
                "newStatus" "accident_status_enum" NOT NULL,
                "accidentId" uuid NOT NULL,
                "approvedById" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_accident_approvals" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "accidents"
            ADD CONSTRAINT "FK_accidents_reportedBy" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "accidents"
            ADD CONSTRAINT "FK_accidents_inspectedBy" FOREIGN KEY ("inspectedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "accidents"
            ADD CONSTRAINT "FK_accidents_supervisorApprovedBy" FOREIGN KEY ("supervisorApprovedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "accidents"
            ADD CONSTRAINT "FK_accidents_financeApprovedBy" FOREIGN KEY ("financeApprovedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "accidents"
            ADD CONSTRAINT "FK_accidents_pole" FOREIGN KEY ("poleId") REFERENCES "light_poles"("code") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "accident_photos"
            ADD CONSTRAINT "FK_accident_photos_accident" FOREIGN KEY ("accidentId") REFERENCES "accidents"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "accident_attachments"
            ADD CONSTRAINT "FK_accident_attachments_accident" FOREIGN KEY ("accidentId") REFERENCES "accidents"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "accident_approvals"
            ADD CONSTRAINT "FK_accident_approvals_accident" FOREIGN KEY ("accidentId") REFERENCES "accidents"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "accident_approvals"
            ADD CONSTRAINT "FK_accident_approvals_approvedBy" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // Create indexes for better performance
        await queryRunner.query(`
            CREATE INDEX "IDX_accidents_incidentId" ON "accidents" ("incidentId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_accidents_status" ON "accidents" ("status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_accidents_poleId" ON "accidents" ("poleId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_accidents_claimStatus" ON "accidents" ("claimStatus")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_accident_photos_accidentId" ON "accident_photos" ("accidentId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_accident_attachments_accidentId" ON "accident_attachments" ("accidentId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_accident_approvals_accidentId" ON "accident_approvals" ("accidentId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_accident_approvals_accidentId"`);
        await queryRunner.query(`DROP INDEX "IDX_accident_attachments_accidentId"`);
        await queryRunner.query(`DROP INDEX "IDX_accident_photos_accidentId"`);
        await queryRunner.query(`DROP INDEX "IDX_accidents_claimStatus"`);
        await queryRunner.query(`DROP INDEX "IDX_accidents_poleId"`);
        await queryRunner.query(`DROP INDEX "IDX_accidents_status"`);
        await queryRunner.query(`DROP INDEX "IDX_accidents_incidentId"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "accident_approvals" DROP CONSTRAINT "FK_accident_approvals_approvedBy"`);
        await queryRunner.query(`ALTER TABLE "accident_approvals" DROP CONSTRAINT "FK_accident_approvals_accident"`);
        await queryRunner.query(`ALTER TABLE "accident_attachments" DROP CONSTRAINT "FK_accident_attachments_accident"`);
        await queryRunner.query(`ALTER TABLE "accident_photos" DROP CONSTRAINT "FK_accident_photos_accident"`);
        await queryRunner.query(`ALTER TABLE "accidents" DROP CONSTRAINT "FK_accidents_financeApprovedBy"`);
        await queryRunner.query(`ALTER TABLE "accidents" DROP CONSTRAINT "FK_accidents_supervisorApprovedBy"`);
        await queryRunner.query(`ALTER TABLE "accidents" DROP CONSTRAINT "FK_accidents_inspectedBy"`);
        await queryRunner.query(`ALTER TABLE "accidents" DROP CONSTRAINT "FK_accidents_reportedBy"`);
        await queryRunner.query(`ALTER TABLE "accidents" DROP CONSTRAINT "FK_accidents_pole"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "accident_approvals"`);
        await queryRunner.query(`DROP TABLE "accident_attachments"`);
        await queryRunner.query(`DROP TABLE "accident_photos"`);
        await queryRunner.query(`DROP TABLE "accidents"`);

        // Drop enums
        await queryRunner.query(`DROP TYPE "approval_action_enum"`);
        await queryRunner.query(`DROP TYPE "approval_stage_enum"`);
        await queryRunner.query(`DROP TYPE "attachment_type_enum"`);
        await queryRunner.query(`DROP TYPE "claim_status_enum"`);
        await queryRunner.query(`DROP TYPE "accident_status_enum"`);
        await queryRunner.query(`DROP TYPE "damage_level_enum"`);
        await queryRunner.query(`DROP TYPE "accident_type_enum"`);
    }

}


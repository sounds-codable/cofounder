import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddComplianceAuditTables1775800000000 implements MigrationInterface {
  name = 'AddComplianceAuditTables1775800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "operation_audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "userEmail" character varying(160),
        "operationType" character varying(120) NOT NULL,
        "requestMethod" character varying(16) NOT NULL,
        "requestPath" character varying(500) NOT NULL,
        "statusCode" integer,
        "success" boolean NOT NULL DEFAULT false,
        "durationMs" integer NOT NULL DEFAULT 0,
        "operationAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "sourceAddress" character varying(120),
        "sourcePort" integer,
        "destinationAddress" character varying(120),
        "destinationPort" integer,
        "clientHardware" character varying(500),
        "clientFingerprint" jsonb,
        "metadata" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_operation_audit_logs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "published_content_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "userEmail" character varying(160),
        "cardId" uuid,
        "cardSlug" character varying(160),
        "operationType" character varying(120) NOT NULL,
        "operationAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "contentSnapshot" jsonb NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_published_content_records_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_operation_audit_logs_operation_at" ON "operation_audit_logs" ("operationAt")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_operation_audit_logs_user_id" ON "operation_audit_logs" ("userId")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_operation_audit_logs_source_address" ON "operation_audit_logs" ("sourceAddress")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_published_content_records_operation_at" ON "published_content_records" ("operationAt")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_published_content_records_user_id" ON "published_content_records" ("userId")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_published_content_records_card_id" ON "published_content_records" ("cardId")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_published_content_records_card_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_published_content_records_user_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_published_content_records_operation_at"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_operation_audit_logs_source_address"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_operation_audit_logs_user_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_operation_audit_logs_operation_at"');

    await queryRunner.query('DROP TABLE IF EXISTS "published_content_records"');
    await queryRunner.query('DROP TABLE IF EXISTS "operation_audit_logs"');
  }
}

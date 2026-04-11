import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandComplianceOperationTypeLength1776300000000 implements MigrationInterface {
  name = 'ExpandComplianceOperationTypeLength1776300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "operation_audit_logs" ALTER COLUMN "operationType" TYPE character varying(255)');
    await queryRunner.query('ALTER TABLE "published_content_records" ALTER COLUMN "operationType" TYPE character varying(255)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "published_content_records" ALTER COLUMN "operationType" TYPE character varying(120)');
    await queryRunner.query('ALTER TABLE "operation_audit_logs" ALTER COLUMN "operationType" TYPE character varying(120)');
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRiskFieldsToPublishedContentRecords1775900000000 implements MigrationInterface {
  name = 'AddRiskFieldsToPublishedContentRecords1775900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "published_content_records" ADD COLUMN IF NOT EXISTS "reviewRequired" boolean NOT NULL DEFAULT false');
    await queryRunner.query('ALTER TABLE "published_content_records" ADD COLUMN IF NOT EXISTS "riskLevel" character varying(16)');
    await queryRunner.query('ALTER TABLE "published_content_records" ADD COLUMN IF NOT EXISTS "riskCategories" jsonb');
    await queryRunner.query('ALTER TABLE "published_content_records" ADD COLUMN IF NOT EXISTS "riskMatchedTerms" jsonb');
    await queryRunner.query('ALTER TABLE "published_content_records" ADD COLUMN IF NOT EXISTS "confirmedToPublish" boolean NOT NULL DEFAULT false');
    await queryRunner.query('ALTER TABLE "published_content_records" ADD COLUMN IF NOT EXISTS "moderationProvider" character varying(80)');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_published_content_records_review_required" ON "published_content_records" ("reviewRequired")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_published_content_records_risk_level" ON "published_content_records" ("riskLevel")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_published_content_records_risk_level"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_published_content_records_review_required"');
    await queryRunner.query('ALTER TABLE "published_content_records" DROP COLUMN IF EXISTS "moderationProvider"');
    await queryRunner.query('ALTER TABLE "published_content_records" DROP COLUMN IF EXISTS "confirmedToPublish"');
    await queryRunner.query('ALTER TABLE "published_content_records" DROP COLUMN IF EXISTS "riskMatchedTerms"');
    await queryRunner.query('ALTER TABLE "published_content_records" DROP COLUMN IF EXISTS "riskCategories"');
    await queryRunner.query('ALTER TABLE "published_content_records" DROP COLUMN IF EXISTS "riskLevel"');
    await queryRunner.query('ALTER TABLE "published_content_records" DROP COLUMN IF EXISTS "reviewRequired"');
  }
}

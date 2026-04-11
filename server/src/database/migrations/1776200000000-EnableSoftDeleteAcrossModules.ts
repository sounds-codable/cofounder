import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableSoftDeleteAcrossModules1776200000000 implements MigrationInterface {
  name = 'EnableSoftDeleteAcrossModules1776200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE');
    await queryRunner.query('ALTER TABLE "blog_comments" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE');
    await queryRunner.query('ALTER TABLE "public_welfare_messages" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE');
    await queryRunner.query('ALTER TABLE "contact_methods" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE');
    await queryRunner.query('ALTER TABLE "card_tags" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE');
    await queryRunner.query('ALTER TABLE "operation_audit_logs" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE');
    await queryRunner.query('ALTER TABLE "published_content_records" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE');

    await queryRunner.query('ALTER TABLE "card_tags" DROP CONSTRAINT IF EXISTS "uq_card_tags_card_tag"');
    await queryRunner.query('DROP INDEX IF EXISTS "uq_card_tags_card_tag"');
    await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "uq_card_tags_card_tag_active" ON "card_tags" ("cardId", "tagId") WHERE "deletedAt" IS NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "uq_card_tags_card_tag_active"');
    await queryRunner.query('ALTER TABLE "card_tags" ADD CONSTRAINT "uq_card_tags_card_tag" UNIQUE ("cardId", "tagId")');

    await queryRunner.query('ALTER TABLE "published_content_records" DROP COLUMN IF EXISTS "deletedAt"');
    await queryRunner.query('ALTER TABLE "operation_audit_logs" DROP COLUMN IF EXISTS "deletedAt"');
    await queryRunner.query('ALTER TABLE "card_tags" DROP COLUMN IF EXISTS "deletedAt"');
    await queryRunner.query('ALTER TABLE "contact_methods" DROP COLUMN IF EXISTS "deletedAt"');
    await queryRunner.query('ALTER TABLE "public_welfare_messages" DROP COLUMN IF EXISTS "deletedAt"');
    await queryRunner.query('ALTER TABLE "blog_comments" DROP COLUMN IF EXISTS "deletedAt"');
    await queryRunner.query('ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "deletedAt"');
  }
}

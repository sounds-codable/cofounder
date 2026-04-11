import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentCommentToBlogComments1776100000000 implements MigrationInterface {
  name = 'AddParentCommentToBlogComments1776100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "blog_comments" ADD COLUMN IF NOT EXISTS "parentCommentId" uuid');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_blog_comments_parent_comment_id" ON "blog_comments" ("parentCommentId")');

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_blog_comments_parent_comment_id'
        ) THEN
          ALTER TABLE "blog_comments"
          ADD CONSTRAINT "FK_blog_comments_parent_comment_id"
          FOREIGN KEY ("parentCommentId") REFERENCES "blog_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "blog_comments" DROP CONSTRAINT IF EXISTS "FK_blog_comments_parent_comment_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_blog_comments_parent_comment_id"');
    await queryRunner.query('ALTER TABLE "blog_comments" DROP COLUMN IF EXISTS "parentCommentId"');
  }
}

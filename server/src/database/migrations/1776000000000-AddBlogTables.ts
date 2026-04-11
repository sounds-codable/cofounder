import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlogTables1776000000000 implements MigrationInterface {
  name = 'AddBlogTables1776000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_posts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(220) NOT NULL,
        "summary" character varying(400) NOT NULL,
        "contentMarkdown" text NOT NULL,
        "authorUserId" uuid NOT NULL,
        "published" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blog_posts_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "postId" uuid NOT NULL,
        "authorUserId" uuid NOT NULL,
        "authorDisplayName" character varying(120) NOT NULL,
        "content" text NOT NULL,
        "status" character varying(16) NOT NULL DEFAULT 'pending',
        "reviewedByUserId" uuid,
        "reviewedAt" TIMESTAMP WITH TIME ZONE,
        "riskCategories" jsonb,
        "riskMatchedTerms" jsonb,
        "riskLevel" character varying(16),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blog_comments_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_likes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "postId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "firstActivatedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blog_likes_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "uniq_blog_likes_post_user" ON "blog_likes" ("postId", "userId")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_blog_posts_updated_at" ON "blog_posts" ("updatedAt" DESC)');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_blog_comments_post_status" ON "blog_comments" ("postId", "status")');

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_blog_comments_post_id'
        ) THEN
          ALTER TABLE "blog_comments"
          ADD CONSTRAINT "FK_blog_comments_post_id"
          FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_blog_likes_post_id'
        ) THEN
          ALTER TABLE "blog_likes"
          ADD CONSTRAINT "FK_blog_likes_post_id"
          FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "blog_likes" DROP CONSTRAINT IF EXISTS "FK_blog_likes_post_id"');
    await queryRunner.query('ALTER TABLE "blog_comments" DROP CONSTRAINT IF EXISTS "FK_blog_comments_post_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_blog_comments_post_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_blog_posts_updated_at"');
    await queryRunner.query('DROP INDEX IF EXISTS "uniq_blog_likes_post_user"');
    await queryRunner.query('DROP TABLE IF EXISTS "blog_likes"');
    await queryRunner.query('DROP TABLE IF EXISTS "blog_comments"');
    await queryRunner.query('DROP TABLE IF EXISTS "blog_posts"');
  }
}

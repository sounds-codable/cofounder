import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResetAndInitSchema1775440000000 implements MigrationInterface {
  name = 'ResetAndInitSchema1775440000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query('DROP TABLE IF EXISTS "card_tags" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "detail_requests" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "contact_methods" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "cards" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "tags" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "public_welfare_messages" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "users" CASCADE');

    await queryRunner.query('DROP TYPE IF EXISTS "detail_requests_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "contact_methods_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "cards_role_enum"');

    await queryRunner.query(`
      CREATE TYPE "cards_role_enum" AS ENUM ('expert', 'developer')
    `);
    await queryRunner.query(`
      CREATE TYPE "contact_methods_type_enum" AS ENUM ('phone', 'wechat', 'qq', 'email', 'other')
    `);
    await queryRunner.query(`
      CREATE TYPE "detail_requests_status_enum" AS ENUM (
        'pending_request',
        'publisher_viewed_detail',
        'approved_detail_visible',
        'contact_exchanged',
        'rejected'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(160),
        "displayName" character varying(120) NOT NULL,
        "detailedProfile" jsonb,
        "detailedProfileCompletedAt" TIMESTAMP WITH TIME ZONE,
        "loginCode" character varying(12),
        "loginCodeExpiresAt" TIMESTAMP WITH TIME ZONE,
        "lastLoginAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "cards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" character varying(160) NOT NULL,
        "role" "cards_role_enum" NOT NULL,
        "headline" character varying(200) NOT NULL,
        "city" character varying(120) NOT NULL,
        "basicSummary" text NOT NULL,
        "optionalDirection" text,
        "strengths" text[] NOT NULL DEFAULT ARRAY[]::text[],
        "detailPreview" jsonb NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "ownerId" uuid,
        CONSTRAINT "PK_0c4eee98ae008e7d4d41f4a31d7" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_95b16f76a3904703f419325f27f" UNIQUE ("slug"),
        CONSTRAINT "FK_9d437f5e0247b0f4fb95b0f75d4" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "contact_methods" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "contact_methods_type_enum" NOT NULL,
        "value" character varying(160) NOT NULL,
        "isPrimary" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "userId" uuid,
        CONSTRAINT "PK_a3f34cf6df6d77dd6f74ee55284" PRIMARY KEY ("id"),
        CONSTRAINT "FK_6ec7f5e8f6382f44095ad8a31b6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "detail_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "status" "detail_requests_status_enum" NOT NULL,
        "rejectionReason" text,
        "publisherViewedRequesterDetailAt" TIMESTAMP WITH TIME ZONE,
        "approvedAt" TIMESTAMP WITH TIME ZONE,
        "contactExchangedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "publisherId" uuid,
        "requesterId" uuid,
        "targetCardId" uuid,
        CONSTRAINT "PK_eb072daf56a607720f8106dc395" PRIMARY KEY ("id"),
        CONSTRAINT "FK_1e545f1124294f6d89d1768dd20" FOREIGN KEY ("publisherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_3fe2f58dd206ce593b8fdb11781" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_a1f90c115bfc4f48fd5f2a47bcf" FOREIGN KEY ("targetCardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(64) NOT NULL,
        "normalizedName" character varying(64) NOT NULL,
        "usageCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_tags_normalized_name_unique" ON "tags" ("normalizedName")
    `);

    await queryRunner.query(`
      CREATE TABLE "card_tags" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "cardId" uuid,
        "tagId" uuid,
        CONSTRAINT "PK_5e5ea2ea716ddf8f614369fd4cd" PRIMARY KEY ("id"),
        CONSTRAINT "uq_card_tags_card_tag" UNIQUE ("cardId", "tagId"),
        CONSTRAINT "FK_82e064cb6f955f91d85cb4fdf73" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_9b3f4b8168dc7b4273ad7d0e385" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query('CREATE INDEX "idx_card_tags_card" ON "card_tags" ("cardId")');
    await queryRunner.query('CREATE INDEX "idx_card_tags_tag" ON "card_tags" ("tagId")');

    await queryRunner.query(`
      CREATE TABLE "public_welfare_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(120),
        "contact" character varying(200) NOT NULL,
        "message" text NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_1b31f7431c3a597f12c237c97e7" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "public_welfare_messages"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_card_tags_tag"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_card_tags_card"');
    await queryRunner.query('DROP TABLE IF EXISTS "card_tags"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_tags_normalized_name_unique"');
    await queryRunner.query('DROP TABLE IF EXISTS "tags"');
    await queryRunner.query('DROP TABLE IF EXISTS "detail_requests"');
    await queryRunner.query('DROP TABLE IF EXISTS "contact_methods"');
    await queryRunner.query('DROP TABLE IF EXISTS "cards"');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');

    await queryRunner.query('DROP TYPE IF EXISTS "detail_requests_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "contact_methods_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "cards_role_enum"');
  }
}

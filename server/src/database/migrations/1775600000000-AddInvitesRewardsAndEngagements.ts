import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvitesRewardsAndEngagements1775600000000 implements MigrationInterface {
  name = 'AddInvitesRewardsAndEngagements1775600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "inviteCode" character varying(20)');
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "invitedByUserId" uuid');
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "invitationAcceptedAt" TIMESTAMP WITH TIME ZONE');
    await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_invite_code_unique" ON "users" ("inviteCode") WHERE "inviteCode" IS NOT NULL');

    await queryRunner.query('DROP TYPE IF EXISTS "reward_transactions_action_enum"');
    await queryRunner.query(`
      CREATE TYPE "reward_transactions_action_enum" AS ENUM (
        'publish_project',
        'register_developer',
        'like_card',
        'favorite_card',
        'match_success',
        'invite_user'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reward_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action" "reward_transactions_action_enum" NOT NULL,
        "points" integer NOT NULL,
        "description" character varying(240) NOT NULL,
        "eventKey" character varying(180) NOT NULL,
        "metadata" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "userId" uuid,
        CONSTRAINT "PK_reward_transactions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reward_transactions_event_key" UNIQUE ("eventKey"),
        CONSTRAINT "FK_reward_transactions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query('DROP TYPE IF EXISTS "card_engagements_type_enum"');
    await queryRunner.query('CREATE TYPE "card_engagements_type_enum" AS ENUM (\'like\', \'favorite\')');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "card_engagements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "card_engagements_type_enum" NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "firstActivatedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "userId" uuid,
        "cardId" uuid,
        CONSTRAINT "PK_card_engagements_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_card_engagements_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_card_engagements_card" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "uq_card_engagement_user_card_type" ON "card_engagements" ("userId", "cardId", "type")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_reward_transactions_user_id" ON "reward_transactions" ("userId")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_card_engagements_user_id" ON "card_engagements" ("userId")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_card_engagements_user_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_reward_transactions_user_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "uq_card_engagement_user_card_type"');
    await queryRunner.query('DROP TABLE IF EXISTS "card_engagements"');
    await queryRunner.query('DROP TYPE IF EXISTS "card_engagements_type_enum"');

    await queryRunner.query('DROP TABLE IF EXISTS "reward_transactions"');
    await queryRunner.query('DROP TYPE IF EXISTS "reward_transactions_action_enum"');

    await queryRunner.query('DROP INDEX IF EXISTS "idx_users_invite_code_unique"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "invitationAcceptedAt"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "invitedByUserId"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "inviteCode"');
  }
}

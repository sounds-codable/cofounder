import { MigrationInterface, QueryRunner } from 'typeorm';

const publicCodeDigits = ['0', '1', '2', '3', '5', '6', '7', '8', '9'] as const;
const publicCodeLength = 5;
const publicCodeBase = publicCodeDigits.length;
const publicCodeCapacity = publicCodeBase ** publicCodeLength - 1;

function formatPublicCodeNumber(sequenceNumber: number) {
  if (!Number.isInteger(sequenceNumber) || sequenceNumber <= 0 || sequenceNumber > publicCodeCapacity) {
    throw new Error(`public code sequence out of range: ${sequenceNumber}`);
  }

  let value = sequenceNumber;
  const chars = Array.from({ length: publicCodeLength }, () => '0');

  for (let position = publicCodeLength - 1; position >= 0; position -= 1) {
    const digitIndex = value % publicCodeBase;
    chars[position] = publicCodeDigits[digitIndex] || '0';
    value = Math.floor(value / publicCodeBase);
  }

  return chars.join('');
}

function buildCardPublicCode(role: 'expert' | 'developer', sequenceNumber: number) {
  return `${role === 'expert' ? 'p' : 'd'}-${formatPublicCodeNumber(sequenceNumber)}`;
}

export class SwitchCardsToPublicCode1776400000000 implements MigrationInterface {
  name = 'SwitchCardsToPublicCode1776400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE SEQUENCE IF NOT EXISTS "cards_public_code_expert_seq" START WITH 1 INCREMENT BY 1');
    await queryRunner.query('CREATE SEQUENCE IF NOT EXISTS "cards_public_code_developer_seq" START WITH 1 INCREMENT BY 1');

    await queryRunner.query('ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "publicCode" character varying(7)');

    const cards = (await queryRunner.query(`
      SELECT "id", "role"
      FROM "cards"
      ORDER BY "createdAt" ASC, "id" ASC
    `)) as Array<{ id: string; role: 'expert' | 'developer' }>;

    let expertCount = 0;
    let developerCount = 0;

    for (const card of cards) {
      if (card.role === 'expert') {
        expertCount += 1;
        await queryRunner.query('UPDATE "cards" SET "publicCode" = $1 WHERE "id" = $2', [buildCardPublicCode('expert', expertCount), card.id]);
        continue;
      }

      developerCount += 1;
      await queryRunner.query('UPDATE "cards" SET "publicCode" = $1 WHERE "id" = $2', [buildCardPublicCode('developer', developerCount), card.id]);
    }

    await queryRunner.query('ALTER TABLE "cards" ALTER COLUMN "publicCode" SET NOT NULL');
    await queryRunner.query('ALTER TABLE "cards" ADD CONSTRAINT "UQ_cards_public_code" UNIQUE ("publicCode")');

    await queryRunner.query('SELECT setval(\'cards_public_code_expert_seq\', $1, true)', [Math.max(expertCount, 1)]);
    await queryRunner.query('SELECT setval(\'cards_public_code_developer_seq\', $1, true)', [Math.max(developerCount, 1)]);

    await queryRunner.query('ALTER TABLE "cards" DROP CONSTRAINT IF EXISTS "UQ_95b16f76a3904703f419325f27f"');
    await queryRunner.query('ALTER TABLE "cards" DROP COLUMN IF EXISTS "slug"');

    await queryRunner.query('ALTER TABLE "published_content_records" RENAME COLUMN "cardSlug" TO "cardPublicCode"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "published_content_records" RENAME COLUMN "cardPublicCode" TO "cardSlug"');

    await queryRunner.query('ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "slug" character varying(160)');
    await queryRunner.query(`
      UPDATE "cards"
      SET "slug" = CONCAT("publicCode", '-', LOWER("role"))
      WHERE "slug" IS NULL
    `);
    await queryRunner.query('ALTER TABLE "cards" ALTER COLUMN "slug" SET NOT NULL');
    await queryRunner.query('ALTER TABLE "cards" ADD CONSTRAINT "UQ_95b16f76a3904703f419325f27f" UNIQUE ("slug")');

    await queryRunner.query('ALTER TABLE "cards" DROP CONSTRAINT IF EXISTS "UQ_cards_public_code"');
    await queryRunner.query('ALTER TABLE "cards" DROP COLUMN IF EXISTS "publicCode"');

    await queryRunner.query('DROP SEQUENCE IF EXISTS "cards_public_code_expert_seq"');
    await queryRunner.query('DROP SEQUENCE IF EXISTS "cards_public_code_developer_seq"');
  }
}

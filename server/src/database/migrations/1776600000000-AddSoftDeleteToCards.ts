import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteToCards1776600000000 implements MigrationInterface {
  name = 'AddSoftDeleteToCards1776600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "cards" DROP COLUMN IF EXISTS "deletedAt"');
  }
}

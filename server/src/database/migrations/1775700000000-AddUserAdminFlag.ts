import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAdminFlag1775700000000 implements MigrationInterface {
  name = 'AddUserAdminFlag1775700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isAdmin" boolean NOT NULL DEFAULT false');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "isAdmin"');
  }
}

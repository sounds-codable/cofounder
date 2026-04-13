import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequesterDetailSnapshotToDetailRequests1776700000000 implements MigrationInterface {
  name = 'AddRequesterDetailSnapshotToDetailRequests1776700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "detail_requests" ADD COLUMN IF NOT EXISTS "requesterDetailSnapshot" jsonb');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "detail_requests" DROP COLUMN IF EXISTS "requesterDetailSnapshot"');
  }
}

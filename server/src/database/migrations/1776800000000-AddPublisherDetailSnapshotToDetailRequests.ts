import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublisherDetailSnapshotToDetailRequests1776800000000 implements MigrationInterface {
  name = 'AddPublisherDetailSnapshotToDetailRequests1776800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "detail_requests" ADD COLUMN IF NOT EXISTS "publisherDetailSnapshot" jsonb');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "detail_requests" DROP COLUMN IF EXISTS "publisherDetailSnapshot"');
  }
}

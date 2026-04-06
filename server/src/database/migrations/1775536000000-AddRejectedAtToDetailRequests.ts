import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRejectedAtToDetailRequests1775536000000 implements MigrationInterface {
  name = 'AddRejectedAtToDetailRequests1775536000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "detail_requests" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP WITH TIME ZONE');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "detail_requests" DROP COLUMN IF EXISTS "rejectedAt"');
  }
}

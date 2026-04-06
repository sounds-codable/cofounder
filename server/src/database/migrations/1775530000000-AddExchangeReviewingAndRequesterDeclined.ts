import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExchangeReviewingAndRequesterDeclined1775530000000 implements MigrationInterface {
  name = 'AddExchangeReviewingAndRequesterDeclined1775530000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum
          WHERE enumlabel = 'requester_declined_contact'
            AND enumtypid = 'detail_requests_status_enum'::regtype
        ) THEN
          ALTER TYPE "detail_requests_status_enum" ADD VALUE 'requester_declined_contact';
        END IF;
      END
      $$;
    `);

    await queryRunner.query('ALTER TABLE "detail_requests" ADD COLUMN IF NOT EXISTS "exchangeReviewingAt" TIMESTAMP WITH TIME ZONE');
    await queryRunner.query('ALTER TABLE "detail_requests" ADD COLUMN IF NOT EXISTS "requesterDeclinedContactAt" TIMESTAMP WITH TIME ZONE');
    await queryRunner.query('ALTER TABLE "detail_requests" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP WITH TIME ZONE');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "detail_requests" DROP COLUMN IF EXISTS "rejectedAt"');
    await queryRunner.query('ALTER TABLE "detail_requests" DROP COLUMN IF EXISTS "requesterDeclinedContactAt"');
    await queryRunner.query('ALTER TABLE "detail_requests" DROP COLUMN IF EXISTS "exchangeReviewingAt"');
  }
}

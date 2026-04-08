import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSeparatedDetailProfileFields1775710000000 implements MigrationInterface {
  name = 'AddSeparatedDetailProfileFields1775710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET "detailedProfile" = jsonb_set(
        jsonb_set(
          COALESCE("detailedProfile", '{}'::jsonb),
          '{expertProjectDetail}',
          to_jsonb(COALESCE("detailedProfile"->>'expertProjectDetail', "detailedProfile"->>'projectDetail', '')),
          true
        ),
        '{developerProjectExperience}',
        to_jsonb(COALESCE("detailedProfile"->>'developerProjectExperience', "detailedProfile"->>'projectDetail', '')),
        true
      )
      WHERE "detailedProfile" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET "detailedProfile" =
        ("detailedProfile" - 'expertProjectDetail') - 'developerProjectExperience'
      WHERE "detailedProfile" IS NOT NULL
    `);
  }
}

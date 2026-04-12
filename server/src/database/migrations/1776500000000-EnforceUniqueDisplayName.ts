import { MigrationInterface, QueryRunner } from 'typeorm';

const displayNameMaxLength = 120;
const preferredSuffixes = ['66', '666', '6666'] as const;

function normalizeDisplayName(value: string | null | undefined) {
  const normalized = (value || '').trim();
  return normalized || '新用户';
}

function buildCandidate(baseDisplayName: string, suffix = '') {
  const base = normalizeDisplayName(baseDisplayName);
  const maxBaseLength = Math.max(displayNameMaxLength - suffix.length, 1);
  return `${base.slice(0, maxBaseLength)}${suffix}`;
}

function* iterateSuffixes() {
  const visited = new Set<string>();

  for (const suffix of preferredSuffixes) {
    visited.add(suffix);
    yield suffix;
  }

  let value = 1;

  while (true) {
    const suffix = String(value);
    value += 1;

    if (suffix.includes('4') || visited.has(suffix)) {
      continue;
    }

    visited.add(suffix);
    yield suffix;
  }
}

function resolveUniqueDisplayName(baseDisplayName: string, usedNames: Set<string>) {
  const directCandidate = buildCandidate(baseDisplayName);
  const directKey = directCandidate.toLowerCase();

  if (!usedNames.has(directKey)) {
    usedNames.add(directKey);
    return directCandidate;
  }

  for (const suffix of iterateSuffixes()) {
    const candidate = buildCandidate(baseDisplayName, suffix);
    const candidateKey = candidate.toLowerCase();

    if (!usedNames.has(candidateKey)) {
      usedNames.add(candidateKey);
      return candidate;
    }
  }

  throw new Error('无法生成唯一昵称');
}

export class EnforceUniqueDisplayName1776500000000 implements MigrationInterface {
  name = 'EnforceUniqueDisplayName1776500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const users = (await queryRunner.query(`
      SELECT "id", "displayName"
      FROM "users"
      ORDER BY "createdAt" ASC, "id" ASC
    `)) as Array<{ id: string; displayName: string | null }>;

    const usedNames = new Set<string>();

    for (const user of users) {
      const nextDisplayName = resolveUniqueDisplayName(normalizeDisplayName(user.displayName), usedNames);

      if (nextDisplayName !== user.displayName) {
        await queryRunner.query('UPDATE "users" SET "displayName" = $1 WHERE "id" = $2', [nextDisplayName, user.id]);
      }
    }

    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_display_name"');
    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_1ff5e919718e7c4adfb1dd6fd3e"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_users_display_name_unique_ci"');
    await queryRunner.query('CREATE UNIQUE INDEX "idx_users_display_name_unique_ci" ON "users" (LOWER("displayName"))');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_users_display_name_unique_ci"');
  }
}

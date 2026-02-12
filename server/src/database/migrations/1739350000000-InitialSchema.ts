import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 初始数据库结构
 * 
 * 创建以下表：
 * - users: 用户表（项目方 + 程序员）
 * - projects: 项目表
 * - requests: 合伙请求表
 * - verification_codes: 邮箱验证码表
 * 
 * 创建以下枚举类型：
 * - users_role_enum: project_owner | developer
 * - users_status_enum: active | inactive
 * - projects_status_enum: open | matched | closed
 * - requests_type_enum: developer_apply | owner_invite
 * - requests_status_enum: pending | accepted | rejected
 */
export class InitialSchema1739350000000 implements MigrationInterface {
  name = 'InitialSchema1739350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建 uuid 扩展
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 创建枚举类型
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_role_enum" AS ENUM ('project_owner', 'developer');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_status_enum" AS ENUM ('active', 'inactive');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "projects_status_enum" AS ENUM ('open', 'matched', 'closed');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "requests_type_enum" AS ENUM ('developer_apply', 'owner_invite');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "requests_status_enum" AS ENUM ('pending', 'accepted', 'rejected');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // ========== users 表 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "role" "users_role_enum" NOT NULL,
        "status" "users_status_enum" NOT NULL DEFAULT 'active',
        -- 基础资料
        "nickname" character varying,
        "avatar" character varying,
        "industry" character varying,
        "industryExperience" integer,
        "techDirections" text,
        "workYears" integer,
        "bio" text,
        "projectExperience" text,
        "basicProfileCompleted" boolean NOT NULL DEFAULT false,
        -- 详细资料
        "realName" character varying,
        "phone" character varying,
        "wechat" character varying,
        "city" character varying,
        "education" character varying,
        "school" character varying,
        "major" character varying,
        "company" character varying,
        "position" character varying,
        "employmentStatus" character varying,
        "workExperienceDesc" text,
        -- 项目方特有
        "industryResources" text,
        "relatedExperience" text,
        "canProvide" text,
        -- 程序员特有
        "techStack" text,
        "github" character varying,
        "detailedProjects" text,
        "interestedIndustries" text,
        "weeklyHours" character varying,
        "detailProfileCompleted" boolean NOT NULL DEFAULT false,
        -- 时间戳
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "lastActiveAt" TIMESTAMP,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // ========== projects 表 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ownerId" uuid NOT NULL,
        "title" character varying NOT NULL,
        "industry" character varying NOT NULL,
        "description" text NOT NULL,
        "targetUsers" text NOT NULL,
        "whySucceed" text NOT NULL,
        "techNeeds" text NOT NULL,
        "techNotes" text,
        "mvpPlan" text NOT NULL,
        "cooperationNotes" text,
        "status" "projects_status_enum" NOT NULL DEFAULT 'open',
        "applicationCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_projects" PRIMARY KEY ("id"),
        CONSTRAINT "FK_projects_owner" FOREIGN KEY ("ownerId") 
          REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // ========== requests 表 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "requests_type_enum" NOT NULL,
        "senderId" uuid NOT NULL,
        "receiverId" uuid NOT NULL,
        "projectId" uuid NOT NULL,
        "message" text,
        "status" "requests_status_enum" NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_requests_sender" FOREIGN KEY ("senderId") 
          REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_requests_receiver" FOREIGN KEY ("receiverId") 
          REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_requests_project" FOREIGN KEY ("projectId") 
          REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // ========== verification_codes 表 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "verification_codes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "code" character varying NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "used" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_verification_codes" PRIMARY KEY ("id")
      )
    `);

    // ========== 索引 ==========
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_role" ON "users" ("role")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_projects_ownerId" ON "projects" ("ownerId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_projects_status" ON "projects" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_projects_industry" ON "projects" ("industry")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_requests_senderId" ON "requests" ("senderId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_requests_receiverId" ON "requests" ("receiverId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_requests_projectId" ON "requests" ("projectId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_requests_status" ON "requests" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_verification_codes_email" ON "verification_codes" ("email")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 按依赖关系反向删除
    await queryRunner.query(`DROP TABLE IF EXISTS "verification_codes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "projects"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // 删除枚举类型
    await queryRunner.query(`DROP TYPE IF EXISTS "requests_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "requests_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "projects_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}


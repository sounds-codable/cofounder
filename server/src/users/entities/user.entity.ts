import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum UserRole {
  PROJECT_OWNER = 'project_owner', // 项目方
  DEVELOPER = 'developer', // 程序员
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  // ========== 基础资料（第1步）==========
  @Column({ nullable: true })
  nickname: string;

  @Column({ nullable: true })
  avatar: string;

  // 项目方字段
  @Column({ nullable: true })
  industry: string; // 所在行业

  @Column({ nullable: true, type: 'int' })
  industryExperience: number; // 行业经验年限

  // 程序员字段
  @Column('simple-array', { nullable: true })
  techDirections: string[]; // 技术方向

  @Column({ nullable: true, type: 'int' })
  workYears: number; // 工作年限

  @Column({ nullable: true, type: 'text' })
  bio: string; // 个人简介

  @Column({ nullable: true, type: 'text' })
  projectExperience: string; // 项目经历简述（程序员）

  @Column({ default: false })
  basicProfileCompleted: boolean; // 基础资料是否完善

  // ========== 详细资料（第2步）==========
  @Column({ nullable: true })
  realName: string; // 真实姓名

  @Column({ nullable: true })
  phone: string; // 手机号

  @Column({ nullable: true })
  wechat: string; // 微信号

  @Column({ nullable: true })
  city: string; // 所在城市

  @Column({ nullable: true })
  education: string; // 最高学历

  @Column({ nullable: true })
  school: string; // 毕业院校

  @Column({ nullable: true })
  major: string; // 专业

  @Column({ nullable: true })
  company: string; // 当前/最近工作单位

  @Column({ nullable: true })
  position: string; // 职位

  @Column({ nullable: true })
  employmentStatus: string; // 在职状态

  @Column({ nullable: true, type: 'text' })
  workExperienceDesc: string; // 工作经历描述

  // 项目方特有字段
  @Column({ nullable: true, type: 'text' })
  industryResources: string; // 行业资源描述

  @Column({ nullable: true, type: 'text' })
  relatedExperience: string; // 相关行业经历

  @Column('simple-array', { nullable: true })
  canProvide: string[]; // 能提供什么

  // 程序员特有字段
  @Column({ nullable: true, type: 'text' })
  techStack: string; // 主要技术栈

  @Column({ nullable: true })
  github: string; // GitHub链接

  @Column({ nullable: true, type: 'text' })
  detailedProjects: string; // 详细项目经历

  @Column('simple-array', { nullable: true })
  interestedIndustries: string[]; // 感兴趣的行业方向

  @Column({ nullable: true })
  weeklyHours: string; // 每周可投入时间

  @Column({ default: false })
  detailProfileCompleted: boolean; // 详细资料是否完善

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastActiveAt: Date; // 最近活跃时间
}


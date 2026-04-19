import { IsBoolean, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class SaveDetailProfileDto {
  @IsString({ message: '个人简介格式不正确' })
  @MinLength(6, { message: '个人简介至少需要 6 个字符' })
  intro!: string;

  @IsString({ message: '教育背景格式不正确' })
  @MinLength(2, { message: '教育背景至少需要 2 个字符' })
  education!: string;

  @IsString({ message: '工作背景格式不正确' })
  @MinLength(6, { message: '工作背景至少需要 6 个字符' })
  experience!: string;

  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null && value !== undefined && value !== '')
  @IsString({ message: '项目详情格式不正确' })
  @MinLength(6, { message: '项目详情至少需要 6 个字符' })
  expertProjectDetail?: string;

  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null && value !== undefined && value !== '')
  @IsString({ message: '做过的项目/产品格式不正确' })
  @MinLength(6, { message: '做过的项目/产品至少需要 6 个字符' })
  developerProjectExperience?: string;

  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null && value !== undefined && value !== '')
  @IsString({ message: '项目详情格式不正确' })
  @MinLength(6, { message: '项目详情至少需要 6 个字符' })
  projectDetail?: string;

  @IsOptional()
  @IsBoolean()
  riskConfirmed?: boolean;

  @IsOptional()
  @IsString({ message: '工作单位格式不正确' })
  company?: string;

  @IsOptional()
  @IsString({ message: '职位格式不正确' })
  position?: string;

  @IsOptional()
  @IsString({ message: '在职状态格式不正确' })
  employmentStatus?: string;

  @IsOptional()
  @IsString({ message: '工作年限格式不正确' })
  workYears?: string;

  @IsOptional()
  @IsString({ message: '工作经历描述格式不正确' })
  workExperienceDesc?: string;

  @IsOptional()
  @IsString({ message: '每周可投入时间格式不正确' })
  weeklyHours?: string;

  @IsOptional()
  @IsString({ message: '技术栈格式不正确' })
  techStack?: string;

  @IsOptional()
  @IsString({ message: 'GitHub 链接格式不正确' })
  github?: string;

  @IsOptional()
  @IsString({ message: '感兴趣的行业方向格式不正确' })
  interestedIndustries?: string;

  @IsOptional()
  @IsString({ message: '能提供的资源格式不正确' })
  canProvide?: string;

  @IsOptional()
  @IsString({ message: '相关行业经历格式不正确' })
  relatedExperience?: string;

  @IsOptional()
  @IsString({ message: '学校格式不正确' })
  school?: string;

  @IsOptional()
  @IsString({ message: '专业格式不正确' })
  major?: string;

  @IsOptional()
  @IsString({ message: '所在城市格式不正确' })
  city?: string;
}

import { IsBoolean, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class SaveDetailProfileDto {
  @IsString({ message: '个人简介格式不正确' })
  @MinLength(6, { message: '个人简介至少需要 6 个字符' })
  intro!: string;

  @IsString({ message: '教育背景格式不正确' })
  @MinLength(4, { message: '教育背景至少需要 4 个字符' })
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
}

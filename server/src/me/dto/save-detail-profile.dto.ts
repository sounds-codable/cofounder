import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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

  @IsString({ message: '项目详情格式不正确' })
  @MinLength(6, { message: '项目详情至少需要 6 个字符' })
  projectDetail!: string;

  @IsOptional()
  @IsString({ message: '电话格式不正确' })
  @MaxLength(160, { message: '电话不能超过 160 个字符' })
  phone?: string;

  @IsOptional()
  @IsString({ message: '微信格式不正确' })
  @MaxLength(160, { message: '微信不能超过 160 个字符' })
  wechat?: string;

  @IsOptional()
  @IsString({ message: 'QQ 格式不正确' })
  @MaxLength(160, { message: 'QQ 不能超过 160 个字符' })
  qq?: string;

  @IsOptional()
  @IsString({ message: '邮箱格式不正确' })
  @MaxLength(160, { message: '邮箱不能超过 160 个字符' })
  email?: string;

  @IsOptional()
  @IsString({ message: '其他联系方式格式不正确' })
  @MaxLength(160, { message: '其他联系方式不能超过 160 个字符' })
  other?: string;
}

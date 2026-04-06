import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveContactMethodsDto {
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

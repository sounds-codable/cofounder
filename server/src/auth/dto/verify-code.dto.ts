import { IsEmail, IsNotEmpty, IsString, Length, IsEnum } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class VerifyCodeDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  @Length(6, 6, { message: '验证码必须是6位数字' })
  code: string;

  @IsEnum(UserRole, { message: '请选择有效的身份类型' })
  @IsNotEmpty({ message: '身份类型不能为空' })
  role: UserRole;
}


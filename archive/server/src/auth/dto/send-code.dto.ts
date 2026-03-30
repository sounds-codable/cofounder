import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class SendCodeDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @IsEnum(UserRole, { message: '请选择有效的身份类型' })
  @IsNotEmpty({ message: '身份类型不能为空' })
  role: UserRole;
}


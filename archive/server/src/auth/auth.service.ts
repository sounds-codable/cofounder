import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { VerificationCode } from './entities/verification-code.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(VerificationCode)
    private verificationCodeRepository: Repository<VerificationCode>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  // 生成6位数字验证码
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 发送验证码
  async sendVerificationCode(dto: SendCodeDto): Promise<{ message: string }> {
    const { email, role } = dto;

    // 检查是否已注册且角色不同
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser && existingUser.role !== role) {
      throw new BadRequestException(
        `该邮箱已注册为${existingUser.role === UserRole.PROJECT_OWNER ? '项目方' : '程序员'}，无法切换身份`,
      );
    }

    // 检查是否在1分钟内已发送过验证码
    const recentCode = await this.verificationCodeRepository.findOne({
      where: {
        email,
        createdAt: MoreThan(new Date(Date.now() - 60 * 1000)),
      },
    });

    if (recentCode) {
      throw new BadRequestException('验证码发送过于频繁，请1分钟后重试');
    }

    // 生成验证码
    const code = this.generateCode();
    const expiresMinutes = this.configService.get<number>('VERIFICATION_CODE_EXPIRES') || 10;
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    // 保存验证码
    const verificationCode = this.verificationCodeRepository.create({
      email,
      code,
      expiresAt,
    });
    await this.verificationCodeRepository.save(verificationCode);

    // 发送邮件
    await this.mailService.sendVerificationCode(email, code);

    return { message: '验证码已发送，请查收邮件' };
  }

  // 验证码登录/注册
  async verifyAndLogin(dto: VerifyCodeDto): Promise<{
    access_token: string;
    user: Partial<User>;
    isNewUser: boolean;
  }> {
    const { email, code, role } = dto;

    // 查找有效的验证码
    const verificationCode = await this.verificationCodeRepository.findOne({
      where: {
        email,
        code,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!verificationCode) {
      throw new UnauthorizedException('验证码无效或已过期');
    }

    // 标记验证码已使用
    verificationCode.used = true;
    await this.verificationCodeRepository.save(verificationCode);

    // 查找或创建用户
    let user = await this.userRepository.findOne({ where: { email } });
    let isNewUser = false;

    if (!user) {
      // 新用户注册
      user = this.userRepository.create({
        email,
        role,
      });
      await this.userRepository.save(user);
      isNewUser = true;
    } else {
      // 检查角色是否匹配
      if (user.role !== role) {
        throw new BadRequestException(
          `该邮箱已注册为${user.role === UserRole.PROJECT_OWNER ? '项目方' : '程序员'}，无法切换身份`,
        );
      }
    }

    // 更新最后活跃时间
    user.lastActiveAt = new Date();
    await this.userRepository.save(user);

    // 生成JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    // 返回用户信息（隐藏敏感字段）
    const { realName, phone, wechat, ...safeUser } = user;

    return {
      access_token,
      user: safeUser,
      isNewUser,
    };
  }

  // 验证JWT Token
  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return user;
  }
}


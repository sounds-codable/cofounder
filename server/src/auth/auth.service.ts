import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomInt } from 'node:crypto';
import { Repository } from 'typeorm';
import { MailService } from './mail.service';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/user.entity';

type AuthTokenPayload = {
  exp: number;
  sub: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async sendLoginCode(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    let user = await this.userRepository.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      user = this.userRepository.create({
        email: normalizedEmail,
        role: UserRole.DEVELOPER,
        displayName: normalizedEmail.split('@')[0] || '新用户',
        city: '待填写',
        basicSummary: '待补充基础信息',
        desiredDirection: null,
        detailedProfile: null,
        detailedProfileCompletedAt: null,
        loginCode: null,
        loginCodeExpiresAt: null,
        lastLoginAt: null,
      });
    }

    const code = String(randomInt(100000, 1000000));
    user.loginCode = code;
    user.loginCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.userRepository.save(user);

    const mailResult = await this.mailService.sendLoginCodeEmail(normalizedEmail, code);
    const isDevelopment = this.configService.get<string>('NODE_ENV', 'development') !== 'production';

    return {
      ok: true,
      expiresInSeconds: 600,
      delivery: mailResult.delivered ? 'smtp' : 'dev',
      message: mailResult.delivered ? '验证码邮件已发送，请留意邮箱。' : '验证码已生成，当前使用开发环境调试模式。',
      devCode: !mailResult.delivered && isDevelopment ? code : undefined,
    };
  }

  async verifyLoginCode(email: string, code: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userRepository.findOne({ where: { email: normalizedEmail } });

    if (!user || !user.loginCode || !user.loginCodeExpiresAt) {
      throw new UnauthorizedException('验证码不存在或已失效');
    }

    if (user.loginCode !== code) {
      throw new UnauthorizedException('验证码错误');
    }

    if (user.loginCodeExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('验证码已过期');
    }

    user.loginCode = null;
    user.loginCodeExpiresAt = null;
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return {
      accessToken: this.signToken({
        sub: user.id,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      }),
      user: this.toAuthUser(user),
    };
  }

  async getRequiredUserFromAuthorizationHeader(authorization?: string | null) {
    const user = await this.getOptionalUserFromAuthorizationHeader(authorization);

    if (!user) {
      throw new UnauthorizedException('请先登录');
    }

    return user;
  }

  async getOptionalUserFromAuthorizationHeader(authorization?: string | null) {
    if (!authorization) {
      return null;
    }

    const token = this.extractBearerToken(authorization);

    if (!token) {
      return null;
    }

    const payload = this.verifyToken(token);
    return this.userRepository.findOne({
      where: { id: payload.sub },
      relations: {
        cards: true,
        contactMethods: true,
      },
    });
  }

  toAuthUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      city: user.city,
      basicSummary: user.basicSummary,
      desiredDirection: user.desiredDirection,
      detailedProfileCompletedAt: user.detailedProfileCompletedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private extractBearerToken(authorization: string) {
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  private signToken(payload: AuthTokenPayload) {
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.createSignature(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  private verifyToken(token: string) {
    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature) {
      throw new UnauthorizedException('登录态无效');
    }

    if (this.createSignature(encodedPayload) !== signature) {
      throw new UnauthorizedException('登录态校验失败');
    }

    let payload: AuthTokenPayload;

    try {
      payload = JSON.parse(this.base64UrlDecode(encodedPayload)) as AuthTokenPayload;
    } catch {
      throw new BadRequestException('登录态解析失败');
    }

    if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('登录态已过期');
    }

    return payload;
  }

  private createSignature(content: string) {
    return createHmac('sha256', this.getAuthSecret()).update(content).digest('base64url');
  }

  private getAuthSecret() {
    return this.configService.get<string>('JWT_SECRET', 'cofounder-dev-secret');
  }

  private base64UrlEncode(value: string) {
    return Buffer.from(value, 'utf8').toString('base64url');
  }

  private base64UrlDecode(value: string) {
    return Buffer.from(value, 'base64url').toString('utf8');
  }
}

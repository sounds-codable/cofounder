import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomInt } from 'node:crypto';
import { Repository } from 'typeorm';
import { RewardService } from '../rewards/reward.service';
import { MailService } from './mail.service';
import { User } from '../users/user.entity';
import { normalizeDisplayName, resolveUniqueDisplayName } from '../users/display-name.util';

type AuthTokenPayload = {
  exp: number;
  sub: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly rewardService: RewardService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async sendLoginCode(email: string, inviteCode?: string) {
    const normalizedEmail = this.normalizeEmail(email);
    let user = await this.userRepository.findOne({ where: { email: normalizedEmail } });
    const normalizedInviteCode = inviteCode?.trim().toUpperCase();
    const requireInviteForSignup = this.configService.get<string>('AUTH_REQUIRE_INVITE_FOR_SIGNUP', 'false') === 'true';

    if (!user) {
      let invitedByUserId: string | null = null;

      if (requireInviteForSignup) {
        if (!normalizedInviteCode) {
          throw new BadRequestException({
            code: 'INVITE_CODE_REQUIRED',
            message: '本站邀请制，请输入邀请码继续使用。',
          });
        }

        const inviter = await this.userRepository.findOne({ where: { inviteCode: normalizedInviteCode } });

        if (!inviter) {
          throw new BadRequestException({
            code: 'INVITE_CODE_INVALID',
            message: '邀请码无效，请检查后重试。',
          });
        }

        invitedByUserId = inviter.id;
      }

      const baseDisplayName = normalizeDisplayName(normalizedEmail.split('@')[0] || '新用户');
      const displayName = await resolveUniqueDisplayName(baseDisplayName, async (candidate) => {
        const existingUser = await this.userRepository
          .createQueryBuilder('user')
          .where('LOWER(user.displayName) = LOWER(:displayName)', { displayName: candidate })
          .getOne();

        return Boolean(existingUser);
      });

      user = this.userRepository.create({
        email: normalizedEmail,
        displayName,
        detailedProfile: null,
        detailedProfileCompletedAt: null,
        loginCode: null,
        loginCodeExpiresAt: null,
        lastLoginAt: null,
        inviteCode: null,
        invitedByUserId,
        invitationAcceptedAt: null,
        isAdmin: false,
      });
    }

    if (!user.invitedByUserId) {
      await this.rewardService.attachInviterByCode(user, normalizedInviteCode);
    }

    const code = String(randomInt(100000, 1000000));
    user.loginCode = code;
    user.loginCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.userRepository.save(user);
    await this.rewardService.finalizeInvitationIfNeeded(user);

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
    await this.rewardService.finalizeInvitationIfNeeded(user);

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
      displayName: user.displayName,
      isAdmin: user.isAdmin,
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

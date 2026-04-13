import { createHmac, randomInt } from 'node:crypto';
import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailService } from './mail.service';
import { RewardService } from '../rewards/reward.service';
import { resolveUniqueDisplayName, sanitizeAccountNameForGeneration } from '../users/display-name.util';
import { User } from '../users/user.entity';

type AuthTokenPayload = {
  exp: number;
  sub: string;
};

type VerifyFailureState = {
  count: number;
  lockedUntil: number;
};

@Injectable()
export class AuthService {
  private readonly sendCodeRecordsByEmail = new Map<string, number[]>();
  private readonly sendCodeRecordsByIp = new Map<string, number[]>();
  private readonly sendCodeLastAtByEmail = new Map<string, number>();
  private readonly verifyFailuresByEmail = new Map<string, VerifyFailureState>();
  private readonly verifyFailuresByIp = new Map<string, VerifyFailureState>();

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly rewardService: RewardService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async sendLoginCode(email: string, inviteCode?: string, clientIp?: string | null) {
    const normalizedEmail = this.normalizeEmail(email);
    const ipKey = this.normalizeClientIp(clientIp);
    this.enforceSendCodeRateLimit(normalizedEmail, ipKey);

    let user = await this.userRepository.findOne({ where: { email: normalizedEmail } });
    const normalizedInviteCode = inviteCode?.trim();
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

        const inviter = await this.rewardService.findInviterByInviteCode(normalizedInviteCode);

        if (!inviter) {
          throw new BadRequestException({
            code: 'INVITE_CODE_INVALID',
            message: '邀请码无效，请检查后重试。',
          });
        }

        invitedByUserId = inviter.id;
      }

      const baseDisplayName = sanitizeAccountNameForGeneration(normalizedEmail.split('@')[0] || 'user', 'user');
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

  async verifyLoginCode(email: string, code: string, clientIp?: string | null) {
    const normalizedEmail = this.normalizeEmail(email);
    const ipKey = this.normalizeClientIp(clientIp);
    this.ensureVerifyNotLocked(normalizedEmail, ipKey);

    const user = await this.userRepository.findOne({ where: { email: normalizedEmail } });

    if (!user || !user.loginCode || !user.loginCodeExpiresAt) {
      this.recordVerifyFailure(normalizedEmail, ipKey);
      throw new UnauthorizedException('验证码不存在或已失效');
    }

    if (user.loginCode !== code) {
      this.recordVerifyFailure(normalizedEmail, ipKey);
      throw new UnauthorizedException('验证码错误');
    }

    if (user.loginCodeExpiresAt.getTime() < Date.now()) {
      this.recordVerifyFailure(normalizedEmail, ipKey);
      throw new UnauthorizedException('验证码已过期');
    }

    user.loginCode = null;
    user.loginCodeExpiresAt = null;
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);
    await this.rewardService.finalizeInvitationIfNeeded(user);
    this.clearVerifyFailure(normalizedEmail, ipKey);

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
    const secret = this.configService.get<string>('JWT_SECRET', '').trim();
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    if (nodeEnv === 'production' && (!secret || secret === 'cofounder-dev-secret' || secret === 'replace_with_a_real_secret')) {
      throw new Error('生产环境必须配置安全的 JWT_SECRET，且不能使用默认值');
    }

    return secret || 'cofounder-dev-secret';
  }

  private normalizeClientIp(clientIp?: string | null) {
    const value = (clientIp || '').trim();

    if (!value) {
      return 'unknown';
    }

    const first = value.split(',')[0]?.trim() || value;
    return first.slice(0, 120).toLowerCase();
  }

  private enforceSendCodeRateLimit(email: string, ipKey: string) {
    const now = Date.now();
    const minIntervalSeconds = this.getPositiveIntegerConfig('AUTH_SEND_CODE_INTERVAL_SECONDS', 60);
    const maxPerHourByEmail = this.getPositiveIntegerConfig('AUTH_SEND_CODE_MAX_PER_EMAIL_PER_HOUR', 8);
    const maxPerHourByIp = this.getPositiveIntegerConfig('AUTH_SEND_CODE_MAX_PER_IP_PER_HOUR', 20);
    const hourStart = now - 60 * 60 * 1000;

    const emailLastAt = this.sendCodeLastAtByEmail.get(email);
    if (emailLastAt && now - emailLastAt < minIntervalSeconds * 1000) {
      throw new HttpException(`请求过于频繁，请在 ${minIntervalSeconds} 秒后再试`, HttpStatus.TOO_MANY_REQUESTS);
    }

    const emailRecords = this.pruneRecords(this.sendCodeRecordsByEmail.get(email), hourStart);
    if (emailRecords.length >= maxPerHourByEmail) {
      throw new HttpException('该邮箱请求验证码次数过多，请 1 小时后再试', HttpStatus.TOO_MANY_REQUESTS);
    }

    const ipRecords = this.pruneRecords(this.sendCodeRecordsByIp.get(ipKey), hourStart);
    if (ipRecords.length >= maxPerHourByIp) {
      throw new HttpException('当前网络请求验证码次数过多，请 1 小时后再试', HttpStatus.TOO_MANY_REQUESTS);
    }

    emailRecords.push(now);
    ipRecords.push(now);
    this.sendCodeRecordsByEmail.set(email, emailRecords);
    this.sendCodeRecordsByIp.set(ipKey, ipRecords);
    this.sendCodeLastAtByEmail.set(email, now);
  }

  private ensureVerifyNotLocked(email: string, ipKey: string) {
    const now = Date.now();
    const emailState = this.verifyFailuresByEmail.get(email);
    const ipState = this.verifyFailuresByIp.get(ipKey);
    const lockUntil = Math.max(emailState?.lockedUntil ?? 0, ipState?.lockedUntil ?? 0);

    if (lockUntil > now) {
      const remainMinutes = Math.max(1, Math.ceil((lockUntil - now) / (60 * 1000)));
      throw new HttpException(`尝试次数过多，请在 ${remainMinutes} 分钟后重试`, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private recordVerifyFailure(email: string, ipKey: string) {
    const maxFailures = this.getPositiveIntegerConfig('AUTH_VERIFY_MAX_FAILURES', 6);
    const lockMinutes = this.getPositiveIntegerConfig('AUTH_VERIFY_LOCK_MINUTES', 30);
    this.updateVerifyFailureState(this.verifyFailuresByEmail, email, maxFailures, lockMinutes);
    this.updateVerifyFailureState(this.verifyFailuresByIp, ipKey, maxFailures, lockMinutes);
  }

  private clearVerifyFailure(email: string, ipKey: string) {
    this.verifyFailuresByEmail.delete(email);
    this.verifyFailuresByIp.delete(ipKey);
  }

  private updateVerifyFailureState(
    target: Map<string, VerifyFailureState>,
    key: string,
    maxFailures: number,
    lockMinutes: number,
  ) {
    const now = Date.now();
    const current = target.get(key);

    if (current && current.lockedUntil > now) {
      return;
    }

    const nextCount = (current?.count ?? 0) + 1;
    if (nextCount >= maxFailures) {
      target.set(key, {
        count: 0,
        lockedUntil: now + lockMinutes * 60 * 1000,
      });
      return;
    }

    target.set(key, {
      count: nextCount,
      lockedUntil: 0,
    });
  }

  private pruneRecords(records: number[] | undefined, threshold: number) {
    if (!records || records.length === 0) {
      return [];
    }

    return records.filter((item) => item >= threshold);
  }

  private getPositiveIntegerConfig(key: string, fallback: number) {
    const raw = this.configService.get<string>(key, String(fallback));
    const value = Number(raw);

    if (!Number.isFinite(value) || value <= 0) {
      return fallback;
    }

    return Math.round(value);
  }

  private base64UrlEncode(value: string) {
    return Buffer.from(value, 'utf8').toString('base64url');
  }

  private base64UrlDecode(value: string) {
    return Buffer.from(value, 'base64url').toString('utf8');
  }
}

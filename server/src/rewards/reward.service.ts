import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardAction } from '../common/enums/reward-action.enum';
import { rewardPointsConfig } from '../config/reward-points.config';
import { Card } from '../platform/card.entity';
import { INVITE_CODE_MAX_LENGTH, normalizeDisplayName, resolveUniqueDisplayName } from '../users/display-name.util';
import { User } from '../users/user.entity';
import { RewardTransaction } from './reward-transaction.entity';

@Injectable()
export class RewardService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(RewardTransaction)
    private readonly rewardTransactionRepository: Repository<RewardTransaction>,
  ) {}

  async ensureInviteCodeForUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return null;
    }

    if (user.inviteCode) {
      return user.inviteCode;
    }

    const inviteCode = await resolveUniqueDisplayName(
      user.displayName,
      async (candidate) => {
        const existing = await this.userRepository
          .createQueryBuilder('user')
          .where('LOWER(user.inviteCode) = LOWER(:inviteCode)', { inviteCode: candidate })
          .getOne();

        return Boolean(existing);
      },
      {
        maxLength: INVITE_CODE_MAX_LENGTH,
        fallbackValue: '邀请用户',
        errorMessage: '无法生成可用邀请码',
      },
    );

    user.inviteCode = inviteCode;
    await this.userRepository.save(user);
    return user.inviteCode;
  }

  async findInviterByInviteCode(rawInviteCode?: string | null, excludedUserId?: string | null) {
    const inviteCode = normalizeDisplayName(rawInviteCode || '');

    if (!inviteCode) {
      return null;
    }

    const query = this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.inviteCode) = LOWER(:inviteCode)', { inviteCode });

    if (excludedUserId) {
      query.andWhere('user.id != :excludedUserId', { excludedUserId });
    }

    return query.getOne();
  }

  async attachInviterByCode(newUser: User, rawInviteCode?: string | null) {
    const inviter = await this.findInviterByInviteCode(rawInviteCode, newUser.id);

    if (!inviter || inviter.id === newUser.id) {
      return;
    }

    newUser.invitedByUserId = inviter.id;
  }

  async finalizeInvitationIfNeeded(user: User) {
    if (!user.invitedByUserId || user.invitationAcceptedAt) {
      return;
    }

    const invitedBy = await this.userRepository.findOne({ where: { id: user.invitedByUserId } });

    user.invitationAcceptedAt = new Date();
    await this.userRepository.save(user);

    await this.awardPoints(user.invitedByUserId, RewardAction.INVITE_USER, `invite-user:${user.invitedByUserId}:${user.id}`, {
      invitedUserId: user.id,
      invitedUserDisplayName: user.displayName,
      inviterDisplayName: invitedBy?.displayName || null,
    });
  }

  async awardPoints(
    userId: string,
    action: RewardAction,
    eventKey: string,
    metadata?: Record<string, unknown>,
    descriptionOverride?: string,
  ) {
    const existing = await this.rewardTransactionRepository.findOne({ where: { eventKey } });

    if (existing) {
      return existing;
    }

    const config = rewardPointsConfig[action];

    if (!config) {
      return null;
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return null;
    }

    const transaction = this.rewardTransactionRepository.create({
      user,
      action,
      points: config.points,
      description: descriptionOverride || config.label,
      eventKey,
      metadata: metadata || null,
    });

    return this.rewardTransactionRepository.save(transaction);
  }

  async getMyPointsOverview(userId: string) {
    const transactions = await this.rewardTransactionRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    const totalPoints = transactions.reduce((sum, item) => sum + item.points, 0);

    return {
      totalPoints,
      rules: (Object.entries(rewardPointsConfig) as Array<[RewardAction, (typeof rewardPointsConfig)[RewardAction]]>).map(([action, config]) => ({
        action,
        points: config.points,
        label: config.label,
      })),
      history: transactions.map((item) => {
        const invitedUserDisplayName = item.action === RewardAction.INVITE_USER ? this.getStringMetadata(item.metadata, 'invitedUserDisplayName') : null;

        return {
          id: item.id,
          action: item.action,
          points: item.points,
          description: invitedUserDisplayName ? `邀请新用户注册：${invitedUserDisplayName}` : item.description,
          relatedUserDisplayName: invitedUserDisplayName,
          createdAt: item.createdAt,
        };
      }),
    };
  }

  async getMyInviteOverview(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const canActivateInviteCode = user
      ? await this.cardRepository.exists({
          where: {
            owner: { id: user.id },
          },
        })
      : false;
    const inviteCode = user && canActivateInviteCode ? await this.ensureInviteCodeForUser(user.id) : null;
    const inviter = user?.invitedByUserId ? await this.userRepository.findOne({ where: { id: user.invitedByUserId } }) : null;
    const invitedUsers = await this.userRepository.find({
      where: { invitedByUserId: userId },
      order: { createdAt: 'DESC' },
    });

    const baseUrl = this.configService.get<string>('CLIENT_BASE_URL', 'http://localhost:3000');
    const inviteLink = inviteCode ? `${baseUrl.replace(/\/$/, '')}/login?invite=${inviteCode}` : null;

    return {
      inviteCode,
      inviteLink,
      invitedBy: inviter
        ? {
            id: inviter.id,
            displayName: inviter.displayName,
          }
        : null,
      activationGuide: '激活邀请码的方式：先添加项目，或先登记程序员信息。完成其中任意一个动作后，会自动生成邀请码。',
      shareText: inviteCode
        ? [
            '最近在用「叩饭 Cofounder」找项目和技术合伙人。',
            '',
            '感觉不错，但现在是邀请制，想体验可以用我的邀请码：',
            `${inviteCode}`,
            '',
            inviteLink,
          ].join('\n')
        : null,
      invitedUsers: invitedUsers.map((item) => ({
        id: item.id,
        displayName: item.displayName,
        registeredAt: item.createdAt,
      })),
    };
  }

  private getStringMetadata(metadata: Record<string, unknown> | null, key: string) {
    if (!metadata) {
      return null;
    }

    const value = metadata[key];

    return typeof value === 'string' ? value : null;
  }
}

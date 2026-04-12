import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, IsNull, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { CardEngagementType } from '../common/enums/card-engagement-type.enum';
import { DetailRequestStatus } from '../common/enums/detail-request-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { ContentModerationService } from '../compliance/content-moderation.service';
import { ComplianceLogService } from '../compliance/compliance-log.service';
import { OperationAuditLog } from '../compliance/operation-audit-log.entity';
import { PublishedContentRecord } from '../compliance/published-content-record.entity';
import { ContactMethod } from '../contacts/contact-method.entity';
import { CardEngagement } from '../platform/card-engagement.entity';
import { Card } from '../platform/card.entity';
import { DetailRequest } from '../platform/detail-request.entity';
import { PublicWelfareMessage } from '../public-welfare/public-welfare-message.entity';
import { RewardTransaction } from '../rewards/reward-transaction.entity';
import { User } from '../users/user.entity';

@Injectable()
export class AdminService {
  constructor(
    private readonly complianceLogService: ComplianceLogService,
    private readonly contentModerationService: ContentModerationService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(DetailRequest)
    private readonly detailRequestRepository: Repository<DetailRequest>,
    @InjectRepository(CardEngagement)
    private readonly cardEngagementRepository: Repository<CardEngagement>,
    @InjectRepository(RewardTransaction)
    private readonly rewardTransactionRepository: Repository<RewardTransaction>,
    @InjectRepository(ContactMethod)
    private readonly contactMethodRepository: Repository<ContactMethod>,
    @InjectRepository(PublishedContentRecord)
    private readonly publishedContentRecordRepository: Repository<PublishedContentRecord>,
    @InjectRepository(OperationAuditLog)
    private readonly operationAuditLogRepository: Repository<OperationAuditLog>,
    @InjectRepository(PublicWelfareMessage)
    private readonly publicWelfareMessageRepository: Repository<PublicWelfareMessage>,
  ) {}

  async getDailyFeed(rawLimit?: string) {
    const limit = this.parseLimit(rawLimit, 20, 5, 100);

    const [riskQueue, recentMessages, recentCards, recentUsers, messageRiskRecords] = await Promise.all([
      this.publishedContentRecordRepository.find({
        where: { reviewRequired: true },
        order: { operationAt: 'DESC' },
        take: limit,
      }),
      this.publicWelfareMessageRepository.find({
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.cardRepository.find({
        relations: { owner: true },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.userRepository.find({
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.publishedContentRecordRepository.find({
        where: { operationType: 'public_welfare_message' },
        order: { operationAt: 'DESC' },
        take: Math.max(limit * 3, 60),
      }),
    ]);

    const riskMap = this.buildPublicWelfareRiskMap(messageRiskRecords);

    return {
      riskQueue: riskQueue.map((item) => ({
        id: item.id,
        operationType: item.operationType,
        operationAt: item.operationAt,
        riskLevel: item.riskLevel,
        categories: item.riskCategories || [],
        matchedTerms: item.riskMatchedTerms || [],
        confirmedToPublish: item.confirmedToPublish,
        userId: item.userId,
        userEmail: item.userEmail,
        contentSnapshot: item.contentSnapshot,
      })),
      recentMessages: recentMessages.map((item) => ({
        id: item.id,
        name: item.name,
        contact: item.contact,
        message: item.message,
        createdAt: item.createdAt,
        risk: riskMap.get(item.id) || null,
      })),
      recentCards: recentCards.map((item) => ({
        id: item.id,
        publicCode: item.publicCode,
        role: item.role,
        headline: item.headline,
        city: item.city,
        ownerId: item.owner.id,
        ownerName: item.owner.displayName,
        ownerEmail: item.owner.email,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      recentUsers: recentUsers.map((item) => ({
        id: item.id,
        displayName: item.displayName,
        email: item.email,
        createdAt: item.createdAt,
        lastLoginAt: item.lastLoginAt,
        isAdmin: item.isAdmin,
      })),
    };
  }

  async getPublicWelfareMessages(rawQuery?: string, rawLimit?: string, rawRiskOnly?: string) {
    const query = rawQuery?.trim() || '';
    const limit = this.parseLimit(rawLimit, 50, 10, 200);
    const riskOnly = rawRiskOnly === 'true';

    const where = query
      ? [
          { name: ILike(`%${query}%`) },
          { contact: ILike(`%${query}%`) },
          { message: ILike(`%${query}%`) },
        ]
      : undefined;

    const messages = await this.publicWelfareMessageRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const messageRiskRecords = await this.publishedContentRecordRepository.find({
      where: { operationType: 'public_welfare_message' },
      order: { operationAt: 'DESC' },
      take: Math.max(messages.length * 4, 120),
    });

    const riskMap = this.buildPublicWelfareRiskMap(messageRiskRecords);
    const items = messages.map((item) => ({
      id: item.id,
      name: item.name,
      contact: item.contact,
      message: item.message,
      createdAt: item.createdAt,
      risk: riskMap.get(item.id) || null,
    }));

    return {
      items: riskOnly ? items.filter((item) => item.risk?.reviewRequired) : items,
    };
  }

  async getPublicWelfareMessageById(messageId: string) {
    const message = await this.publicWelfareMessageRepository.findOne({ where: { id: messageId } });

    if (!message) {
      throw new NotFoundException('留言不存在');
    }

    const messageRiskRecords = await this.publishedContentRecordRepository.find({
      where: { operationType: 'public_welfare_message' },
      order: { operationAt: 'DESC' },
      take: 500,
    });

    const riskMap = this.buildPublicWelfareRiskMap(messageRiskRecords);

    return {
      id: message.id,
      name: message.name,
      contact: message.contact,
      message: message.message,
      createdAt: message.createdAt,
      risk: riskMap.get(message.id) || null,
    };
  }

  async updatePublicWelfareMessage(
    adminUserId: string,
    messageId: string,
    body: { name?: string; contact: string; message: string; riskConfirmed?: boolean },
  ) {
    const message = await this.publicWelfareMessageRepository.findOne({ where: { id: messageId } });

    if (!message) {
      throw new NotFoundException('留言不存在');
    }

    const moderationResult = this.contentModerationService.ensureReviewed({
      operationType: 'public_welfare_message',
      riskConfirmed: body.riskConfirmed,
      fields: [
        { field: 'name', content: body.name },
        { field: 'contact', content: body.contact },
        { field: 'message', content: body.message },
      ],
    });

    message.name = body.name?.trim() || null;
    message.contact = body.contact.trim();
    message.message = body.message.trim();
    const saved = await this.publicWelfareMessageRepository.save(message);

    await this.complianceLogService.recordPublishedContent({
      userId: adminUserId,
      operationType: 'public_welfare_message',
      riskReview: {
        reviewRequired: moderationResult.hasRisk,
        riskLevel: moderationResult.riskLevel,
        categories: moderationResult.categories,
        matchedTerms: moderationResult.matchedTerms,
        confirmedToPublish: Boolean(body.riskConfirmed),
        provider: moderationResult.provider,
      },
      contentSnapshot: {
        messageId: saved.id,
        name: saved.name,
        contact: saved.contact,
        message: saved.message,
        adminEdited: true,
      },
    });

    return {
      id: saved.id,
      name: saved.name,
      contact: saved.contact,
      message: saved.message,
      createdAt: saved.createdAt,
    };
  }

  async deletePublicWelfareMessage(adminUserId: string, messageId: string) {
    const message = await this.publicWelfareMessageRepository.findOne({ where: { id: messageId } });

    if (!message) {
      throw new NotFoundException('留言不存在');
    }

    await this.publicWelfareMessageRepository.softDelete({ id: messageId });

    await this.complianceLogService.recordPublishedContent({
      userId: adminUserId,
      operationType: 'public_welfare_message_delete',
      contentSnapshot: {
        messageId: message.id,
        name: message.name,
        contact: message.contact,
        message: message.message,
      },
    });

    return { ok: true };
  }

  async getComplianceLogs(rawLimit?: string) {
    const parsedLimit = Number(rawLimit || 50);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(Math.floor(parsedLimit), 10), 200) : 50;

    const [operationLogs, publishedRecords] = await Promise.all([
      this.operationAuditLogRepository.find({
        order: { operationAt: 'DESC' },
        take: limit,
      }),
      this.publishedContentRecordRepository.find({
        order: { operationAt: 'DESC' },
        take: limit,
      }),
    ]);

    return {
      operationLogs: operationLogs.map((item) => ({
        id: item.id,
        userId: item.userId,
        userEmail: item.userEmail,
        operationType: item.operationType,
        requestMethod: item.requestMethod,
        requestPath: item.requestPath,
        statusCode: item.statusCode,
        success: item.success,
        durationMs: item.durationMs,
        operationAt: item.operationAt,
        sourceAddress: item.sourceAddress,
        sourcePort: item.sourcePort,
        destinationAddress: item.destinationAddress,
        destinationPort: item.destinationPort,
        clientHardware: item.clientHardware,
      })),
      publishedRecords: publishedRecords.map((item) => ({
        id: item.id,
        userId: item.userId,
        userEmail: item.userEmail,
        cardId: item.cardId,
        cardPublicCode: item.cardPublicCode,
        operationType: item.operationType,
        reviewRequired: item.reviewRequired,
        riskLevel: item.riskLevel,
        riskCategories: item.riskCategories || [],
        riskMatchedTerms: item.riskMatchedTerms || [],
        confirmedToPublish: item.confirmedToPublish,
        moderationProvider: item.moderationProvider,
        operationAt: item.operationAt,
        contentSnapshot: item.contentSnapshot,
      })),
    };
  }

  async getOverview() {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [
      totalUsers,
      totalCards,
      totalProjects,
      totalDevelopers,
      matchingInProgress,
      matchingSuccess,
      matchingFailed,
      usersWithDetailedProfile,
      activeUsersLast7Days,
      totalRewardTransactions,
      allContacts,
      riskQueue,
    ] = await Promise.all([
      this.userRepository.count(),
      this.cardRepository.count(),
      this.cardRepository.count({ where: { role: UserRole.EXPERT } }),
      this.cardRepository.count({ where: { role: UserRole.DEVELOPER } }),
      this.detailRequestRepository.count({
        where: {
          status: In([
            DetailRequestStatus.PENDING_REQUEST,
            DetailRequestStatus.PUBLISHER_VIEWED_DETAIL,
            DetailRequestStatus.APPROVED_DETAIL_VISIBLE,
          ]),
        },
      }),
      this.detailRequestRepository.count({ where: { status: DetailRequestStatus.CONTACT_EXCHANGED } }),
      this.detailRequestRepository.count({
        where: {
          status: In([DetailRequestStatus.REJECTED, DetailRequestStatus.REQUESTER_DECLINED_CONTACT]),
        },
      }),
      this.userRepository.count({ where: { detailedProfileCompletedAt: Not(IsNull()) } }),
      this.userRepository.count({ where: { lastLoginAt: MoreThanOrEqual(since) } }),
      this.rewardTransactionRepository.count(),
      this.contactMethodRepository.find({ relations: { user: true } }),
      this.publishedContentRecordRepository.find({
        where: { reviewRequired: true },
        order: { operationAt: 'DESC' },
        take: 100,
      }),
    ]);

    const usersWithContacts = new Set(allContacts.map((item) => item.user.id)).size;

    const [invitedLeaders, projectLeaders, participationLeaders] = await Promise.all([
      this.getInvitedLeaders(),
      this.getProjectLeaders(),
      this.getParticipationLeaders(),
    ]);

    return {
      summary: {
        totalUsers,
        totalCards,
        totalProjects,
        totalDevelopers,
        matchingInProgress,
        matchingSuccess,
        matchingFailed,
        usersWithDetailedProfile,
        usersWithContacts,
        activeUsersLast7Days,
        totalRewardTransactions,
      },
      leaders: {
        invitedLeaders,
        projectLeaders,
        participationLeaders,
      },
      riskQueue: riskQueue.map((item) => ({
        id: item.id,
        userId: item.userId,
        userEmail: item.userEmail,
        cardId: item.cardId,
        cardPublicCode: item.cardPublicCode,
        operationType: item.operationType,
        operationAt: item.operationAt,
        riskLevel: item.riskLevel,
        categories: item.riskCategories || [],
        matchedTerms: item.riskMatchedTerms || [],
        confirmedToPublish: item.confirmedToPublish,
        contentSnapshot: item.contentSnapshot,
      })),
      adminNotes: [
        '可在数据库 users 表直接修改 isAdmin 字段（true/false）控制后台权限。',
        '匹配中 = pending_request / publisher_viewed_detail / approved_detail_visible。',
        '匹配失败 = rejected / requester_declined_contact。',
        '风险内容队列会优先展示包含违法有害风险词的发布记录。',
      ],
    };
  }

  async searchUsers(rawQuery?: string, rawLimit?: string) {
    const query = rawQuery?.trim() || '';
    const limitNumber = Number(rawLimit || 20);
    const limit = Number.isFinite(limitNumber) ? Math.min(Math.max(Math.floor(limitNumber), 1), 100) : 20;

    const userQuery = this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .take(limit);

    if (query) {
      userQuery.where('user.displayName ILIKE :query OR user.email ILIKE :query', { query: `%${query}%` });
    }

    const users = await userQuery.getMany();
    const userIds = users.map((user) => user.id);

    if (userIds.length === 0) {
      return { items: [] };
    }

    const [cards, invitedUsers, rewardTransactions, relatedRequests, engagements] = await Promise.all([
      this.cardRepository.find({
        where: {
          owner: {
            id: In(userIds),
          },
        },
        relations: { owner: true },
      }),
      this.userRepository.find({
        where: {
          invitedByUserId: In(userIds),
        },
      }),
      this.rewardTransactionRepository.find({
        where: {
          user: {
            id: In(userIds),
          },
        },
        relations: { user: true },
      }),
      this.detailRequestRepository.find({
        where: [{ requester: { id: In(userIds) } }, { publisher: { id: In(userIds) } }],
        relations: {
          requester: true,
          publisher: true,
        },
      }),
      this.cardEngagementRepository.find({
        where: {
          user: {
            id: In(userIds),
          },
          active: true,
        },
        relations: { user: true },
      }),
    ]);

    const cardsMap = this.countByUserId(cards.map((item) => item.owner.id));
    const invitedMap = this.countByUserId(invitedUsers.map((item) => item.invitedByUserId).filter((id): id is string => Boolean(id)));
    const pointsMap = this.sumPointsByUserId(rewardTransactions.map((item) => ({ userId: item.user.id, points: item.points })));

    const requestsMap = this.countByUserId([
      ...relatedRequests.map((item) => item.requester.id),
      ...relatedRequests.map((item) => item.publisher.id),
    ]);

    const likesMap = this.countByUserId(
      engagements.filter((item) => item.type === CardEngagementType.LIKE).map((item) => item.user.id),
    );

    const favoritesMap = this.countByUserId(
      engagements.filter((item) => item.type === CardEngagementType.FAVORITE).map((item) => item.user.id),
    );

    return {
      items: users.map((user) => ({
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        hasDetailedProfile: Boolean(user.detailedProfileCompletedAt),
        cardsCount: cardsMap[user.id] || 0,
        invitedUsersCount: invitedMap[user.id] || 0,
        points: pointsMap[user.id] || 0,
        requestParticipationCount: requestsMap[user.id] || 0,
        likesCount: likesMap[user.id] || 0,
        favoritesCount: favoritesMap[user.id] || 0,
      })),
    };
  }

  async getUserDetail(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        cards: true,
        contactMethods: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const [inviter, invitedUsers, engagements, rewardTransactions, relatedRequests] = await Promise.all([
      user.invitedByUserId ? this.userRepository.findOne({ where: { id: user.invitedByUserId } }) : Promise.resolve(null),
      this.userRepository.find({ where: { invitedByUserId: userId }, order: { createdAt: 'DESC' } }),
      this.cardEngagementRepository.find({
        where: {
          user: { id: userId },
          active: true,
        },
        relations: {
          card: true,
        },
        order: { updatedAt: 'DESC' },
      }),
      this.rewardTransactionRepository.find({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' },
        take: 100,
      }),
      this.detailRequestRepository.find({
        where: [{ publisher: { id: userId } }, { requester: { id: userId } }],
        relations: {
          requester: true,
          publisher: true,
          targetCard: { owner: true },
        },
        order: { createdAt: 'DESC' },
        take: 200,
      }),
    ]);

    const requestStatusCount: Record<string, number> = {};

    relatedRequests.forEach((request) => {
      requestStatusCount[request.status] = (requestStatusCount[request.status] || 0) + 1;
    });

    const totalPoints = rewardTransactions.reduce((sum, transaction) => sum + transaction.points, 0);

    const likes = engagements.filter((item) => item.type === CardEngagementType.LIKE);
    const favorites = engagements.filter((item) => item.type === CardEngagementType.FAVORITE);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        inviteCode: user.inviteCode,
        invitedByUserId: user.invitedByUserId,
        invitationAcceptedAt: user.invitationAcceptedAt,
        detailedProfileCompletedAt: user.detailedProfileCompletedAt,
        detailedProfile: user.detailedProfile,
        contactMethods: user.contactMethods,
      },
      cards: user.cards.map((card) => ({
        id: card.id,
        publicCode: card.publicCode,
        role: card.role,
        headline: card.headline,
        city: card.city,
        basicSummary: card.basicSummary,
        strengths: card.strengths,
        updatedAt: card.updatedAt,
        link: `/${card.publicCode}`,
      })),
      invitation: {
        inviter: inviter
          ? {
              id: inviter.id,
              displayName: inviter.displayName,
              email: inviter.email,
            }
          : null,
        invitedUsersCount: invitedUsers.length,
        invitedUsers: invitedUsers.slice(0, 50).map((item) => ({
          id: item.id,
          displayName: item.displayName,
          email: item.email,
          createdAt: item.createdAt,
        })),
      },
      engagements: {
        likesCount: likes.length,
        favoritesCount: favorites.length,
        likes: likes.slice(0, 50).map((item) => ({
          id: item.id,
          cardId: item.card.id,
          cardPublicCode: item.card.publicCode,
          cardHeadline: item.card.headline,
          link: `/${item.card.publicCode}`,
          firstActivatedAt: item.firstActivatedAt,
          updatedAt: item.updatedAt,
        })),
        favorites: favorites.slice(0, 50).map((item) => ({
          id: item.id,
          cardId: item.card.id,
          cardPublicCode: item.card.publicCode,
          cardHeadline: item.card.headline,
          link: `/${item.card.publicCode}`,
          firstActivatedAt: item.firstActivatedAt,
          updatedAt: item.updatedAt,
        })),
      },
      requests: {
        total: relatedRequests.length,
        statusCount: requestStatusCount,
        items: relatedRequests.map((request) => ({
          id: request.id,
          status: request.status,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          targetCard: {
            id: request.targetCard.id,
            publicCode: request.targetCard.publicCode,
            headline: request.targetCard.headline,
            link: `/${request.targetCard.publicCode}`,
          },
          publisher: {
            id: request.publisher.id,
            displayName: request.publisher.displayName,
            email: request.publisher.email,
          },
          requester: {
            id: request.requester.id,
            displayName: request.requester.displayName,
            email: request.requester.email,
          },
        })),
      },
      rewards: {
        totalPoints,
        transactionCount: rewardTransactions.length,
        recentTransactions: rewardTransactions.map((item) => ({
          id: item.id,
          action: item.action,
          points: item.points,
          description: item.description,
          createdAt: item.createdAt,
          metadata: item.metadata,
        })),
      },
      adminHints: {
        updateAdminSql: `UPDATE users SET "isAdmin" = true WHERE id = '${user.id}';`,
      },
    };
  }

  private async getInvitedLeaders(limit = 5) {
    const invitedUsers = await this.userRepository.find({
      where: {
        invitedByUserId: Not(IsNull()),
      },
    });

    const counts = this.countByUserId(invitedUsers.map((item) => item.invitedByUserId).filter((id): id is string => Boolean(id)));

    return this.attachUsersToLeaderboard(
      Object.entries(counts)
        .map(([userId, count]) => ({ userId, count: String(count) }))
        .sort((a, b) => Number(b.count) - Number(a.count))
        .slice(0, limit),
    );
  }

  private async getProjectLeaders(limit = 5) {
    const cards = await this.cardRepository.find({ relations: { owner: true } });
    const counts = this.countByUserId(cards.map((item) => item.owner.id));

    return this.attachUsersToLeaderboard(
      Object.entries(counts)
        .map(([userId, count]) => ({ userId, count: String(count) }))
        .sort((a, b) => Number(b.count) - Number(a.count))
        .slice(0, limit),
    );
  }

  private async getParticipationLeaders(limit = 5) {
    const requests = await this.detailRequestRepository.find({
      relations: {
        requester: true,
        publisher: true,
      },
    });

    const rows = Object.entries(
      this.countByUserId([
        ...requests.map((item) => item.requester.id),
        ...requests.map((item) => item.publisher.id),
      ]),
    )
      .map(([userId, count]) => ({ userId, count: String(count) }))
      .sort((a, b) => Number(b.count) - Number(a.count))
      .slice(0, limit);

    return this.attachUsersToLeaderboard(rows);
  }

  private async attachUsersToLeaderboard(rows: Array<{ userId: string; count: string }>) {
    const userIds = rows.map((row) => row.userId);

    if (userIds.length === 0) {
      return [];
    }

    const users = await this.userRepository.find({ where: { id: In(userIds) } });
    const userMap = new Map(users.map((user) => [user.id, user]));

    return rows.map((row) => {
      const user = userMap.get(row.userId);

      return {
        userId: row.userId,
        displayName: user?.displayName || '未知用户',
        email: user?.email || null,
        count: Number(row.count || '0'),
      };
    });
  }

  private countByUserId(userIds: string[]) {
    return userIds.reduce<Record<string, number>>((acc, userId) => {
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {});
  }

  private sumPointsByUserId(items: Array<{ userId: string; points: number }>) {
    return items.reduce<Record<string, number>>((acc, item) => {
      acc[item.userId] = (acc[item.userId] || 0) + item.points;
      return acc;
    }, {});
  }

  private buildPublicWelfareRiskMap(records: PublishedContentRecord[]) {
    const riskMap = new Map<
      string,
      {
        reviewRequired: boolean;
        riskLevel: 'none' | 'medium' | 'high' | null;
        categories: string[];
        matchedTerms: string[];
        confirmedToPublish: boolean;
      }
    >();

    records.forEach((record) => {
      const messageId = record.contentSnapshot?.messageId;

      if (typeof messageId !== 'string' || riskMap.has(messageId)) {
        return;
      }

      riskMap.set(messageId, {
        reviewRequired: record.reviewRequired,
        riskLevel: record.riskLevel,
        categories: record.riskCategories || [],
        matchedTerms: record.riskMatchedTerms || [],
        confirmedToPublish: record.confirmedToPublish,
      });
    });

    return riskMap;
  }

  private parseLimit(rawLimit: string | undefined, fallback: number, min: number, max: number) {
    const parsedLimit = Number(rawLimit || fallback);
    return Number.isFinite(parsedLimit) ? Math.min(Math.max(Math.floor(parsedLimit), min), max) : fallback;
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardEngagementType } from '../common/enums/card-engagement-type.enum';
import { ContactMethod } from '../contacts/contact-method.entity';
import { ContactType } from '../common/enums/contact-type.enum';
import { ContentModerationService } from '../compliance/content-moderation.service';
import { RewardAction } from '../common/enums/reward-action.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { ComplianceLogService } from '../compliance/compliance-log.service';
import { RewardService } from '../rewards/reward.service';
import { User } from '../users/user.entity';
import { INVITE_CODE_MAX_LENGTH, isSafeAccountName, normalizeDisplayName } from '../users/display-name.util';
import { CardEngagement } from '../platform/card-engagement.entity';
import { Card } from '../platform/card.entity';
import { CardTag } from '../platform/card-tag.entity';
import { buildCardPublicCode } from '../platform/public-code';
import { Tag } from '../platform/tag.entity';
import { SaveBasicProfileDto } from './dto/save-basic-profile.dto';
import { SaveContactMethodsDto } from './dto/save-contact-methods.dto';
import { UpdateCardBasicDto } from './dto/update-card-basic.dto';
import { SaveDetailProfileDto } from './dto/save-detail-profile.dto';
import { SaveDisplayNameDto } from './dto/save-display-name.dto';

@Injectable()
export class MeService {
  constructor(
    private readonly rewardService: RewardService,
    private readonly complianceLogService: ComplianceLogService,
    private readonly contentModerationService: ContentModerationService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(CardEngagement)
    private readonly cardEngagementRepository: Repository<CardEngagement>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(CardTag)
    private readonly cardTagRepository: Repository<CardTag>,
    @InjectRepository(ContactMethod)
    private readonly contactMethodRepository: Repository<ContactMethod>,
  ) {}

  async getProfile(userId: string) {
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

    return this.toProfileResponse(user);
  }

  async saveBasicProfile(userId: string, body: SaveBasicProfileDto) {
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

    const moderationResult = this.contentModerationService.ensureReviewed({
      operationType: 'publish_card_basic_profile',
      riskConfirmed: body.riskConfirmed,
      fields: [
        { field: 'headline', content: body.headline },
        { field: 'basicSummary', content: body.basicSummary },
        { field: 'city', content: body.city },
        { field: 'desiredDirection', content: body.desiredDirection },
        { field: 'strengths', content: body.strengths.join(' | ') },
      ],
    });

    await this.userRepository.save(user);

    const card = this.cardRepository.create({
      owner: user,
      publicCode: await this.createNextCardPublicCode(body.role),
      detailPreview: this.createDetailPreviewFallback(),
      strengths: [],
    });

    card.role = body.role;
    card.headline = body.headline.trim();
    card.city = body.city.trim();
    card.basicSummary = body.basicSummary.trim();
    card.optionalDirection = body.desiredDirection?.trim() || null;
    card.strengths = body.strengths
      .map((item) => this.normalizeTagName(item))
      .filter(Boolean)
      .slice(0, 8);
    card.detailPreview = user.detailedProfile ?? card.detailPreview ?? this.createDetailPreviewFallback();
    const savedCard = await this.cardRepository.save(card);
    await this.syncCardTags(savedCard, card.strengths);
    await this.rewardService.ensureInviteCodeForUser(user.id);
    await this.rewardService.awardPoints(
      user.id,
      body.role === UserRole.EXPERT ? RewardAction.PUBLISH_PROJECT : RewardAction.REGISTER_DEVELOPER,
      `${body.role === UserRole.EXPERT ? RewardAction.PUBLISH_PROJECT : RewardAction.REGISTER_DEVELOPER}:${user.id}:${savedCard.id}`,
      {
        cardId: savedCard.id,
        cardPublicCode: savedCard.publicCode,
        role: body.role,
      },
    );
    await this.complianceLogService.recordPublishedContent({
      userId: user.id,
      userEmail: user.email,
      cardId: savedCard.id,
      cardPublicCode: savedCard.publicCode,
      operationType: 'publish_card_basic_profile',
      riskReview: {
        reviewRequired: moderationResult.hasRisk,
        riskLevel: moderationResult.riskLevel,
        categories: moderationResult.categories,
        matchedTerms: moderationResult.matchedTerms,
        confirmedToPublish: Boolean(body.riskConfirmed),
        provider: moderationResult.provider,
      },
      contentSnapshot: {
        role: savedCard.role,
        headline: savedCard.headline,
        city: savedCard.city,
        basicSummary: savedCard.basicSummary,
        optionalDirection: savedCard.optionalDirection,
        strengths: savedCard.strengths,
      },
    });

    return this.getProfile(userId);
  }

  async saveInviteCode(userId: string, body: { inviteCode: string; riskConfirmed?: boolean }) {
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

    const moderationResult = this.contentModerationService.ensureReviewed({
      operationType: 'update_invite_code',
      riskConfirmed: body.riskConfirmed,
      fields: [{ field: 'inviteCode', content: body.inviteCode }],
    });

    const availability = await this.checkInviteCodeAvailability(userId, body.inviteCode);

    if (!availability.available) {
      throw new BadRequestException(availability.message || '邀请码已被使用，请换一个');
    }

    user.inviteCode = availability.normalizedInviteCode;
    await this.userRepository.save(user);

    await this.complianceLogService.recordPublishedContent({
      userId: user.id,
      userEmail: user.email,
      operationType: 'update_invite_code',
      riskReview: {
        reviewRequired: moderationResult.hasRisk,
        riskLevel: moderationResult.riskLevel,
        categories: moderationResult.categories,
        matchedTerms: moderationResult.matchedTerms,
        confirmedToPublish: Boolean(body.riskConfirmed),
        provider: moderationResult.provider,
      },
      contentSnapshot: {
        inviteCode: user.inviteCode,
      },
    });

    return this.rewardService.getMyInviteOverview(user.id);
  }

  async updateCardBasic(userId: string, cardId: string, body: UpdateCardBasicDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const moderationResult = this.contentModerationService.ensureReviewed({
      operationType: 'update_card_basic_profile',
      riskConfirmed: body.riskConfirmed,
      fields: [
        { field: 'headline', content: body.headline },
        { field: 'basicSummary', content: body.basicSummary },
        { field: 'city', content: body.city },
        { field: 'strengths', content: body.strengths.join(' | ') },
      ],
    });

    const card = await this.cardRepository.findOne({
      where: {
        publicCode: cardId,
        owner: { id: userId },
      },
      relations: {
        owner: true,
      },
    });

    if (!card) {
      throw new NotFoundException('目标卡片不存在');
    }

    card.headline = body.headline.trim();
    card.basicSummary = body.basicSummary.trim();
    card.city = body.city.trim();
    card.strengths = body.strengths
      .map((item) => this.normalizeTagName(item))
      .filter(Boolean)
      .slice(0, 8);
    const savedCard = await this.cardRepository.save(card);
    await this.syncCardTags(savedCard, savedCard.strengths);

    await this.complianceLogService.recordPublishedContent({
      userId: user.id,
      userEmail: user.email,
      cardId: savedCard.id,
      cardPublicCode: savedCard.publicCode,
      operationType: 'update_card_basic_profile',
      riskReview: {
        reviewRequired: moderationResult.hasRisk,
        riskLevel: moderationResult.riskLevel,
        categories: moderationResult.categories,
        matchedTerms: moderationResult.matchedTerms,
        confirmedToPublish: Boolean(body.riskConfirmed),
        provider: moderationResult.provider,
      },
      contentSnapshot: {
        role: savedCard.role,
        headline: savedCard.headline,
        city: savedCard.city,
        basicSummary: savedCard.basicSummary,
        strengths: savedCard.strengths,
      },
    });

    return {
      id: savedCard.publicCode,
      role: savedCard.role,
      headline: savedCard.headline,
      city: savedCard.city,
      basicSummary: savedCard.basicSummary,
      strengths: savedCard.strengths,
      updatedAt: savedCard.updatedAt.toISOString(),
    };
  }

  async deleteCard(userId: string, cardId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const card = await this.cardRepository.findOne({
      where: {
        publicCode: cardId,
        owner: { id: userId },
      },
      relations: {
        owner: true,
      },
    });

    if (!card) {
      throw new NotFoundException('目标卡片不存在');
    }

    const snapshot = {
      id: card.publicCode,
      role: card.role,
      headline: card.headline,
      city: card.city,
      basicSummary: card.basicSummary,
      strengths: card.strengths,
    };

    await this.cardTagRepository.softDelete({ card: { id: card.id } });
    await this.updateTagUsageCounts();
    await this.cardRepository.softDelete({ id: card.id });

    await this.complianceLogService.recordPublishedContent({
      userId: user.id,
      userEmail: user.email,
      cardId: card.id,
      cardPublicCode: card.publicCode,
      operationType: 'delete_card_basic_profile',
      contentSnapshot: snapshot,
    });

    return { ok: true };
  }

  async getDisplayNameAvailability(userId: string, rawDisplayName: string) {
    return this.checkDisplayNameAvailability(userId, rawDisplayName);
  }

  async getInviteCodeAvailability(userId: string, rawInviteCode: string) {
    return this.checkInviteCodeAvailability(userId, rawInviteCode);
  }

  async getInviteOverview(userId: string) {
    return this.rewardService.getMyInviteOverview(userId);
  }

  async getPointsOverview(userId: string) {
    return this.rewardService.getMyPointsOverview(userId);
  }

  async getEngagements(userId: string) {
    const engagements = await this.cardEngagementRepository.find({
      where: {
        user: { id: userId },
        active: true,
      },
      relations: {
        card: true,
      },
    });

    return engagements.reduce<{ favorites: Record<string, true>; likes: Record<string, true> }>(
      (acc, item) => {
        const cardId = item.card.publicCode;

        if (item.type === CardEngagementType.FAVORITE) {
          acc.favorites[cardId] = true;
        }

        if (item.type === CardEngagementType.LIKE) {
          acc.likes[cardId] = true;
        }

        return acc;
      },
      {
        favorites: {},
        likes: {},
      },
    );
  }

  async toggleCardEngagement(userId: string, cardId: string, type: CardEngagementType, active: boolean) {
    let card = await this.cardRepository.findOne({
      where: { publicCode: cardId },
      relations: {
        owner: true,
      },
    });

    if (!card && this.isUuid(cardId)) {
      card = await this.cardRepository.findOne({
        where: { id: cardId },
        relations: {
          owner: true,
        },
      });
    }

    if (!card) {
      throw new NotFoundException('目标卡片不存在');
    }

    let engagement = await this.cardEngagementRepository.findOne({
      where: {
        user: { id: userId },
        card: { id: card.id },
        type,
      },
      relations: {
        user: true,
        card: true,
      },
    });

    if (!engagement) {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      engagement = this.cardEngagementRepository.create({
        user,
        card,
        type,
        active,
        firstActivatedAt: active ? new Date() : null,
      });
    } else {
      engagement.active = active;

      if (active && !engagement.firstActivatedAt) {
        engagement.firstActivatedAt = new Date();
      }
    }

    const savedEngagement = await this.cardEngagementRepository.save(engagement);

    if (savedEngagement.active && savedEngagement.firstActivatedAt) {
      const action = type === CardEngagementType.LIKE ? RewardAction.LIKE_CARD : RewardAction.FAVORITE_CARD;
      await this.rewardService.awardPoints(userId, action, `engagement:${type}:${userId}:${card.id}`, {
        cardId: card.id,
        cardPublicCode: card.publicCode,
      });
    }

    return {
      cardId: card.publicCode,
      type,
      active: savedEngagement.active,
    };
  }

  async saveDisplayName(userId: string, body: SaveDisplayNameDto) {
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

    const moderationResult = this.contentModerationService.ensureReviewed({
      operationType: 'update_display_name',
      riskConfirmed: body.riskConfirmed,
      fields: [{ field: 'displayName', content: body.displayName }],
    });

    const availability = await this.checkDisplayNameAvailability(userId, body.displayName);

    if (!availability.available) {
      throw new BadRequestException(availability.message || '昵称已被使用，请换一个');
    }

    user.displayName = availability.normalizedDisplayName;
    await this.userRepository.save(user);

    await this.complianceLogService.recordPublishedContent({
      userId: user.id,
      userEmail: user.email,
      operationType: 'update_display_name',
      riskReview: {
        reviewRequired: moderationResult.hasRisk,
        riskLevel: moderationResult.riskLevel,
        categories: moderationResult.categories,
        matchedTerms: moderationResult.matchedTerms,
        confirmedToPublish: Boolean(body.riskConfirmed),
        provider: moderationResult.provider,
      },
      contentSnapshot: {
        displayName: user.displayName,
      },
    });

    return this.getProfile(userId);
  }

  async saveDetailProfile(userId: string, body: SaveDetailProfileDto) {
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

    const moderationResult = this.contentModerationService.ensureReviewed({
      operationType: 'update_card_detail_profile',
      riskConfirmed: body.riskConfirmed,
      fields: [
        { field: 'intro', content: body.intro },
        { field: 'education', content: body.education },
        { field: 'experience', content: body.experience },
        { field: 'expertProjectDetail', content: body.expertProjectDetail },
        { field: 'developerProjectExperience', content: body.developerProjectExperience },
        { field: 'projectDetail', content: body.projectDetail },
      ],
    });

    const cardRole = user.cards[0]?.role;
    const previousDetail = (user.detailedProfile ?? {}) as Record<string, unknown>;
    const legacyProjectDetail = this.normalizeOptionalDetailField(body.projectDetail);
    const existingExpertProjectDetail = this.normalizeOptionalDetailField(previousDetail.expertProjectDetail ?? previousDetail.projectDetail);
    const existingDeveloperProjectExperience = this.normalizeOptionalDetailField(previousDetail.developerProjectExperience ?? previousDetail.projectDetail);

    let expertProjectDetail = this.normalizeOptionalDetailField(body.expertProjectDetail) ?? existingExpertProjectDetail;
    let developerProjectExperience = this.normalizeOptionalDetailField(body.developerProjectExperience) ?? existingDeveloperProjectExperience;

    if (legacyProjectDetail) {
      if (cardRole === UserRole.EXPERT) {
        expertProjectDetail = legacyProjectDetail;
      } else if (cardRole === UserRole.DEVELOPER) {
        developerProjectExperience = legacyProjectDetail;
      } else {
        expertProjectDetail = expertProjectDetail ?? legacyProjectDetail;
        developerProjectExperience = developerProjectExperience ?? legacyProjectDetail;
      }
    }

    if (cardRole === UserRole.EXPERT && !expertProjectDetail) {
      throw new BadRequestException('请填写项目详情');
    }

    if (cardRole === UserRole.DEVELOPER && !developerProjectExperience) {
      throw new BadRequestException('请填写做过的项目/产品');
    }

    user.detailedProfile = {
      intro: body.intro.trim(),
      education: body.education.trim(),
      experience: body.experience.trim(),
      expertProjectDetail: expertProjectDetail ?? '',
      developerProjectExperience: developerProjectExperience ?? '',
      projectDetail: expertProjectDetail ?? developerProjectExperience ?? '',
    };
    user.detailedProfileCompletedAt = new Date();
    await this.userRepository.save(user);

    if (user.cards.length > 0) {
      await this.cardRepository.save(
        user.cards.map((card) => {
          card.detailPreview = user.detailedProfile ?? this.createDetailPreviewFallback();
          return card;
        }),
      );

      await Promise.all(
        user.cards.map((card) =>
          this.complianceLogService.recordPublishedContent({
            userId: user.id,
            userEmail: user.email,
            cardId: card.id,
            cardPublicCode: card.publicCode,
            operationType: 'update_card_detail_profile',
            riskReview: {
              reviewRequired: moderationResult.hasRisk,
              riskLevel: moderationResult.riskLevel,
              categories: moderationResult.categories,
              matchedTerms: moderationResult.matchedTerms,
              confirmedToPublish: Boolean(body.riskConfirmed),
              provider: moderationResult.provider,
            },
            contentSnapshot: {
              role: card.role,
              detailPreview: card.detailPreview,
            },
          }),
        ),
      );
    }

    return this.getProfile(userId);
  }

  async saveContactMethods(userId: string, body: SaveContactMethodsDto) {
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

    const moderationResult = this.contentModerationService.ensureReviewed({
      operationType: 'update_contact_methods',
      riskConfirmed: body.riskConfirmed,
      fields: [
        { field: 'phone', content: body.phone },
        { field: 'wechat', content: body.wechat },
        { field: 'qq', content: body.qq },
        { field: 'email', content: body.email },
        { field: 'other', content: body.other },
      ],
    });

    await this.contactMethodRepository.softDelete({ user: { id: user.id } });

    const nextContacts = this.buildContactMethods(user, body);

    if (nextContacts.length > 0) {
      await this.contactMethodRepository.save(nextContacts);
    }

    await this.complianceLogService.recordPublishedContent({
      userId: user.id,
      userEmail: user.email,
      operationType: 'update_contact_methods',
      riskReview: {
        reviewRequired: moderationResult.hasRisk,
        riskLevel: moderationResult.riskLevel,
        categories: moderationResult.categories,
        matchedTerms: moderationResult.matchedTerms,
        confirmedToPublish: Boolean(body.riskConfirmed),
        provider: moderationResult.provider,
      },
      contentSnapshot: {
        contacts: nextContacts.map((item) => ({
          type: item.type,
          value: item.value,
          isPrimary: item.isPrimary,
        })),
      },
    });

    return this.getProfile(userId);
  }

  private buildContactMethods(user: User, body: SaveContactMethodsDto) {
    const entries: Array<[ContactType, string | undefined]> = [
      [ContactType.PHONE, body.phone],
      [ContactType.WECHAT, body.wechat],
      [ContactType.QQ, body.qq],
      [ContactType.EMAIL, body.email],
      [ContactType.OTHER, body.other],
    ];

    const filteredEntries = entries.filter(([, value]) => value?.trim());

    return filteredEntries.map(([type, value], index) =>
      this.contactMethodRepository.create({
        user,
        type,
        value: value!.trim(),
        isPrimary: index === 0,
      }),
    );
  }

  private normalizeTagName(value: string) {
    return value
      .replace(/^#+/, '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private async syncCardTags(card: Card, tagNames: string[]) {
    await this.cardTagRepository.softDelete({ card: { id: card.id } });

    const normalizedEntries = Array.from(
      new Map(
        tagNames
          .map((name) => this.normalizeTagName(name))
          .filter(Boolean)
          .map((name) => [name.toLowerCase(), name] as const),
      ).values(),
    );

    if (normalizedEntries.length === 0) {
      await this.updateTagUsageCounts();
      return;
    }

    const tags: Tag[] = [];

    for (const name of normalizedEntries) {
      const normalizedName = name.toLowerCase();
      let tag = await this.tagRepository.findOne({ where: { normalizedName } });

      if (!tag) {
        tag = this.tagRepository.create({
          name,
          normalizedName,
          usageCount: 0,
        });
      } else if (tag.name !== name) {
        tag.name = name;
      }

      tags.push(await this.tagRepository.save(tag));
    }

    for (const tag of tags) {
      const existing = await this.cardTagRepository.findOne({
        where: {
          card: { id: card.id },
          tag: { id: tag.id },
        },
        relations: {
          card: true,
          tag: true,
        },
        withDeleted: true,
      });

      if (existing) {
        if (existing.deletedAt) {
          await this.cardTagRepository.recover(existing);
        }

        continue;
      }

      await this.cardTagRepository.save(
        this.cardTagRepository.create({
          card,
          tag,
        }),
      );
    }

    await this.updateTagUsageCounts();
  }

  private async updateTagUsageCounts() {
    const tags = await this.tagRepository.find();

    if (tags.length === 0) {
      return;
    }

    for (const tag of tags) {
      const usageCount = await this.cardTagRepository.count({ where: { tag: { id: tag.id } } });

      if (tag.usageCount !== usageCount) {
        tag.usageCount = usageCount;
        await this.tagRepository.save(tag);
      }
    }
  }

  private toProfileResponse(user: User) {
    const card = user.cards[0] ?? null;

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
        detailedProfile: user.detailedProfile,
        detailedProfileCompletedAt: user.detailedProfileCompletedAt,
        lastLoginAt: user.lastLoginAt,
      },
      card: card
        ? {
            id: card.publicCode,
            role: card.role,
            headline: card.headline,
            city: card.city,
            basicSummary: card.basicSummary,
            optionalDirection: card.optionalDirection,
            strengths: card.strengths,
          }
        : null,
      contactMethods: user.contactMethods.map((item) => ({
        id: item.id,
        type: item.type,
        value: item.value,
        isPrimary: item.isPrimary,
      })),
      completion: {
        hasBasicProfile: Boolean(user.detailedProfileCompletedAt),
        hasDetailProfile: Boolean(user.detailedProfileCompletedAt),
        hasPublicCard: Boolean(card),
      },
    };
  }

  private async createNextCardPublicCode(role: Card['role']) {
    const sequenceName = role === UserRole.EXPERT ? 'cards_public_code_expert_seq' : 'cards_public_code_developer_seq';
    const rows: Array<{ value: string | number }> = await this.cardRepository.query(`SELECT nextval('${sequenceName}') AS value`);
    const [row] = rows;
    const sequenceNumber = Number(row?.value ?? 0);
    return buildCardPublicCode(role, sequenceNumber);
  }

  private createDetailPreviewFallback() {
    return {
      intro: '',
      education: '',
      experience: '',
      expertProjectDetail: '待补充项目详情',
      developerProjectExperience: '待补充做过的项目/产品',
      projectDetail: '待补充项目介绍',
    };
  }

  private async checkDisplayNameAvailability(userId: string, rawDisplayName: string) {
    const displayName = normalizeDisplayName(rawDisplayName);

    if (!displayName) {
      return {
        available: false,
        normalizedDisplayName: displayName,
        message: '昵称不能为空',
      };
    }

    if (displayName.length < 2) {
      return {
        available: false,
        normalizedDisplayName: displayName,
        message: '昵称至少需要 2 个字符',
      };
    }

    if (displayName.length > 120) {
      return {
        available: false,
        normalizedDisplayName: displayName,
        message: '昵称不能超过 120 个字符',
      };
    }

    if (!isSafeAccountName(displayName)) {
      return {
        available: false,
        normalizedDisplayName: displayName,
        message: '昵称仅支持英文大小写、数字和下划线（_）',
      };
    }

    const existingUser = await this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.displayName) = LOWER(:displayName)', { displayName })
      .getOne();

    if (!existingUser || existingUser.id === userId) {
      return {
        available: true,
        normalizedDisplayName: displayName,
        message: null,
      };
    }

    return {
      available: false,
      normalizedDisplayName: displayName,
      message: '昵称已被使用，请换一个',
    };
  }

  private async checkInviteCodeAvailability(userId: string, rawInviteCode: string) {
    const inviteCode = normalizeDisplayName(rawInviteCode);

    if (!inviteCode) {
      return {
        available: false,
        normalizedInviteCode: inviteCode,
        message: '邀请码不能为空',
      };
    }

    if (inviteCode.length < 2) {
      return {
        available: false,
        normalizedInviteCode: inviteCode,
        message: '邀请码至少需要 2 个字符',
      };
    }

    if (inviteCode.length > INVITE_CODE_MAX_LENGTH) {
      return {
        available: false,
        normalizedInviteCode: inviteCode,
        message: `邀请码不能超过 ${INVITE_CODE_MAX_LENGTH} 个字符`,
      };
    }

    if (!isSafeAccountName(inviteCode)) {
      return {
        available: false,
        normalizedInviteCode: inviteCode,
        message: '邀请码仅支持英文大小写、数字和下划线（_）',
      };
    }

    const existingUser = await this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.inviteCode) = LOWER(:inviteCode)', { inviteCode })
      .getOne();

    if (!existingUser || existingUser.id === userId) {
      return {
        available: true,
        normalizedInviteCode: inviteCode,
        message: null,
      };
    }

    return {
      available: false,
      normalizedInviteCode: inviteCode,
      message: '邀请码已被使用，请换一个',
    };
  }

  private normalizeOptionalDetailField(value: unknown) {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}

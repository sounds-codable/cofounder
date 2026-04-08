import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardEngagementType } from '../common/enums/card-engagement-type.enum';
import { ContactMethod } from '../contacts/contact-method.entity';
import { ContactType } from '../common/enums/contact-type.enum';
import { RewardAction } from '../common/enums/reward-action.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { RewardService } from '../rewards/reward.service';
import { User } from '../users/user.entity';
import { CardEngagement } from '../platform/card-engagement.entity';
import { Card } from '../platform/card.entity';
import { CardTag } from '../platform/card-tag.entity';
import { Tag } from '../platform/tag.entity';
import { SaveBasicProfileDto } from './dto/save-basic-profile.dto';
import { SaveContactMethodsDto } from './dto/save-contact-methods.dto';
import { SaveDetailProfileDto } from './dto/save-detail-profile.dto';
import { SaveDisplayNameDto } from './dto/save-display-name.dto';

@Injectable()
export class MeService {
  constructor(
    private readonly rewardService: RewardService,
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

    await this.userRepository.save(user);

    const card = this.cardRepository.create({
      owner: user,
      slug: this.createCardSlug(user.id, body.role, user.displayName),
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
        cardSlug: savedCard.slug,
        role: body.role,
      },
    );

    return this.getProfile(userId);
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
        const cardId = item.card.slug;

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
      where: { slug: cardId },
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
        cardSlug: card.slug,
      });
    }

    return {
      cardId: card.slug,
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

    user.displayName = body.displayName.trim();
    await this.userRepository.save(user);

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

    await this.contactMethodRepository.delete({ user: { id: user.id } });

    const nextContacts = this.buildContactMethods(user, body);

    if (nextContacts.length > 0) {
      await this.contactMethodRepository.save(nextContacts);
    }

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
    await this.cardTagRepository.delete({ card: { id: card.id } });

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

    await this.cardTagRepository.save(
      tags.map((tag) =>
        this.cardTagRepository.create({
          card,
          tag,
        }),
      ),
    );

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
            id: card.slug,
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

  private createCardSlug(userId: string, role: Card['role'], displayName: string) {
    const normalizedName = displayName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const nowToken = Date.now().toString(36);
    const randomToken = Math.random().toString(36).slice(2, 6);
    return `${role}-${normalizedName || 'member'}-${userId.slice(0, 8)}-${nowToken}${randomToken}`;
  }

  private createDetailPreviewFallback() {
    return {
      intro: '待补充详细信息',
      education: '待补充教育背景',
      experience: '待补充工作背景',
      expertProjectDetail: '待补充项目详情',
      developerProjectExperience: '待补充做过的项目/产品',
      projectDetail: '待补充项目介绍',
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

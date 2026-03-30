import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMethod } from '../contacts/contact-method.entity';
import { ContactType } from '../common/enums/contact-type.enum';
import { User } from '../users/user.entity';
import { Card } from '../platform/card.entity';
import { SaveBasicProfileDto } from './dto/save-basic-profile.dto';
import { SaveDetailProfileDto } from './dto/save-detail-profile.dto';

@Injectable()
export class MeService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
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

    user.role = body.role;
    user.displayName = body.displayName.trim();
    user.city = body.city.trim();
    user.basicSummary = body.basicSummary.trim();
    user.desiredDirection = body.desiredDirection?.trim() || null;
    await this.userRepository.save(user);

    const card = user.cards[0] ?? this.cardRepository.create({
      owner: user,
      slug: this.createCardSlug(user.id, body.role, body.displayName),
      detailPreview: this.createDetailPreviewFallback(),
      strengths: [],
    });

    card.role = body.role;
    card.slug = card.slug || this.createCardSlug(user.id, body.role, body.displayName);
    card.headline = body.headline.trim();
    card.city = body.city.trim();
    card.basicSummary = body.basicSummary.trim();
    card.optionalDirection = body.desiredDirection?.trim() || null;
    card.strengths = body.strengths.map((item) => item.trim()).filter(Boolean).slice(0, 8);
    card.detailPreview = user.detailedProfile ?? card.detailPreview ?? this.createDetailPreviewFallback();
    await this.cardRepository.save(card);

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

    user.detailedProfile = {
      intro: body.intro.trim(),
      education: body.education.trim(),
      experience: body.experience.trim(),
      projectDetail: body.projectDetail.trim(),
    };
    user.detailedProfileCompletedAt = new Date();
    await this.userRepository.save(user);

    const card = user.cards[0];

    if (card) {
      card.detailPreview = user.detailedProfile;
      await this.cardRepository.save(card);
    }

    await this.contactMethodRepository.delete({ user: { id: user.id } });

    const nextContacts = this.buildContactMethods(user, body);

    if (nextContacts.length > 0) {
      await this.contactMethodRepository.save(nextContacts);
    }

    return this.getProfile(userId);
  }

  private buildContactMethods(user: User, body: SaveDetailProfileDto) {
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

  private toProfileResponse(user: User) {
    const card = user.cards[0] ?? null;

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        city: user.city,
        basicSummary: user.basicSummary,
        desiredDirection: user.desiredDirection,
        detailedProfile: user.detailedProfile,
        detailedProfileCompletedAt: user.detailedProfileCompletedAt,
        lastLoginAt: user.lastLoginAt,
      },
      card: card
        ? {
            id: card.slug,
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
        hasBasicProfile: user.city !== '待填写' && user.basicSummary !== '待补充基础信息',
        hasDetailProfile: Boolean(user.detailedProfileCompletedAt),
        hasPublicCard: Boolean(card),
      },
    };
  }

  private createCardSlug(userId: string, role: User['role'], displayName: string) {
    const normalizedName = displayName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${role}-${normalizedName || 'member'}-${userId.slice(0, 8)}`;
  }

  private createDetailPreviewFallback() {
    return {
      intro: '待补充详细信息',
      education: '待补充教育背景',
      experience: '待补充工作背景',
      projectDetail: '待补充项目介绍',
    };
  }
}

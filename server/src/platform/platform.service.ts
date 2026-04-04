import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetailRequestStatus } from '../common/enums/detail-request-status.enum';
import { DetailRequest } from './detail-request.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { Card } from './card.entity';

type LogoVariant = 'overlap' | 'spark' | 'bridge' | 'orbit';

@Injectable()
export class PlatformService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(DetailRequest)
    private readonly detailRequestRepository: Repository<DetailRequest>,
  ) {}

  async getOverview() {
    const cards = await this.cardRepository.find();

    return {
      roles: [
        {
          key: UserRole.EXPERT,
          label: '项目方 / 行业专家',
        },
        {
          key: UserRole.DEVELOPER,
          label: '程序员',
        },
      ],
      stats: {
        totalCards: cards.length,
        expertCards: cards.filter((card) => card.role === UserRole.EXPERT).length,
        developerCards: cards.filter((card) => card.role === UserRole.DEVELOPER).length,
      },
      requestStates: this.getRequestStates(),
      logoVariant: this.getLogoVariant(),
    };
  }

  private getLogoVariant(): LogoVariant {
    const configuredVariant = this.configService.get<string>('LOGO_VARIANT', 'overlap');
    const allowedVariants: LogoVariant[] = ['overlap', 'spark', 'bridge', 'orbit'];

    if (allowedVariants.includes(configuredVariant as LogoVariant)) {
      return configuredVariant as LogoVariant;
    }

    return 'overlap';
  }

  async listCards(role?: UserRole) {
    const query = this.cardRepository.createQueryBuilder('card').leftJoinAndSelect('card.owner', 'owner');

    if (role) {
      query.andWhere('card.role = :role', { role });
    }

    const cards = await query.orderBy('card.updatedAt', 'DESC').getMany();

    return cards.map((card) => this.toPublicCard(card));
  }

  async getCardById(id: string, viewerUserId?: string | null) {
    let card = await this.cardRepository.findOne({
      where: { slug: id },
      relations: {
        owner: {
          contactMethods: true,
        },
      },
    });

    if (!card && this.isUuid(id)) {
      card = await this.cardRepository.findOne({
        where: { id },
        relations: {
          owner: {
            contactMethods: true,
          },
        },
      });
    }

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const publicCard = this.toPublicCard(card);

    if (!viewerUserId) {
      return {
        ...publicCard,
        viewerState: null,
      };
    }

    const request = await this.detailRequestRepository.findOne({
      where: {
        requester: { id: viewerUserId },
        targetCard: { id: card.id },
      },
      relations: {
        requester: {
          contactMethods: true,
        },
        publisher: {
          contactMethods: true,
        },
        targetCard: {
          owner: {
            contactMethods: true,
          },
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const detailVisible = request?.status === DetailRequestStatus.APPROVED_DETAIL_VISIBLE || request?.status === DetailRequestStatus.CONTACT_EXCHANGED;
    const contactVisible = request?.status === DetailRequestStatus.CONTACT_EXCHANGED;

    return {
      ...publicCard,
      viewerState: request
        ? {
            requestId: request.id,
            status: request.status,
            detailVisible,
            contactVisible,
            revealedDetail: detailVisible ? card.owner.detailedProfile : null,
            contactMethods: contactVisible
              ? card.owner.contactMethods.map((item) => ({
                  id: item.id,
                  type: item.type,
                  value: item.value,
                  isPrimary: item.isPrimary,
                }))
              : [],
          }
        : null,
    };
  }

  getRequestStates() {
    return [
      {
        key: DetailRequestStatus.PENDING_REQUEST,
        label: '待发布者处理',
        description: '意向者已发出请求，仍只能看到发布者基础信息。',
      },
      {
        key: DetailRequestStatus.PUBLISHER_VIEWED_DETAIL,
        label: '发布者已查看详细信息',
        description: '发布者已经完成前置查看动作，才能继续同意或拒绝。',
      },
      {
        key: DetailRequestStatus.APPROVED_DETAIL_VISIBLE,
        label: '已同意查看详细信息',
        description: '意向者能看到详细信息，但联系方式还未交换。',
      },
      {
        key: DetailRequestStatus.CONTACT_EXCHANGED,
        label: '已交换联系方式',
        description: '双方已经通过第二步动作完成联系方式互通。',
      },
      {
        key: DetailRequestStatus.REJECTED,
        label: '已拒绝',
        description: '发布者拒绝本次请求，并给出了拒绝理由。',
      },
    ];
  }

  private toPublicCard(card: Card) {
    return {
      id: card.slug,
      role: card.role,
      updatedAt: card.updatedAt.toISOString(),
      ownerName: card.owner.displayName,
      headline: card.headline,
      city: card.city,
      basicSummary: card.basicSummary,
      optionalDirection: card.optionalDirection,
      strengths: card.strengths,
      detailPreview: card.detailPreview,
    };
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}

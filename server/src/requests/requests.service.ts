import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMethod } from '../contacts/contact-method.entity';
import { DetailRequestStatus } from '../common/enums/detail-request-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { Card } from '../platform/card.entity';
import { DetailRequest } from '../platform/detail-request.entity';
import { User } from '../users/user.entity';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(DetailRequest)
    private readonly detailRequestRepository: Repository<DetailRequest>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  async listForUser(userId: string) {
    const [incoming, outgoing] = await Promise.all([
      this.detailRequestRepository.find({
        where: { publisher: { id: userId } },
        relations: {
          publisher: { contactMethods: true },
          requester: { contactMethods: true },
          targetCard: { owner: { contactMethods: true } },
        },
        order: { createdAt: 'DESC' },
      }),
      this.detailRequestRepository.find({
        where: { requester: { id: userId } },
        relations: {
          publisher: { contactMethods: true },
          requester: { contactMethods: true },
          targetCard: { owner: { contactMethods: true } },
        },
        order: { createdAt: 'DESC' },
      }),
    ]);

    return {
      incoming: incoming.map((request) => this.toIncomingRequestItem(request)),
      outgoing: outgoing.map((request) => this.toOutgoingRequestItem(request)),
    };
  }

  async createRequest(user: User, cardId: string) {
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

    if (user.role !== UserRole.DEVELOPER) {
      throw new BadRequestException('当前仅支持程序员发起了解详情请求');
    }

    if (card.role !== UserRole.EXPERT) {
      throw new BadRequestException('当前仅支持向项目方卡片发起了解详情请求');
    }

    if (card.owner.id === user.id) {
      throw new BadRequestException('不能申请查看自己的卡片');
    }

    if (!user.detailedProfileCompletedAt || !user.detailedProfile) {
      throw new BadRequestException('请先完善详细信息，再申请了解详情');
    }

    const existingRequest = await this.detailRequestRepository.findOne({
      where: {
        requester: { id: user.id },
        targetCard: { id: card.id },
      },
      relations: {
        publisher: { contactMethods: true },
        requester: { contactMethods: true },
        targetCard: { owner: { contactMethods: true } },
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (existingRequest && existingRequest.status !== DetailRequestStatus.REJECTED) {
      return this.toOutgoingRequestItem(existingRequest);
    }

    const nextRequest = this.detailRequestRepository.create({
      publisher: card.owner,
      requester: user,
      targetCard: card,
      status: DetailRequestStatus.PENDING_REQUEST,
      rejectionReason: null,
      publisherViewedRequesterDetailAt: null,
      approvedAt: null,
      contactExchangedAt: null,
    });

    const savedRequest = await this.detailRequestRepository.save(nextRequest);
    const requestWithRelations = await this.detailRequestRepository.findOne({
      where: { id: savedRequest.id },
      relations: {
        publisher: { contactMethods: true },
        requester: { contactMethods: true },
        targetCard: { owner: { contactMethods: true } },
      },
    });

    return this.toOutgoingRequestItem(requestWithRelations!);
  }

  async viewRequesterDetail(userId: string, requestId: string) {
    const request = await this.getIncomingRequestForPublisher(userId, requestId);

    if (request.status === DetailRequestStatus.PENDING_REQUEST) {
      request.status = DetailRequestStatus.PUBLISHER_VIEWED_DETAIL;
      request.publisherViewedRequesterDetailAt = new Date();
      await this.detailRequestRepository.save(request);
    }

    return this.toIncomingRequestItem(request);
  }

  async approveRequest(userId: string, requestId: string) {
    const request = await this.getIncomingRequestForPublisher(userId, requestId);

    if (request.status !== DetailRequestStatus.PUBLISHER_VIEWED_DETAIL) {
      throw new BadRequestException('请先查看对方详细信息，再做同意动作');
    }

    request.status = DetailRequestStatus.APPROVED_DETAIL_VISIBLE;
    request.approvedAt = new Date();
    await this.detailRequestRepository.save(request);

    return this.toIncomingRequestItem(request);
  }

  async rejectRequest(userId: string, requestId: string, reason: string) {
    const request = await this.getIncomingRequestForPublisher(userId, requestId);

    if (request.status !== DetailRequestStatus.PUBLISHER_VIEWED_DETAIL) {
      throw new BadRequestException('请先查看对方详细信息，再做拒绝动作');
    }

    request.status = DetailRequestStatus.REJECTED;
    request.rejectionReason = reason.trim();
    await this.detailRequestRepository.save(request);

    return this.toIncomingRequestItem(request);
  }

  async exchangeContact(userId: string, requestId: string) {
    const request = await this.detailRequestRepository.findOne({
      where: { id: requestId },
      relations: {
        publisher: { contactMethods: true },
        requester: { contactMethods: true },
        targetCard: { owner: { contactMethods: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('请求不存在');
    }

    if (request.requester.id !== userId) {
      throw new ForbiddenException('只有请求发起方可以发起联系方式交换');
    }

    if (request.status !== DetailRequestStatus.APPROVED_DETAIL_VISIBLE && request.status !== DetailRequestStatus.CONTACT_EXCHANGED) {
      throw new BadRequestException('当前状态下不能交换联系方式');
    }

    request.status = DetailRequestStatus.CONTACT_EXCHANGED;
    request.contactExchangedAt = request.contactExchangedAt ?? new Date();
    await this.detailRequestRepository.save(request);

    return request.requester.id === userId ? this.toOutgoingRequestItem(request) : this.toIncomingRequestItem(request);
  }

  private async getIncomingRequestForPublisher(userId: string, requestId: string) {
    const request = await this.detailRequestRepository.findOne({
      where: { id: requestId },
      relations: {
        publisher: { contactMethods: true },
        requester: { contactMethods: true },
        targetCard: { owner: { contactMethods: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('请求不存在');
    }

    if (request.publisher.id !== userId) {
      throw new ForbiddenException('你无权处理该请求');
    }

    return request;
  }

  private toIncomingRequestItem(request: DetailRequest) {
    const detailViewed = Boolean(request.publisherViewedRequesterDetailAt);
    const approved = request.status === DetailRequestStatus.APPROVED_DETAIL_VISIBLE || request.status === DetailRequestStatus.CONTACT_EXCHANGED;
    const contactVisible = request.status === DetailRequestStatus.CONTACT_EXCHANGED;

    return {
      id: request.id,
      status: request.status,
      rejectionReason: request.rejectionReason,
      createdAt: request.createdAt,
      targetCard: this.toTargetCard(request),
      requester: {
        id: request.requester.id,
        displayName: request.requester.displayName,
        role: request.requester.role,
        city: request.requester.city,
        basicSummary: request.requester.basicSummary,
        desiredDirection: request.requester.desiredDirection,
        detailedProfile: detailViewed || approved ? request.requester.detailedProfile : null,
        contactMethods: contactVisible ? this.toContactMethods(request.requester.contactMethods) : [],
      },
      actions: {
        canViewRequesterDetail: request.status === DetailRequestStatus.PENDING_REQUEST,
        canApprove: request.status === DetailRequestStatus.PUBLISHER_VIEWED_DETAIL,
        canReject: request.status === DetailRequestStatus.PUBLISHER_VIEWED_DETAIL,
        canExchangeContact: false,
      },
    };
  }

  private toOutgoingRequestItem(request: DetailRequest) {
    const detailVisible = request.status === DetailRequestStatus.APPROVED_DETAIL_VISIBLE || request.status === DetailRequestStatus.CONTACT_EXCHANGED;
    const contactVisible = request.status === DetailRequestStatus.CONTACT_EXCHANGED;

    return {
      id: request.id,
      status: request.status,
      rejectionReason: request.rejectionReason,
      createdAt: request.createdAt,
      targetCard: this.toTargetCard(request),
      publisher: {
        id: request.publisher.id,
        displayName: request.publisher.displayName,
        role: request.publisher.role,
        city: request.publisher.city,
        basicSummary: request.publisher.basicSummary,
        detailedProfile: detailVisible ? request.publisher.detailedProfile : null,
        contactMethods: contactVisible ? this.toContactMethods(request.publisher.contactMethods) : [],
      },
      actions: {
        canExchangeContact: request.status === DetailRequestStatus.APPROVED_DETAIL_VISIBLE,
      },
    };
  }

  private toTargetCard(request: DetailRequest) {
    return {
      id: request.targetCard.slug,
      headline: request.targetCard.headline,
      city: request.targetCard.city,
      role: request.targetCard.role,
      ownerName: request.targetCard.owner.displayName,
    };
  }

  private toContactMethods(contactMethods: ContactMethod[]) {
    return contactMethods.map((item) => ({
      id: item.id,
      type: item.type,
      value: item.value,
      isPrimary: item.isPrimary,
    }));
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}

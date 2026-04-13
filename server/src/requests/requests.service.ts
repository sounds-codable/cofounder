import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceLogService } from '../compliance/compliance-log.service';
import { ContentModerationService } from '../compliance/content-moderation.service';
import { ContactMethod } from '../contacts/contact-method.entity';
import { DetailRequestStatus } from '../common/enums/detail-request-status.enum';
import { RewardAction } from '../common/enums/reward-action.enum';
import { Card } from '../platform/card.entity';
import { DetailRequest } from '../platform/detail-request.entity';
import { RewardService } from '../rewards/reward.service';
import { User } from '../users/user.entity';

type RequestDetailSnapshotInput = {
  intro?: string;
  education?: string;
  experience?: string;
  projectDetail?: string;
};

type CreateRequestInput = {
  cardId: string;
  riskConfirmed?: boolean;
} & RequestDetailSnapshotInput;

type DetailProfileSnapshot = {
  intro: string;
  education: string;
  experience: string;
  expertProjectDetail: string;
  developerProjectExperience: string;
  projectDetail: string;
};

@Injectable()
export class RequestsService {
  constructor(
    private readonly rewardService: RewardService,
    private readonly complianceLogService: ComplianceLogService,
    private readonly contentModerationService: ContentModerationService,
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
      incoming: incoming.filter((request) => Boolean(request.targetCard?.owner)).map((request) => this.toIncomingRequestItem(request)),
      outgoing: outgoing.filter((request) => Boolean(request.targetCard?.owner)).map((request) => this.toOutgoingRequestItem(request)),
    };
  }

  async createRequest(user: User, input: CreateRequestInput) {
    const { cardId, intro, education, experience, projectDetail, riskConfirmed } = input;

    const moderationResult = this.contentModerationService.ensureReviewed({
      operationType: 'create_detail_request_snapshot',
      riskConfirmed,
      fields: [
        { field: 'intro', content: intro },
        { field: 'education', content: education },
        { field: 'experience', content: experience },
        { field: 'projectDetail', content: projectDetail },
      ],
    });

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
      requesterDetailSnapshot: this.buildRequesterDetailSnapshot(user, {
        intro,
        education,
        experience,
        projectDetail,
      }),
      publisherDetailSnapshot: null,
      publisherViewedRequesterDetailAt: null,
      approvedAt: null,
      rejectedAt: null,
      contactExchangedAt: null,
      exchangeReviewingAt: null,
      requesterDeclinedContactAt: null,
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

    await this.complianceLogService.recordPublishedContent({
      userId: user.id,
      userEmail: user.email,
      cardId: card.id,
      cardPublicCode: card.publicCode,
      operationType: 'create_detail_request_snapshot',
      riskReview: {
        reviewRequired: moderationResult.hasRisk,
        riskLevel: moderationResult.riskLevel,
        categories: moderationResult.categories,
        matchedTerms: moderationResult.matchedTerms,
        confirmedToPublish: Boolean(riskConfirmed),
        provider: moderationResult.provider,
      },
      contentSnapshot: {
        requestId: savedRequest.id,
        targetCardId: card.publicCode,
        requesterSnapshot: savedRequest.requesterDetailSnapshot,
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

    if (request.status !== DetailRequestStatus.PUBLISHER_VIEWED_DETAIL && request.status !== DetailRequestStatus.REJECTED) {
      throw new BadRequestException('请先查看对方详细信息，再做同意动作');
    }

    request.status = DetailRequestStatus.APPROVED_DETAIL_VISIBLE;
    request.approvedAt = new Date();
    request.publisherDetailSnapshot = this.buildUserDetailSnapshot(request.publisher);
    await this.detailRequestRepository.save(request);

    return this.toIncomingRequestItem(request);
  }

  async rejectRequest(userId: string, requestId: string, reason: string, riskConfirmed?: boolean) {
    const request = await this.getIncomingRequestForPublisher(userId, requestId);

    if (request.status !== DetailRequestStatus.PUBLISHER_VIEWED_DETAIL) {
      throw new BadRequestException('请先查看对方详细信息，再做拒绝动作');
    }

    const moderationResult = this.contentModerationService.ensureReviewed({
      operationType: 'reject_detail_request',
      riskConfirmed,
      fields: [{ field: 'reason', content: reason }],
    });

    request.status = DetailRequestStatus.REJECTED;
    request.rejectionReason = reason.trim();
    request.rejectedAt = new Date();
    await this.detailRequestRepository.save(request);

    await this.complianceLogService.recordPublishedContent({
      userId,
      userEmail: request.publisher.email,
      cardId: request.targetCard.id,
      cardPublicCode: request.targetCard.publicCode,
      operationType: 'reject_detail_request',
      riskReview: {
        reviewRequired: moderationResult.hasRisk,
        riskLevel: moderationResult.riskLevel,
        categories: moderationResult.categories,
        matchedTerms: moderationResult.matchedTerms,
        confirmedToPublish: Boolean(riskConfirmed),
        provider: moderationResult.provider,
      },
      contentSnapshot: {
        requestId: request.id,
        reason: request.rejectionReason,
      },
    });

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

    if (!request.targetCard?.owner) {
      throw new NotFoundException('目标卡片不存在或已删除');
    }

    if (request.requester.id !== userId) {
      throw new ForbiddenException('只有请求发起方可以发起联系方式交换');
    }

    if (
      request.status !== DetailRequestStatus.APPROVED_DETAIL_VISIBLE &&
      request.status !== DetailRequestStatus.CONTACT_EXCHANGED &&
      request.status !== DetailRequestStatus.REQUESTER_DECLINED_CONTACT
    ) {
      throw new BadRequestException('当前状态下不能交换联系方式');
    }

    if (request.requester.contactMethods.length === 0) {
      throw new BadRequestException('请先补充至少一种联系方式，再发起交换');
    }

    request.status = DetailRequestStatus.CONTACT_EXCHANGED;
    request.contactExchangedAt = request.contactExchangedAt ?? new Date();
    await this.detailRequestRepository.save(request);
    await this.rewardService.awardPoints(userId, RewardAction.MATCH_SUCCESS, `match-success:${request.id}:${request.requester.id}`, {
      requestId: request.id,
      cardId: request.targetCard.id,
      role: 'requester',
    });
    await this.rewardService.awardPoints(request.publisher.id, RewardAction.MATCH_SUCCESS, `match-success:${request.id}:${request.publisher.id}`, {
      requestId: request.id,
      cardId: request.targetCard.id,
      role: 'publisher',
    });

    return request.requester.id === userId ? this.toOutgoingRequestItem(request) : this.toIncomingRequestItem(request);
  }

  async markExchangeReviewing(userId: string, requestId: string) {
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

    if (!request.targetCard?.owner) {
      throw new NotFoundException('目标卡片不存在或已删除');
    }

    if (request.requester.id !== userId) {
      throw new ForbiddenException('只有请求发起方可以执行该操作');
    }

    if (
      request.status !== DetailRequestStatus.APPROVED_DETAIL_VISIBLE &&
      request.status !== DetailRequestStatus.REQUESTER_DECLINED_CONTACT &&
      request.status !== DetailRequestStatus.CONTACT_EXCHANGED
    ) {
      throw new BadRequestException('当前状态下不能标记该动作');
    }

    request.exchangeReviewingAt = request.exchangeReviewingAt ?? new Date();
    await this.detailRequestRepository.save(request);

    return this.toOutgoingRequestItem(request);
  }

  async declineContactByRequester(userId: string, requestId: string, reason: string, riskConfirmed?: boolean) {
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

    if (!request.targetCard?.owner) {
      throw new NotFoundException('目标卡片不存在或已删除');
    }

    if (request.requester.id !== userId) {
      throw new ForbiddenException('只有请求发起方可以执行该操作');
    }

    if (
      request.status !== DetailRequestStatus.APPROVED_DETAIL_VISIBLE &&
      request.status !== DetailRequestStatus.REQUESTER_DECLINED_CONTACT
    ) {
      throw new BadRequestException('当前状态下不能执行不想联系');
    }

    const moderationResult = this.contentModerationService.ensureReviewed({
      operationType: 'decline_contact_by_requester',
      riskConfirmed,
      fields: [{ field: 'reason', content: reason }],
    });

    request.status = DetailRequestStatus.REQUESTER_DECLINED_CONTACT;
    request.rejectionReason = reason.trim();
    request.exchangeReviewingAt = request.exchangeReviewingAt ?? new Date();
    request.requesterDeclinedContactAt = request.requesterDeclinedContactAt ?? new Date();
    await this.detailRequestRepository.save(request);

    await this.complianceLogService.recordPublishedContent({
      userId,
      userEmail: request.requester.email,
      cardId: request.targetCard.id,
      cardPublicCode: request.targetCard.publicCode,
      operationType: 'decline_contact_by_requester',
      riskReview: {
        reviewRequired: moderationResult.hasRisk,
        riskLevel: moderationResult.riskLevel,
        categories: moderationResult.categories,
        matchedTerms: moderationResult.matchedTerms,
        confirmedToPublish: Boolean(riskConfirmed),
        provider: moderationResult.provider,
      },
      contentSnapshot: {
        requestId: request.id,
        reason: request.rejectionReason,
      },
    });

    return this.toOutgoingRequestItem(request);
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

    if (!request.targetCard?.owner) {
      throw new NotFoundException('目标卡片不存在或已删除');
    }

    if (request.publisher.id !== userId) {
      throw new ForbiddenException('你无权处理该请求');
    }

    return request;
  }

  private buildRequesterDetailSnapshot(user: User, input: RequestDetailSnapshotInput): DetailProfileSnapshot {
    const base = user.detailedProfile || {};
    const intro = input.intro?.trim() || base.intro || '';
    const education = input.education?.trim() || base.education || '';
    const experience = input.experience?.trim() || base.experience || '';
    const projectDetailFromInput = input.projectDetail?.trim() || '';
    const expertProjectDetail = projectDetailFromInput || base.expertProjectDetail || base.projectDetail || '';
    const developerProjectExperience = projectDetailFromInput || base.developerProjectExperience || base.projectDetail || '';

    return {
      intro,
      education,
      experience,
      expertProjectDetail,
      developerProjectExperience,
      projectDetail: projectDetailFromInput || base.projectDetail || expertProjectDetail || developerProjectExperience || '',
    };
  }

  private buildUserDetailSnapshot(user: User): DetailProfileSnapshot {
    const base = user.detailedProfile || {};

    return {
      intro: base.intro || '',
      education: base.education || '',
      experience: base.experience || '',
      expertProjectDetail: base.expertProjectDetail || base.projectDetail || '',
      developerProjectExperience: base.developerProjectExperience || base.projectDetail || '',
      projectDetail: base.projectDetail || base.expertProjectDetail || base.developerProjectExperience || '',
    };
  }

  private resolveRequesterDetailSnapshot(request: DetailRequest) {
    return request.requesterDetailSnapshot || null;
  }

  private resolvePublisherDetailSnapshot(request: DetailRequest) {
    return request.publisherDetailSnapshot || null;
  }

  private toIncomingRequestItem(request: DetailRequest) {
    const detailViewed = Boolean(request.publisherViewedRequesterDetailAt);
    const approved =
      request.status === DetailRequestStatus.APPROVED_DETAIL_VISIBLE ||
      request.status === DetailRequestStatus.CONTACT_EXCHANGED ||
      request.status === DetailRequestStatus.REQUESTER_DECLINED_CONTACT;
    const contactVisible = request.status === DetailRequestStatus.CONTACT_EXCHANGED;

    return {
      id: request.id,
      status: request.status,
      rejectionReason: request.rejectionReason,
      createdAt: request.createdAt,
      publisherViewedRequesterDetailAt: request.publisherViewedRequesterDetailAt,
      approvedAt: request.approvedAt,
      rejectedAt: request.rejectedAt,
      contactExchangedAt: request.contactExchangedAt,
      exchangeReviewingAt: request.exchangeReviewingAt,
      requesterDeclinedContactAt: request.requesterDeclinedContactAt,
      targetCard: this.toTargetCard(request),
      publisherOpenedDetail: approved ? this.resolvePublisherDetailSnapshot(request) : null,
      requester: {
        id: request.requester.id,
        displayName: request.requester.displayName,
        detailedProfile: detailViewed || approved ? this.resolveRequesterDetailSnapshot(request) : null,
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
    const detailVisible =
      request.status === DetailRequestStatus.APPROVED_DETAIL_VISIBLE ||
      request.status === DetailRequestStatus.CONTACT_EXCHANGED ||
      request.status === DetailRequestStatus.REQUESTER_DECLINED_CONTACT;
    const contactVisible = request.status === DetailRequestStatus.CONTACT_EXCHANGED;

    return {
      id: request.id,
      status: request.status,
      rejectionReason: request.rejectionReason,
      createdAt: request.createdAt,
      publisherViewedRequesterDetailAt: request.publisherViewedRequesterDetailAt,
      approvedAt: request.approvedAt,
      rejectedAt: request.rejectedAt,
      contactExchangedAt: request.contactExchangedAt,
      exchangeReviewingAt: request.exchangeReviewingAt,
      requesterDeclinedContactAt: request.requesterDeclinedContactAt,
      targetCard: this.toTargetCard(request),
      requesterSubmittedDetail: this.resolveRequesterDetailSnapshot(request),
      publisher: {
        id: request.publisher.id,
        displayName: request.publisher.displayName,
        detailedProfile: detailVisible ? this.resolvePublisherDetailSnapshot(request) : null,
        contactMethods: contactVisible ? this.toContactMethods(request.publisher.contactMethods) : [],
      },
      actions: {
        canExchangeContact:
          request.status === DetailRequestStatus.APPROVED_DETAIL_VISIBLE ||
          request.status === DetailRequestStatus.REQUESTER_DECLINED_CONTACT,
      },
    };
  }

  private toTargetCard(request: DetailRequest) {
    return {
      id: request.targetCard.publicCode,
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

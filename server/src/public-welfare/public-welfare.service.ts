import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceLogService } from '../compliance/compliance-log.service';
import { ContentModerationService } from '../compliance/content-moderation.service';
import { CreatePublicWelfareMessageDto } from './dto/create-public-welfare-message.dto';
import { PublicWelfareMessage } from './public-welfare-message.entity';

@Injectable()
export class PublicWelfareService {
  constructor(
    private readonly complianceLogService: ComplianceLogService,
    private readonly contentModerationService: ContentModerationService,
    @InjectRepository(PublicWelfareMessage)
    private readonly publicWelfareMessageRepository: Repository<PublicWelfareMessage>,
  ) {}

  async createMessage(body: CreatePublicWelfareMessageDto) {
    const moderationResult = this.contentModerationService.ensureReviewed({
      operationType: 'public_welfare_message',
      riskConfirmed: body.riskConfirmed,
      fields: [
        { field: 'name', content: body.name },
        { field: 'contact', content: body.contact },
        { field: 'message', content: body.message },
      ],
    });

    const message = this.publicWelfareMessageRepository.create({
      name: body.name?.trim() || null,
      contact: body.contact.trim(),
      message: body.message.trim(),
    });

    const savedMessage = await this.publicWelfareMessageRepository.save(message);

    await this.complianceLogService.recordPublishedContent({
      userId: '00000000-0000-0000-0000-000000000000',
      userEmail: null,
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
        messageId: savedMessage.id,
        name: savedMessage.name,
        contact: savedMessage.contact,
        message: savedMessage.message,
      },
    });

    return {
      id: savedMessage.id,
      createdAt: savedMessage.createdAt.toISOString(),
    };
  }
}

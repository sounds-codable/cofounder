import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { OperationAuditLog } from './operation-audit-log.entity';
import { PublishedContentRecord } from './published-content-record.entity';

type ClientFingerprint = {
  userAgent: string | null;
  secChUa: string | null;
  secChUaPlatform: string | null;
  secChUaMobile: string | null;
  acceptLanguage: string | null;
  deviceId: string | null;
};

type RequestAuditPayload = {
  user: User | null;
  operationType: string;
  requestMethod: string;
  requestPath: string;
  statusCode: number | null;
  durationMs: number;
  operationAt: Date;
  sourceAddress: string | null;
  sourcePort: number | null;
  destinationAddress: string | null;
  destinationPort: number | null;
  clientFingerprint: ClientFingerprint;
  metadata?: Record<string, unknown>;
};

type PublishedRecordPayload = {
  userId: string;
  userEmail?: string | null;
  cardId?: string | null;
  cardSlug?: string | null;
  operationType: string;
  operationAt?: Date;
  riskReview?: {
    reviewRequired: boolean;
    riskLevel: 'none' | 'medium' | 'high';
    categories: string[];
    matchedTerms: string[];
    confirmedToPublish: boolean;
    provider: string;
  };
  contentSnapshot: Record<string, unknown>;
};

@Injectable()
export class ComplianceLogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ComplianceLogService.name);
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(OperationAuditLog)
    private readonly operationAuditLogRepository: Repository<OperationAuditLog>,
    @InjectRepository(PublishedContentRecord)
    private readonly publishedContentRecordRepository: Repository<PublishedContentRecord>,
  ) {}

  async onModuleInit() {
    await this.cleanupExpiredRecords();
    this.startCleanupTimer();
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  async recordOperationAudit(payload: RequestAuditPayload) {
    const record = this.operationAuditLogRepository.create({
      userId: payload.user?.id ?? null,
      userEmail: payload.user?.email ?? null,
      operationType: payload.operationType,
      requestMethod: payload.requestMethod,
      requestPath: payload.requestPath,
      statusCode: payload.statusCode,
      success: payload.statusCode !== null && payload.statusCode < 400,
      durationMs: Math.max(Math.round(payload.durationMs), 0),
      operationAt: payload.operationAt,
      sourceAddress: payload.sourceAddress,
      sourcePort: payload.sourcePort,
      destinationAddress: payload.destinationAddress,
      destinationPort: payload.destinationPort,
      clientHardware: this.buildClientHardware(payload.clientFingerprint),
      clientFingerprint: payload.clientFingerprint,
      metadata: payload.metadata ?? null,
    });

    await this.operationAuditLogRepository.save(record);
  }

  async recordPublishedContent(payload: PublishedRecordPayload) {
    const record = this.publishedContentRecordRepository.create({
      userId: payload.userId,
      userEmail: payload.userEmail ?? null,
      cardId: payload.cardId ?? null,
      cardSlug: payload.cardSlug ?? null,
      operationType: payload.operationType,
      reviewRequired: payload.riskReview?.reviewRequired ?? false,
      riskLevel: payload.riskReview?.riskLevel ?? null,
      riskCategories: payload.riskReview?.categories ?? null,
      riskMatchedTerms: payload.riskReview?.matchedTerms ?? null,
      confirmedToPublish: payload.riskReview?.confirmedToPublish ?? false,
      moderationProvider: payload.riskReview?.provider ?? null,
      operationAt: payload.operationAt ?? new Date(),
      contentSnapshot: payload.contentSnapshot,
    });

    await this.publishedContentRecordRepository.save(record);
  }

  async cleanupExpiredRecords() {
    const now = Date.now();
    const auditRetentionDays = this.getPositiveIntegerConfig('AUDIT_LOG_RETENTION_DAYS', 180);
    const publishedRetentionDays = this.getPositiveIntegerConfig('PUBLISHED_RECORD_RETENTION_DAYS', 365);
    const auditBefore = new Date(now - auditRetentionDays * 24 * 60 * 60 * 1000);
    const publishBefore = new Date(now - publishedRetentionDays * 24 * 60 * 60 * 1000);

    const [auditCleanupResult, publishCleanupResult] = await Promise.all([
      this.operationAuditLogRepository
        .createQueryBuilder()
        .delete()
        .where('operationAt < :auditBefore', { auditBefore: auditBefore.toISOString() })
        .execute(),
      this.publishedContentRecordRepository
        .createQueryBuilder()
        .delete()
        .where('operationAt < :publishBefore', { publishBefore: publishBefore.toISOString() })
        .execute(),
    ]);

    const deletedAuditCount = Number(auditCleanupResult.affected ?? 0);
    const deletedPublishCount = Number(publishCleanupResult.affected ?? 0);

    if (deletedAuditCount > 0 || deletedPublishCount > 0) {
      this.logger.log(`Compliance cleanup finished: audit=${deletedAuditCount}, published=${deletedPublishCount}`);
    }
  }

  private startCleanupTimer() {
    const intervalMinutes = this.getPositiveIntegerConfig('COMPLIANCE_CLEANUP_INTERVAL_MINUTES', 360);

    this.cleanupTimer = setInterval(() => {
      void this.cleanupExpiredRecords().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Compliance cleanup failed: ${message}`);
      });
    }, intervalMinutes * 60 * 1000);

    this.cleanupTimer.unref();
  }

  private buildClientHardware(fingerprint: ClientFingerprint) {
    const segments = [fingerprint.userAgent, fingerprint.secChUaPlatform, fingerprint.secChUaMobile].filter(Boolean);
    return segments.length > 0 ? segments.join(' | ') : null;
  }

  private getPositiveIntegerConfig(key: string, fallback: number) {
    const value = Number(this.configService.get<string>(key, String(fallback)));

    if (!Number.isFinite(value) || value <= 0) {
      return fallback;
    }

    return Math.floor(value);
  }
}

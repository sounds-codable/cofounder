import { BadRequestException, Injectable } from '@nestjs/common';
import { highRiskCategories, RiskCategory } from '../config/content-moderation.config';
import { CnLexiconFastscanService } from './cn-lexicon-fastscan.service';

type BadWordsFilterLike = {
  isProfane: (value: string) => boolean;
};

const fallbackProfanityPattern = /\b(fuck|shit|bitch|asshole|motherfucker|dick|cunt|bastard|slut|whore|nigger|faggot)\b/i;

type ModerationField = {
  field: string;
  content: string | null | undefined;
};

type DetectedRisk = {
  category: RiskCategory;
  matchedTerm: string;
  field: string;
};

export type ModerationResult = {
  hasRisk: boolean;
  riskLevel: 'none' | 'medium' | 'high';
  categories: RiskCategory[];
  matchedTerms: string[];
  hitFields: string[];
  detections: DetectedRisk[];
  provider: string;
};

type EnsureReviewInput = {
  fields: ModerationField[];
  riskConfirmed?: boolean;
  operationType: string;
};

@Injectable()
export class ContentModerationService {
  private badWordsFilter: BadWordsFilterLike = {
    isProfane: (value) => fallbackProfanityPattern.test(value),
  };

  constructor(private readonly cnLexiconFastscanService: CnLexiconFastscanService) {
    void this.loadBadWordsFilter();
  }

  private async loadBadWordsFilter() {
    try {
      const badWordsModule = (await import('bad-words')) as { Filter?: new () => { isProfane: (value: string) => boolean } };

      if (!badWordsModule.Filter) {
        return;
      }

      const runtimeFilter = new badWordsModule.Filter();
      this.badWordsFilter = {
        isProfane: (value) => runtimeFilter.isProfane(value) || fallbackProfanityPattern.test(value),
      };
    } catch {
      this.badWordsFilter = {
        isProfane: (value) => fallbackProfanityPattern.test(value),
      };
    }
  }

  evaluate(fields: ModerationField[]): ModerationResult {
    const detections: DetectedRisk[] = [];

    for (const field of fields) {
      const rawContent = typeof field.content === 'string' ? field.content.trim() : '';

      if (!rawContent) {
        continue;
      }

      const normalized = rawContent.toLowerCase();

      if (this.badWordsFilter.isProfane(normalized)) {
        detections.push({
          category: 'abuse',
          matchedTerm: '[bad-words]profanity',
          field: field.field,
        });
      }

      const lexiconMatches = this.cnLexiconFastscanService.search(normalized);

      lexiconMatches.forEach(([, matchedTerm]) => {
        const categories = this.cnLexiconFastscanService.getCategoriesByTerm(matchedTerm);

        categories.forEach((category) => {
          detections.push({
            category,
            matchedTerm,
            field: field.field,
          });
        });
      });
    }

    const categories = Array.from(new Set(detections.map((item) => item.category)));
    const matchedTerms = Array.from(new Set(detections.map((item) => item.matchedTerm)));
    const hitFields = Array.from(new Set(detections.map((item) => item.field)));
    const hasHighRisk = categories.some((category) => highRiskCategories.has(category));

    return {
      hasRisk: detections.length > 0,
      riskLevel: detections.length === 0 ? 'none' : hasHighRisk ? 'high' : 'medium',
      categories,
      matchedTerms,
      hitFields,
      detections,
      provider: this.cnLexiconFastscanService.getProviderLabel(),
    };
  }

  ensureReviewed(input: EnsureReviewInput) {
    const result = this.evaluate(input.fields);

    if (!result.hasRisk) {
      return result;
    }

    if (!input.riskConfirmed) {
      throw new BadRequestException({
        code: 'RISK_REVIEW_REQUIRED',
        message: '检测到潜在违法有害或高风险内容，请确认后再发布。',
        riskReview: {
          operationType: input.operationType,
          riskLevel: result.riskLevel,
          categories: result.categories,
          matchedTerms: result.matchedTerms,
          hitFields: result.hitFields,
          provider: result.provider,
        },
      });
    }

    return result;
  }
}

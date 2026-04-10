import { BadRequestException, Injectable } from '@nestjs/common';
import { Filter } from 'bad-words';

type ModerationField = {
  field: string;
  content: string | null | undefined;
};

type RiskCategory = 'pornography' | 'politics' | 'violence' | 'fraud' | 'illegal_goods' | 'abuse';

type RiskRule = {
  category: RiskCategory;
  terms: string[];
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

const highRiskCategories = new Set<RiskCategory>(['pornography', 'politics', 'violence', 'illegal_goods']);

const riskRules: RiskRule[] = [
  {
    category: 'pornography',
    terms: ['约炮', '开房', '成人视频', '淫秽', '裸聊', '性交易', '嫖娼', '援交', '色图'],
  },
  {
    category: 'politics',
    terms: ['反共', '颠覆国家政权', '分裂国家', '台独', '港独', '疆独', '藏独', '煽动颠覆', '推翻政府'],
  },
  {
    category: 'violence',
    terms: ['爆炸物', '炸药', '枪支', '刀战', '恐袭', '制作炸弹', '屠杀', '报复社会'],
  },
  {
    category: 'fraud',
    terms: ['刷单', '洗钱', '套现', '黑产', '网赌代理', '灰产', '诈骗教程', '骗贷'],
  },
  {
    category: 'illegal_goods',
    terms: ['冰毒', '海洛因', '毒品', '迷药', '违禁药', '枪支弹药', '身份证代办'],
  },
  {
    category: 'abuse',
    terms: ['去死', '狗东西', '傻逼', '脑残', '废物', '滚开'],
  },
];

@Injectable()
export class ContentModerationService {
  private readonly englishFilter = new Filter({
    placeHolder: '*',
  });

  evaluate(fields: ModerationField[]): ModerationResult {
    const detections: DetectedRisk[] = [];

    for (const field of fields) {
      const rawContent = typeof field.content === 'string' ? field.content.trim() : '';

      if (!rawContent) {
        continue;
      }

      const normalized = rawContent.toLowerCase();

      if (this.englishFilter.isProfane(normalized)) {
        detections.push({
          category: 'abuse',
          matchedTerm: '[bad-words]profanity',
          field: field.field,
        });
      }

      riskRules.forEach((rule) => {
        rule.terms.forEach((term) => {
          if (normalized.includes(term.toLowerCase())) {
            detections.push({
              category: rule.category,
              matchedTerm: term,
              field: field.field,
            });
          }
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
      provider: 'bad-words+cn-rules-v1',
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

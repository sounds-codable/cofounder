export type RiskCategory = 'pornography' | 'politics' | 'violence' | 'fraud' | 'illegal_goods' | 'abuse';

export type RiskLexiconFile = {
  category: RiskCategory;
  relativePath: string;
  source: 'manual' | 'sensitive_lexicon';
};

export type SensitiveLexiconRemoteSource = {
  category: Exclude<RiskCategory, 'abuse'>;
  remoteUrl: string;
  targetRelativePath: string;
};

export const cnSensitiveLexiconSource = {
  name: 'konsheng/Sensitive-lexicon',
  repository: 'https://github.com/konsheng/Sensitive-lexicon',
};

export const highRiskCategories = new Set<RiskCategory>(['pornography', 'politics', 'violence', 'illegal_goods']);

export const riskLexiconFiles: RiskLexiconFile[] = [
  {
    category: 'pornography',
    relativePath: 'content-moderation-lexicon/manual/pornography.txt',
    source: 'manual',
  },
  {
    category: 'pornography',
    relativePath: 'content-moderation-lexicon/upstream/pornography.txt',
    source: 'sensitive_lexicon',
  },
  {
    category: 'politics',
    relativePath: 'content-moderation-lexicon/manual/politics.txt',
    source: 'manual',
  },
  {
    category: 'politics',
    relativePath: 'content-moderation-lexicon/upstream/politics.txt',
    source: 'sensitive_lexicon',
  },
  {
    category: 'violence',
    relativePath: 'content-moderation-lexicon/manual/violence.txt',
    source: 'manual',
  },
  {
    category: 'violence',
    relativePath: 'content-moderation-lexicon/upstream/violence.txt',
    source: 'sensitive_lexicon',
  },
  {
    category: 'fraud',
    relativePath: 'content-moderation-lexicon/manual/fraud.txt',
    source: 'manual',
  },
  {
    category: 'fraud',
    relativePath: 'content-moderation-lexicon/upstream/fraud.txt',
    source: 'sensitive_lexicon',
  },
  {
    category: 'illegal_goods',
    relativePath: 'content-moderation-lexicon/manual/illegal_goods.txt',
    source: 'manual',
  },
  {
    category: 'illegal_goods',
    relativePath: 'content-moderation-lexicon/upstream/illegal_goods.txt',
    source: 'sensitive_lexicon',
  },
  {
    category: 'abuse',
    relativePath: 'content-moderation-lexicon/manual/abuse.txt',
    source: 'manual',
  },
];

export const sensitiveLexiconRemoteSources: SensitiveLexiconRemoteSource[] = [
  {
    category: 'pornography',
    remoteUrl: 'https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/Vocabulary/色情词库.txt',
    targetRelativePath: 'content-moderation-lexicon/upstream/pornography.txt',
  },
  {
    category: 'politics',
    remoteUrl: 'https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/Vocabulary/政治类型.txt',
    targetRelativePath: 'content-moderation-lexicon/upstream/politics.txt',
  },
  {
    category: 'violence',
    remoteUrl: 'https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/Vocabulary/暴恐词库.txt',
    targetRelativePath: 'content-moderation-lexicon/upstream/violence.txt',
  },
  {
    category: 'fraud',
    remoteUrl: 'https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/Vocabulary/广告类型.txt',
    targetRelativePath: 'content-moderation-lexicon/upstream/fraud.txt',
  },
  {
    category: 'illegal_goods',
    remoteUrl: 'https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/Vocabulary/涉枪涉爆.txt',
    targetRelativePath: 'content-moderation-lexicon/upstream/illegal_goods.txt',
  },
];

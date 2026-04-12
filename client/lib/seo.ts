import type { Metadata } from 'next';
import { roleLabels, type PublicCard, type UserRole } from '@/lib/site-data';
import type { BlogPostDetail } from '@/lib/platform-api';

const defaultSiteUrl = 'https://cofounder.icu';
const siteName = '叩饭 Cofounder';
const defaultDescription = '叩饭 Cofounder 是行业专家与程序员双向授权协作平台。先公开基础信息，再逐步开放详细资料与联系方式，降低无效沟通，提高真实协作匹配质量。';
const defaultKeywords = ['叩饭', 'Cofounder', '找程序员合伙人', '找技术合伙人', '项目方找程序员', '程序员找项目', 'MVP', '双向授权协作'];

export function getSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim() || defaultSiteUrl;
  return value.replace(/\/$/, '');
}

export function buildAbsoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, `${getSiteUrl()}/`).toString();
}

function normalizeDescription(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized || defaultDescription;
}

export function buildPageMetadata({
  title,
  description,
  path = '/',
  keywords = [],
  type = 'website',
  publishedTime,
  modifiedTime,
}: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  const canonical = buildAbsoluteUrl(path);
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const normalizedDescription = normalizeDescription(description);

  return {
    title,
    description: normalizedDescription,
    keywords: Array.from(new Set([...defaultKeywords, ...keywords])),
    alternates: {
      canonical,
    },
    openGraph: {
      type,
      locale: 'zh_CN',
      url: canonical,
      title: fullTitle,
      description: normalizedDescription,
      siteName,
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: normalizedDescription,
    },
  };
}

export function getOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    alternateName: '叩饭',
    url: getSiteUrl(),
    description: defaultDescription,
    areaServed: 'CN',
    inLanguage: 'zh-CN',
  };
}

export function getWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    alternateName: '叩饭',
    url: getSiteUrl(),
    description: defaultDescription,
    inLanguage: 'zh-CN',
  };
}

export function getHowToJsonLd({
  name,
  description,
  totalTime,
  steps,
}: {
  name: string;
  description: string;
  totalTime?: string;
  steps: Array<{
    name: string;
    text: string;
  }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description: normalizeDescription(description),
    ...(totalTime ? { totalTime } : {}),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: normalizeDescription(step.text),
    })),
  };
}

export function getHomeHowToJsonLd() {
  return getHowToJsonLd({
    name: '叩饭 Cofounder 双向授权协作流程',
    description: '项目方与程序员先公开基础信息，再逐步开放详细资料与联系方式，减少无效沟通。',
    totalTime: 'P3D',
    steps: [
      {
        name: '公开基础信息',
        text: '项目方或程序员先公开最少必要信息，让对方快速判断是否值得进一步了解。',
      },
      {
        name: '先看详细资料再决定',
        text: '被申请方先查看申请者详细信息，再决定是否开放自己的更多详情。',
      },
      {
        name: '双方决定是否交换联系方式',
        text: '在看过更完整资料后，再决定是否交换联系方式并到站外继续沟通。',
      },
    ],
  });
}

export function getCollectionPageJsonLd({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: buildAbsoluteUrl(path),
    inLanguage: 'zh-CN',
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: getSiteUrl(),
    },
  };
}

export function getAboutPageJsonLd({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: title,
    description: normalizeDescription(description),
    url: buildAbsoluteUrl(path),
    inLanguage: 'zh-CN',
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: getSiteUrl(),
    },
  };
}

export function getFAQPageJsonLd(
  items: Array<{
    question: string;
    answer: string;
  }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'zh-CN',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: normalizeDescription(item.answer),
      },
    })),
  };
}

export function getBreadcrumbListJsonLd(
  items: Array<{
    name: string;
    path: string;
  }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.path),
    })),
  };
}

export function getItemListJsonLd({
  title,
  path,
  items,
}: {
  title: string;
  path: string;
  items: Array<{
    name: string;
    url: string;
    description?: string;
  }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    url: buildAbsoluteUrl(path),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: buildAbsoluteUrl(item.url),
      name: item.name,
      ...(item.description ? { description: normalizeDescription(item.description) } : {}),
    })),
  };
}

export function getBlogJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${siteName} Blog`,
    description: '叩饭 Cofounder 的产品迭代、社区活动、真实协作案例与阶段总结。',
    url: buildAbsoluteUrl('/blog'),
    inLanguage: 'zh-CN',
  };
}

export function getBlogPostingJsonLd(post: Pick<BlogPostDetail, 'title' | 'summary' | 'pathSegment' | 'authorDisplayName' | 'createdAt' | 'updatedAt'>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: normalizeDescription(post.summary),
    url: buildAbsoluteUrl(`/blog/${post.pathSegment}`),
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.authorDisplayName,
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: getSiteUrl(),
    },
    inLanguage: 'zh-CN',
    mainEntityOfPage: buildAbsoluteUrl(`/blog/${post.pathSegment}`),
  };
}

export function getCardKeywords(card: Pick<PublicCard, 'role' | 'headline' | 'city' | 'strengths'>) {
  return Array.from(
    new Set([
      roleLabels[card.role],
      card.city,
      ...card.strengths,
      ...(card.role === 'expert' ? ['项目找程序员', '找技术合伙人'] : ['程序员找项目', '技术合伙人'] ),
    ].filter(Boolean)),
  );
}

export function getCardDescription(card: Pick<PublicCard, 'role' | 'headline' | 'city' | 'basicSummary' | 'strengths'>) {
  const roleText = roleLabels[card.role as UserRole] || '协作卡片';
  const strengths = card.strengths.slice(0, 5).join('、');
  return normalizeDescription(`${roleText} · ${card.city}。${card.headline}。${card.basicSummary}${strengths ? ` 相关标签：${strengths}。` : ''}`);
}

export function getCardWebPageJsonLd(card: Pick<PublicCard, 'id' | 'role' | 'headline' | 'city' | 'basicSummary' | 'strengths'>, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: card.headline,
    description: getCardDescription(card),
    url: buildAbsoluteUrl(path),
    inLanguage: 'zh-CN',
    about: {
      '@type': 'Thing',
      name: roleLabels[card.role],
      description: card.basicSummary,
    },
    keywords: getCardKeywords(card).join(','),
  };
}

export function getCardProfileJsonLd(card: Pick<PublicCard, 'id' | 'role' | 'headline' | 'city' | 'basicSummary' | 'strengths'>, path: string) {
  const roleText = roleLabels[card.role as UserRole] || '协作卡片';

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: card.headline,
    description: getCardDescription(card),
    url: buildAbsoluteUrl(path),
    inLanguage: 'zh-CN',
    mainEntity: {
      '@type': 'Person',
      name: card.headline,
      description: `${roleText}：${card.basicSummary}`,
      homeLocation: {
        '@type': 'Place',
        name: card.city,
      },
      knowsAbout: card.strengths,
    },
  };
}

export function stringifyJsonLd(data: object) {
  return JSON.stringify(data, null, 0);
}

export const seoDefaults = {
  siteName,
  defaultDescription,
  defaultKeywords,
};

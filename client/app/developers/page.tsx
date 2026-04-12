import type { Metadata } from 'next';
import { DevelopersPageClient } from '@/components/developers-page-client';
import { getStaticCards } from '@/lib/card-route-data';
import { buildCardPathFromCard } from '@/lib/card-url';
import { buildPageMetadata, getBreadcrumbListJsonLd, getCollectionPageJsonLd, getFAQPageJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '程序员库',
  description: '浏览叩饭 Cofounder 上程序员公开展示的技术能力与项目经验，按双向授权流程逐步了解背景与合作意向。',
  path: '/developers',
  keywords: ['程序员找项目', '技术合伙人', '全栈程序员', '程序员合作', '程序员库'],
});

export default async function DevelopersPage() {
  const cards = (await getStaticCards()).filter((card) => card.role === 'developer');
  const jsonLd = [
    getCollectionPageJsonLd({
      title: '叩饭 Cofounder 程序员库',
      description: '浏览程序员公开展示的能力与项目经验，找到适合一起做 MVP 的技术合作者。',
      path: '/developers',
    }),
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '程序员库', path: '/developers' },
    ]),
    getFAQPageJsonLd([
      {
        question: '程序员库里的信息适合谁看？',
        answer: '适合有真实业务场景、希望寻找技术合作者的项目方，也适合想了解平台技术侧能力密度的潜在用户。',
      },
      {
        question: '程序员库会直接公开联系方式吗？',
        answer: '不会。平台遵循双向授权流程，先公开能力与经验，再在双方认可后逐步开放更多信息与联系方式。',
      },
    ]),
    getItemListJsonLd({
      title: '叩饭 Cofounder 程序员列表',
      path: '/developers',
      items: cards.map((card) => ({
        name: card.headline,
        url: buildCardPathFromCard(card),
        description: card.basicSummary,
      })),
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <DevelopersPageClient />
    </>
  );
}

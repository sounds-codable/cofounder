import type { Metadata } from 'next';
import { ProjectsPageClient } from '@/components/projects-page-client';
import { getStaticCards } from '@/lib/card-route-data';
import { buildCardPathFromCard } from '@/lib/card-url';
import { buildPageMetadata, getBreadcrumbListJsonLd, getCollectionPageJsonLd, getFAQPageJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '项目库',
  description: '浏览叩饭 Cofounder 上真实项目方发布的项目简介，先看基础信息，再按双向授权流程逐步了解详情并决定是否联系。',
  path: '/projects',
  keywords: ['项目找程序员', '真实创业项目', 'MVP 项目库', '技术合伙人项目', '项目方找程序员'],
});

export default async function ProjectsPage() {
  const cards = (await getStaticCards()).filter((card) => card.role === 'expert');
  const jsonLd = [
    getCollectionPageJsonLd({
      title: '叩饭 Cofounder 项目库',
      description: '浏览项目方公开发布的项目简介，找到值得深入了解并合作做 MVP 的真实项目。',
      path: '/projects',
    }),
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '项目库', path: '/projects' },
    ]),
    getFAQPageJsonLd([
      {
        question: '项目库里的内容适合谁看？',
        answer: '适合想寻找真实业务场景和真实合作机会的程序员，也适合想了解平台项目质量和方向的潜在用户。',
      },
      {
        question: '项目库里的项目信息会直接公开联系方式吗？',
        answer: '不会。平台先公开基础信息，双方按流程逐步查看详细资料，最后再决定是否交换联系方式。',
      },
    ]),
    getItemListJsonLd({
      title: '叩饭 Cofounder 项目列表',
      path: '/projects',
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
      <ProjectsPageClient />
    </>
  );
}

import type { Metadata } from 'next';
import { HomePageClient } from '@/components/home-page-client';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getHomeHowToJsonLd, getOrganizationJsonLd, getWebSiteJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '叩饭 Cofounder',
  description: '叩饭 Cofounder 帮助行业专家与程序员以双向授权方式找到协作对象：先公开基础信息，再逐步开放详细资料与联系方式，更适合真实做 MVP。',
  path: '/',
  keywords: ['AI 时代创业', '行业专家找程序员', '程序员找项目方', 'MVP 合作平台', '技术合伙人平台'],
});

export default function HomePage() {
  const jsonLd = [
    getOrganizationJsonLd(),
    getWebSiteJsonLd(),
    getHomeHowToJsonLd(),
    getBreadcrumbListJsonLd([{ name: '首页', path: '/' }]),
    getFAQPageJsonLd([
      {
        question: '叩饭 Cofounder 是什么？',
        answer: '叩饭 Cofounder 是一个让行业专家与程序员通过双向授权方式建立真实协作关系的平台。双方先公开基础信息，再逐步开放详细资料与联系方式。',
      },
      {
        question: '这个平台适合谁？',
        answer: '适合有真实业务场景、客户资源或行业经验的项目方，也适合希望找到真实需求、一起做 MVP 的程序员与技术合伙人。',
      },
      {
        question: '平台如何减少无效沟通？',
        answer: '平台采用先看基础信息、再看详细资料、最后再决定是否交换联系方式的流程，避免双方过早暴露隐私并降低无效匹配。',
      },
    ]),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <HomePageClient />
    </>
  );
}

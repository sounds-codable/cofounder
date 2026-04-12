import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { buildPageMetadata, getAboutPageJsonLd, getBreadcrumbListJsonLd, getFAQPageJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '公益',
  description: '了解叩饭 Cofounder 的公益协作定位，并通过公益留言参与共建、志愿支持或赞助支持。',
  path: '/public-welfare',
  keywords: ['公益协作社区', '共建社区', '志愿者招募', '叩饭 公益'],
});

export default function PublicWelfareLayout({ children }: Readonly<{ children: ReactNode }>) {
  const jsonLd = [
    getAboutPageJsonLd({
      title: '叩饭 Cofounder 公益页',
      description: '介绍叩饭 Cofounder 的公益定位、共建方式与留言入口。',
      path: '/public-welfare',
    }),
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '公益', path: '/public-welfare' },
    ]),
    getFAQPageJsonLd([
      {
        question: '叩饭 Cofounder 是收费平台吗？',
        answer: '当前公益页表达的平台定位是不设置收费门槛、不做中间抽成，并欢迎更多志愿者、共建者和支持者参与。',
      },
      {
        question: '公益页可以做什么？',
        answer: '可以通过留言表达支持、提出建议、申请共建、提供志愿帮助，或了解社区的公益定位与长期目标。',
      },
    ]),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      {children}
    </>
  );
}

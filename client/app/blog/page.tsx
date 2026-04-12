import type { Metadata } from 'next';
import { BlogPageClient } from '@/components/blog-page-client';
import { fetchBlogPosts } from '@/lib/platform-api';
import { buildPageMetadata, getBlogJsonLd, getBreadcrumbListJsonLd, getCollectionPageJsonLd, getFAQPageJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Blog',
  description: '叩饭 Cofounder Blog：持续更新产品迭代、社区活动、真实协作案例与阶段总结。',
  path: '/blog',
  keywords: ['创业博客', '产品迭代', '社区案例', '协作案例', 'Cofounder Blog'],
});

export default async function BlogPage() {
  let blogItems: Array<{ name: string; url: string; description?: string }> = [];

  try {
    const list = await fetchBlogPosts();
    blogItems = list.items.map((item) => ({
      name: item.title,
      url: `/blog/${item.pathSegment}`,
      description: item.summary,
    }));
  } catch {
    blogItems = [{ name: '叩饭 Cofounder Blog', url: '/blog', description: '产品迭代、社区活动、真实协作案例与阶段总结。' }];
  }

  const jsonLd = [
    getBlogJsonLd(),
    getCollectionPageJsonLd({
      title: '叩饭 Cofounder Blog',
      description: '叩饭 Cofounder 的产品迭代、社区活动、真实协作案例与阶段总结。',
      path: '/blog',
    }),
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: 'Blog', path: '/blog' },
    ]),
    getFAQPageJsonLd([
      {
        question: '叩饭 Blog 会发布什么内容？',
        answer: '主要发布产品迭代、社区活动、真实协作案例、阶段总结，以及与项目方和程序员合作相关的经验内容。',
      },
      {
        question: '为什么这些博客内容对找合作者有帮助？',
        answer: '这些内容能帮助潜在用户理解平台规则、合作流程、产品定位与真实案例，从而提高匹配质量与信任感。',
      },
    ]),
    getItemListJsonLd({
      title: '叩饭 Cofounder Blog 文章列表',
      path: '/blog',
      items: blogItems,
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <BlogPageClient />
    </>
  );
}

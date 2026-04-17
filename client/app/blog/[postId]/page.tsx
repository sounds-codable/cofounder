import type { Metadata } from 'next';
import { BlogDetailClient } from '@/components/blog-detail-client';
import { fetchBlogPostById } from '@/lib/platform-api';
import { buildPageMetadata, getBlogPostingJsonLd, getBreadcrumbListJsonLd, stringifyJsonLd } from '@/lib/seo';

type BlogDetailPageProps = {
  params: Promise<{
    postId: string;
  }>;
};

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { postId } = await params;

  try {
    const detail = await fetchBlogPostById(postId);
    return buildPageMetadata({
      title: detail.title,
      description: detail.summary,
      path: `/blog/${detail.pathSegment}`,
      keywords: [detail.authorDisplayName, '博客文章', '叩饭 Blog', '创业内容'],
      type: 'article',
      publishedTime: detail.createdAt,
      modifiedTime: detail.updatedAt,
    });
  } catch {
    return buildPageMetadata({
      title: '博客详情',
      description: '叩饭 Cofounder 博客文章详情页。',
      path: `/blog/${postId}`,
      keywords: ['博客详情', '叩饭 Blog'],
    });
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { postId } = await params;

  let jsonLd: object[] = [];

  try {
    const detail = await fetchBlogPostById(postId);
    jsonLd = [
      getBlogPostingJsonLd(detail),
      getBreadcrumbListJsonLd([
        { name: '首页', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: detail.title, path: `/blog/${detail.pathSegment}` },
      ]),
    ];
  } catch {
    jsonLd = [];
  }

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <BlogDetailClient postId={postId} />
    </>
  );
}

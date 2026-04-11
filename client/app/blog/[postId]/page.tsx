import { notFound } from 'next/navigation';
import { BlogDetailClient } from '@/components/blog-detail-client';
import { fetchBlogPosts } from '@/lib/platform-api';

export const dynamicParams = false;
export const dynamic = 'force-static';
const BLOG_PLACEHOLDER_POST_ID = '__placeholder__';

export async function generateStaticParams() {
  try {
    const list = await fetchBlogPosts();
    const params = list.items
      .map((item) => item.pathSegment)
      .filter((segment): segment is string => Boolean(segment))
      .map((postId) => ({ postId }));

    if (params.length > 0) {
      return params;
    }
  } catch {
    return [{ postId: BLOG_PLACEHOLDER_POST_ID }];
  }

  return [{ postId: BLOG_PLACEHOLDER_POST_ID }];
}

type BlogDetailPageProps = {
  params: Promise<{
    postId: string;
  }>;
};

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { postId } = await params;

  if (postId === BLOG_PLACEHOLDER_POST_ID) {
    notFound();
  }

  return <BlogDetailClient postId={postId} />;
}

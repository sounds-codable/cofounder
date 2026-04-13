import type { MetadataRoute } from 'next';
import { fetchBlogPosts } from '@/lib/platform-api';
import { buildAbsoluteUrl } from '@/lib/seo';
import { buildCardPathFromCard } from '@/lib/card-url';
import { getStaticCards } from '@/lib/card-route-data';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    {
      url: buildAbsoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: buildAbsoluteUrl('/projects'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: buildAbsoluteUrl('/developers'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: buildAbsoluteUrl('/blog'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: buildAbsoluteUrl('/origin'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: buildAbsoluteUrl('/public-welfare'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: buildAbsoluteUrl('/how-it-works'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/for-experts'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/for-developers'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/mvp-guide'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/find-technical-cofounder'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/find-real-startup-projects'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/ai-era-startup'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/developer-and-expert-collaboration'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/how-to-post-a-project'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/how-to-build-a-developer-profile'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/reduce-ineffective-communication'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/validate-demand-before-building'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/how-to-evaluate-project-fit'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/how-to-evaluate-developer-fit'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/what-is-a-good-mvp-project'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/why-not-just-use-recruitment-platforms'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  const cards = await getStaticCards();
  cards.forEach((card) => {
    routes.push({
      url: buildAbsoluteUrl(buildCardPathFromCard(card)),
      lastModified: card.updatedAt ? new Date(card.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  });

  try {
    const blogList = await fetchBlogPosts();
    blogList.items.forEach((post) => {
      routes.push({
        url: buildAbsoluteUrl(`/blog/${post.pathSegment}`),
        lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    });
  } catch {
    return routes;
  }

  return routes;
}

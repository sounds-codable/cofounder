import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CardDetailClient } from '@/components/card-detail-client';
import { buildCardPathFromCard, normalizeCardPublicCode } from '@/lib/card-url';
import { getStaticCards } from '@/lib/card-route-data';
import { buildPageMetadata, getBreadcrumbListJsonLd, getCardDescription, getCardKeywords, getCardProfileJsonLd, getCardWebPageJsonLd, stringifyJsonLd } from '@/lib/seo';

export async function generateStaticParams() {
  const cards = await getStaticCards();

  return cards.map((card) => {
    const path = buildCardPathFromCard(card);
    const segments = path.split('/').filter(Boolean);
    return {
      role: segments[0],
      slug: segments[1],
    };
  });
}

type CardDetailPageProps = {
  params: Promise<{
    role: string;
    slug: string;
  }>;
};

export async function generateMetadata({ params }: CardDetailPageProps): Promise<Metadata> {
  const { role, slug } = await params;
  const normalizedPublicCode = normalizeCardPublicCode(role);

  if (!normalizedPublicCode || !slug.trim()) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const cards = await getStaticCards();
  const matchedCard = cards.find((card) => card.id === normalizedPublicCode);

  if (!matchedCard) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return buildPageMetadata({
    title: matchedCard.headline,
    description: getCardDescription(matchedCard),
    path: buildCardPathFromCard(matchedCard),
    keywords: getCardKeywords(matchedCard),
    type: 'profile',
    modifiedTime: matchedCard.updatedAt,
  });
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { role, slug } = await params;
  const normalizedPublicCode = normalizeCardPublicCode(role);

  if (!normalizedPublicCode || !slug.trim()) {
    notFound();
  }

  const cards = await getStaticCards();
  const matchedCard = cards.find((card) => card.id === normalizedPublicCode);

  if (!matchedCard) {
    notFound();
  }

  const canonicalPath = buildCardPathFromCard(matchedCard);
  const listPath = matchedCard.role === 'expert' ? '/projects' : '/developers';
  const listName = matchedCard.role === 'expert' ? '项目库' : '程序员库';
  const jsonLd = [
    getCardWebPageJsonLd(matchedCard, canonicalPath),
    getCardProfileJsonLd(matchedCard, canonicalPath),
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: listName, path: listPath },
      { name: matchedCard.headline, path: canonicalPath },
    ]),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <CardDetailClient id={matchedCard.id} />
    </>
  );
}

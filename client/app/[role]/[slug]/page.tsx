import { notFound } from 'next/navigation';
import { CardDetailClient } from '@/components/card-detail-client';
import { buildCardPathFromCard, extractCardShortKey, parseRoleShort } from '@/lib/card-url';
import { getStaticCards } from '@/lib/card-route-data';

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

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { role, slug } = await params;
  const roleParsed = parseRoleShort(role);

  if (!roleParsed) {
    notFound();
  }

  const shortKey = extractCardShortKey(slug);

  if (!shortKey) {
    notFound();
  }

  const cards = await getStaticCards();
  const matchedCard = cards.find((card) => {
    if (card.role !== roleParsed) {
      return false;
    }

    const path = buildCardPathFromCard(card);
    const slugSegment = path.split('/').filter(Boolean)[1] || '';
    return extractCardShortKey(slugSegment) === shortKey;
  });

  if (!matchedCard) {
    notFound();
  }

  return <CardDetailClient id={matchedCard.id} />;
}

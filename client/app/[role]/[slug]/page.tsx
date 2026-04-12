import { notFound } from 'next/navigation';
import { CardDetailClient } from '@/components/card-detail-client';
import { buildCardPathFromCard, normalizeCardPublicCode } from '@/lib/card-url';
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
  const normalizedPublicCode = normalizeCardPublicCode(role);

  if (!normalizedPublicCode || !slug.trim()) {
    notFound();
  }

  const cards = await getStaticCards();
  const matchedCard = cards.find((card) => card.id === normalizedPublicCode);

  if (!matchedCard) {
    notFound();
  }

  return <CardDetailClient id={matchedCard.id} />;
}

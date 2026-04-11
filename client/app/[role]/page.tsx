import { notFound } from 'next/navigation';
import { CardDetailClient } from '@/components/card-detail-client';
import { buildCardShareCodeMap, isShareCodeSegment, parseShareCodeToIndex, resolveCardIdByShareCode } from '@/lib/card-url';
import { getStaticCards } from '@/lib/card-route-data';

type ShareCardPageProps = {
  params: Promise<{
    role: string;
  }>;
};

export async function generateStaticParams() {
  const cards = await getStaticCards();
  const shareCodeMap = buildCardShareCodeMap(cards);

  return Object.values(shareCodeMap)
    .sort((a, b) => (parseShareCodeToIndex(a) ?? Number.MAX_SAFE_INTEGER) - (parseShareCodeToIndex(b) ?? Number.MAX_SAFE_INTEGER))
    .map((role) => ({ role }));
}

export default async function ShareCardPage({ params }: ShareCardPageProps) {
  const { role } = await params;

  if (!isShareCodeSegment(role)) {
    notFound();
  }

  const cards = await getStaticCards();
  const cardId = resolveCardIdByShareCode(role, cards);

  if (!cardId) {
    notFound();
  }

  return <CardDetailClient id={cardId} />;
}

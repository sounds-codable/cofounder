import { notFound } from 'next/navigation';
import { CardDetailClient } from '@/components/card-detail-client';
import { compactCardPublicCode, normalizeCardPublicCode } from '@/lib/card-url';
import { getStaticCards } from '@/lib/card-route-data';

type ShareCardPageProps = {
  params: Promise<{
    role: string;
  }>;
};

export async function generateStaticParams() {
  const cards = await getStaticCards();

  return cards.map((card) => ({ role: compactCardPublicCode(card.id) }));
}

export default async function ShareCardPage({ params }: ShareCardPageProps) {
  const { role } = await params;
  const normalizedPublicCode = normalizeCardPublicCode(role);

  if (!normalizedPublicCode) {
    notFound();
  }

  return <CardDetailClient id={normalizedPublicCode} />;
}

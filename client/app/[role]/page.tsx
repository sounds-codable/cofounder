import { notFound } from 'next/navigation';
import { CardDetailClient } from '@/components/card-detail-client';
import { isCardPublicCode } from '@/lib/card-url';
import { getStaticCards } from '@/lib/card-route-data';

type ShareCardPageProps = {
  params: Promise<{
    role: string;
  }>;
};

export async function generateStaticParams() {
  const cards = await getStaticCards();

  return cards.map((card) => ({ role: card.id }));
}

export default async function ShareCardPage({ params }: ShareCardPageProps) {
  const { role } = await params;

  if (!isCardPublicCode(role)) {
    notFound();
  }

  return <CardDetailClient id={role} />;
}

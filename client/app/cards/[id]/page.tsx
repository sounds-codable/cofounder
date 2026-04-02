import { staticCardSlugs } from '@/lib/site-data';
import { CardDetailClient } from '@/components/card-detail-client';

type StaticCardItem = {
  id: string;
};

function getCardApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3010/api';
}

async function getStaticCardIds() {
  const ids = new Set(staticCardSlugs);

  try {
    const response = await fetch(`${getCardApiBaseUrl()}/platform/cards`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const cards = (await response.json()) as StaticCardItem[];
      cards.forEach((card) => {
        if (card.id) {
          ids.add(card.id);
        }
      });
    }
  } catch {
    return Array.from(ids);
  }

  return Array.from(ids);
}

export async function generateStaticParams() {
  const ids = await getStaticCardIds();

  return ids.map((id) => ({ id }));
}

type CardDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { id } = await params;

  return <CardDetailClient id={id} />;
}

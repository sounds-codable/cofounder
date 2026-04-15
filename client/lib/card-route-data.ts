import { fallbackPublicCards, type PublicCard } from '@/lib/site-data';

export type CardRouteItem = Pick<PublicCard, 'id' | 'role' | 'headline' | 'updatedAt' | 'titleSlug' | 'city' | 'basicSummary' | 'strengths'>;

function getCardApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3010/api';
}

export async function getStaticCards(): Promise<CardRouteItem[]> {
  const fallbackCards: CardRouteItem[] = fallbackPublicCards.map((card) => ({
    id: card.id,
    role: card.role,
    headline: card.headline,
    updatedAt: card.updatedAt,
    titleSlug: card.titleSlug,
    city: card.city,
    basicSummary: card.basicSummary,
    strengths: card.strengths,
  }));

  try {
    const response = await fetch(`${getCardApiBaseUrl()}/platform/cards`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const apiCards = (await response.json()) as CardRouteItem[];
      const validCards = apiCards.filter((card) => card.id && card.role && card.headline);
      return validCards;
    }
  } catch {
    if (process.env.NODE_ENV === 'production') {
      return [];
    }

    return fallbackCards;
  }

  if (process.env.NODE_ENV === 'production') {
    return [];
  }

  return fallbackCards;
}

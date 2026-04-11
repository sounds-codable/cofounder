import { fallbackPublicCards, type PublicCard } from '@/lib/site-data';

export type CardRouteItem = Pick<PublicCard, 'id' | 'role' | 'headline' | 'updatedAt'>;

function getCardApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3010/api';
}

export async function getStaticCards(): Promise<CardRouteItem[]> {
  const cards = new Map<string, CardRouteItem>();

  fallbackPublicCards.forEach((card) => {
    cards.set(card.id, {
      id: card.id,
      role: card.role,
      headline: card.headline,
      updatedAt: card.updatedAt,
    });
  });

  try {
    const response = await fetch(`${getCardApiBaseUrl()}/platform/cards`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const apiCards = (await response.json()) as CardRouteItem[];
      apiCards.forEach((card) => {
        if (card.id && card.role && card.headline) {
          cards.set(card.id, card);
        }
      });
    }
  } catch {
    return Array.from(cards.values());
  }

  return Array.from(cards.values());
}

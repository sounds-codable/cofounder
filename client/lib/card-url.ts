import type { PublicCard, UserRole } from '@/lib/site-data';

export type CardLinkPayload = {
  id: string;
  role: UserRole;
  headline: string;
  updatedAt?: string;
};

const maxReadableSegmentLength = 18;

export function buildReadableHeadlineSegment(headline: string) {
  const normalized = headline
    .trim()
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const clipped = [...normalized].slice(0, maxReadableSegmentLength).join('').replace(/-$/g, '');
  return clipped || 'card';
}

export function buildCardSlug(headline: string) {
  return buildReadableHeadlineSegment(headline);
}

export function buildCardPath({ id, role, headline }: CardLinkPayload) {
  const slug = buildCardSlug(headline);
  return slug ? `/${id}/${slug}` : `/${id}`;
}

export function buildCardPathFromCard(card: Pick<PublicCard, 'id' | 'role' | 'headline'>) {
  return buildCardPath({ id: card.id, role: card.role, headline: card.headline });
}

export function isCardPublicCode(value: string) {
  return /^[pd]-[012356789]{5}$/.test(value.trim());
}

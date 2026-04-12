import type { PublicCard, UserRole } from '@/lib/site-data';

export type CardLinkPayload = {
  id: string;
  role: UserRole;
  headline: string;
  updatedAt?: string;
};

const publicCodePattern = /^([pd])-?([012356789]{5})$/i;

export function buildReadableHeadlineSegment(headline: string) {
  const normalized = headline
    .trim()
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .replace(/[\\/%?#]+/g, '-')
    .replace(/[_\s]+/g, ' ')
    .replace(/-+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[\s-]+|[\s-]+$/g, '');

  return normalized || 'card';
}

export function buildCardSlug(headline: string) {
  return buildReadableHeadlineSegment(headline);
}

export function normalizeCardPublicCode(value: string) {
  const matched = value.trim().match(publicCodePattern);

  if (!matched) {
    return null;
  }

  const [, prefix, digits] = matched;
  return `${prefix.toLowerCase()}-${digits}`;
}

export function compactCardPublicCode(value: string) {
  const normalized = normalizeCardPublicCode(value);

  if (!normalized) {
    return value.trim();
  }

  return normalized.replace('-', '');
}

export function buildCardPath({ id, role, headline }: CardLinkPayload) {
  const slug = buildCardSlug(headline);
  const compactPublicCode = compactCardPublicCode(id);
  return slug ? `/${compactPublicCode}/${slug}` : `/${compactPublicCode}`;
}

export function buildCardPathFromCard(card: Pick<PublicCard, 'id' | 'role' | 'headline'>) {
  return buildCardPath({ id: card.id, role: card.role, headline: card.headline });
}

export function buildCardSharePath(publicCode: string) {
  return `/${compactCardPublicCode(publicCode)}`;
}

export function buildCardSharePathFromCard(card: Pick<PublicCard, 'id'>) {
  return buildCardSharePath(card.id);
}

export function isCardPublicCode(value: string) {
  return normalizeCardPublicCode(value) !== null;
}

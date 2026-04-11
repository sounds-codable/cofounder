import type { PublicCard, UserRole } from '@/lib/site-data';

export type CardLinkPayload = {
  id: string;
  role: UserRole;
  headline: string;
  updatedAt?: string;
};

export type ShareCodeCard = Pick<CardLinkPayload, 'id'> & {
  updatedAt?: string;
};

const roleToShort: Record<UserRole, 'p' | 'd'> = {
  expert: 'p',
  developer: 'd',
};

const shortToRole: Record<'p' | 'd', UserRole> = {
  p: 'expert',
  d: 'developer',
};

const shortKeyLength = 6;
const maxReadableSegmentLength = 18;
const shareCodeLength = 5;
const shareCodeDigits = ['0', '1', '2', '3', '5', '6', '7', '8', '9'] as const;
const shareCodeBase = shareCodeDigits.length;
const maxShareCodeCapacity = shareCodeBase ** shareCodeLength - 1;

export function getRoleShort(role: UserRole): 'p' | 'd' {
  return roleToShort[role];
}

export function parseRoleShort(value: string): UserRole | null {
  if (value !== 'p' && value !== 'd') {
    return null;
  }

  return shortToRole[value];
}

function hashToShortKey(input: string) {
  let hash = 2166136261;

  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  const normalized = (hash >>> 0).toString(36);
  return normalized.padStart(shortKeyLength, '0').slice(-shortKeyLength);
}

export function buildCardShortKey(cardId: string) {
  return hashToShortKey(cardId);
}

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

export function buildCardSlug(headline: string, cardId: string) {
  const readable = buildReadableHeadlineSegment(headline);
  const shortKey = buildCardShortKey(cardId);
  return `${readable}-${shortKey}`;
}

export function extractCardShortKey(slug: string) {
  const trimmed = slug.trim().replace(/\/+$/g, '');
  if (!trimmed) {
    return '';
  }

  const parts = trimmed.split('-').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : trimmed;
}

export function buildCardPath({ id, role, headline }: CardLinkPayload) {
  const roleShort = getRoleShort(role);
  const slug = buildCardSlug(headline, id);
  return `/${roleShort}/${slug}`;
}

export function buildCardPathFromCard(card: Pick<PublicCard, 'id' | 'role' | 'headline'>) {
  return buildCardPath({ id: card.id, role: card.role, headline: card.headline });
}

export function isShareCodeSegment(value: string) {
  return /^[012356789]{5}$/.test(value.trim());
}

function sortCardsForShareCode(cards: ShareCodeCard[]) {
  return [...cards].sort((a, b) => a.id.localeCompare(b.id));
}

function formatShareCode(index: number) {
  if (index < 0 || index > maxShareCodeCapacity - 1) {
    return '';
  }

  let value = index + 1;
  const chars = Array.from({ length: shareCodeLength }, () => '0');

  for (let position = shareCodeLength - 1; position >= 0; position -= 1) {
    const digitIndex = value % shareCodeBase;
    chars[position] = shareCodeDigits[digitIndex] || '0';
    value = Math.floor(value / shareCodeBase);
  }

  return chars.join('');
}

export function parseShareCodeToIndex(shareCode: string) {
  const normalized = shareCode.trim();

  if (!isShareCodeSegment(normalized)) {
    return null;
  }

  let value = 0;

  for (const char of normalized) {
    const digitIndex = shareCodeDigits.indexOf(char as (typeof shareCodeDigits)[number]);

    if (digitIndex < 0) {
      return null;
    }

    value = value * shareCodeBase + digitIndex;
  }

  if (value <= 0) {
    return null;
  }

  return value - 1;
}

export function buildPublicCardCode(role: UserRole, shareCode: string) {
  return `${getRoleShort(role)}-${shareCode}`;
}

export function buildCardShareCodeMap(cards: ShareCodeCard[]) {
  const map: Record<string, string> = {};
  const sortedCards = sortCardsForShareCode(cards);

  if (sortedCards.length > maxShareCodeCapacity) {
    return map;
  }

  sortedCards.forEach((card, index) => {
    const shareCode = formatShareCode(index);

    if (shareCode) {
      map[card.id] = shareCode;
    }
  });

  return map;
}

export function buildCardSharePath(cardId: string, cards: ShareCodeCard[]) {
  const code = buildCardShareCodeMap(cards)[cardId];
  return code ? `/${code}` : null;
}

export function resolveCardIdByShareCode(shareCode: string, cards: ShareCodeCard[]) {
  const sortedCards = sortCardsForShareCode(cards);
  const index = parseShareCodeToIndex(shareCode);

  if (index === null || index < 0 || index >= sortedCards.length) {
    return null;
  }

  return sortedCards[index]?.id || null;
}

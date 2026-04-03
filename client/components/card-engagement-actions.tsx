'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCardEngagement } from '@/lib/card-engagement';
import { useAuthState } from '@/lib/use-auth';

type CardEngagementActionsProps = {
  cardId: string;
};

export function CardEngagementActions({ cardId }: CardEngagementActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authenticated } = useAuthState();
  const { favorited, liked, toggleFavorite, toggleLike } = useCardEngagement(cardId);

  function ensureLogin(action: () => void) {
    if (!authenticated) {
      const nextPath = pathname || `/cards/${cardId}`;
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    action();
  }

  const favoriteTitle = authenticated ? (favorited ? '取消收藏' : '收藏') : '登录后可收藏';
  const likeTitle = authenticated ? (liked ? '取消点赞' : '点赞') : '登录后可点赞';

  return (
    <>
      <button
        aria-label={favoriteTitle}
        className={`icon-button icon-only ${favorited ? 'is-active' : ''}`}
        title={favoriteTitle}
        type="button"
        onClick={() => ensureLogin(toggleFavorite)}
      >
        <span aria-hidden="true" className="icon-symbol">
          {favorited ? '★' : '☆'}
        </span>
      </button>
      <button
        aria-label={likeTitle}
        className={`icon-button icon-only ${liked ? 'is-active' : ''}`}
        title={likeTitle}
        type="button"
        onClick={() => ensureLogin(toggleLike)}
      >
        <span aria-hidden="true" className="icon-symbol">
          {liked ? '♥' : '♡'}
        </span>
      </button>
    </>
  );
}

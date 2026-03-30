'use client';

import { useRouter } from 'next/navigation';
import { useCardEngagement } from '@/lib/card-engagement';
import { useAuthState } from '@/lib/use-auth';

type CardEngagementActionsProps = {
  cardId: string;
};

export function CardEngagementActions({ cardId }: CardEngagementActionsProps) {
  const router = useRouter();
  const { authenticated } = useAuthState();
  const { favorited, liked, toggleFavorite, toggleLike } = useCardEngagement(cardId);

  function ensureLogin(action: () => void) {
    if (!authenticated) {
      router.push(`/login?next=/cards/${cardId}`);
      return;
    }

    action();
  }

  return (
    <>
      <button className={`icon-button ${favorited ? 'is-active' : ''}`} type="button" onClick={() => ensureLogin(toggleFavorite)}>
        {favorited ? '已收藏' : '收藏'}
      </button>
      <button className={`icon-button ${liked ? 'is-active' : ''}`} type="button" onClick={() => ensureLogin(toggleLike)}>
        {liked ? '已点赞' : '点赞'}
      </button>
    </>
  );
}

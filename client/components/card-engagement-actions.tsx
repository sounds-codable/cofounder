'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Heart, Share2, Star } from 'lucide-react';
import { buildCardPathFromCard } from '@/lib/card-url';
import { useCardEngagement } from '@/lib/card-engagement';
import { type PublicCard } from '@/lib/site-data';
import { useAuthState } from '@/lib/use-auth';

type CardEngagementActionsProps = {
  card: Pick<PublicCard, 'id' | 'role' | 'headline'>;
  sharePath?: string | null;
};

export function CardEngagementActions({ card, sharePath }: CardEngagementActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authenticated } = useAuthState();
  const { favorited, liked, toggleFavorite, toggleLike } = useCardEngagement(card.id);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareText, setShareText] = useState('');
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [nativeShareMessage, setNativeShareMessage] = useState<string | null>(null);
  const cardPath = useMemo(() => buildCardPathFromCard(card), [card]);
  const resolvedSharePath = sharePath || cardPath;

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return resolvedSharePath;
    }

    const url = new URL(resolvedSharePath, window.location.origin);
    url.protocol = 'https:';
    return url.toString();
  }, [resolvedSharePath]);

  const defaultShareText = useMemo(() => `刚在叩饭（Cofounder）看到一个项目，在找技术合伙人。这项目靠谱吗？\n${shareUrl}`, [shareUrl]);

  const canUseNativeShare = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return false;
    }

    return typeof navigator.share === 'function';
  }, []);

  function ensureLogin(action: () => void) {
    if (!authenticated) {
      const nextPath = pathname || cardPath;
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    action();
  }

  function handleOpenShareModal() {
    setShareText(defaultShareText);
    setCopyMessage(null);
    setNativeShareMessage(null);
    setShareModalOpen(true);
  }

  async function handleCopyShareText() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopyMessage('已复制，可直接粘贴到微信/小红书/微博/知乎。');
    } catch {
      setCopyMessage('复制失败，请手动选择文案后复制。');
    }
  }

  async function handleNativeShare() {
    if (!canUseNativeShare || typeof navigator === 'undefined') {
      return;
    }

    try {
      await navigator.share({
        title: '叩饭 Cofounder',
        text: shareText,
        url: shareUrl,
      });
      setNativeShareMessage('已唤起系统分享面板。');
    } catch {
      setNativeShareMessage('未完成系统分享，可继续复制文案转发。');
    }
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
        <Star aria-hidden="true" className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
      </button>
      <button
        aria-label={likeTitle}
        className={`icon-button icon-only ${liked ? 'is-active' : ''}`}
        title={likeTitle}
        type="button"
        onClick={() => ensureLogin(toggleLike)}
      >
        <Heart aria-hidden="true" className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
      </button>
      <button aria-label="转发" className="icon-button icon-only" title="转发" type="button" onClick={handleOpenShareModal}>
        <Share2 aria-hidden="true" className="h-4 w-4" />
      </button>

      {shareModalOpen ? (
        <div aria-label="分享卡片" aria-modal="true" className="fixed inset-0 z-[80] overflow-y-auto p-4" role="dialog">
          <button
            aria-label="关闭转发弹框"
            className="fixed inset-0 bg-foreground/30"
            type="button"
            onClick={() => {
              setShareModalOpen(false);
            }}
          />
          <div className="relative z-10 flex min-h-full items-start justify-center py-2 md:items-center">
            <section className="w-full max-w-lg space-y-4 rounded-2xl border border-border/70 bg-card/96 p-5 shadow-[0_18px_42px_rgba(79,108,163,0.24)] backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold text-foreground">分享</h2>
                <button
                  aria-label="关闭转发弹框"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-lg leading-none text-muted-foreground hover:bg-accent"
                  type="button"
                  onClick={() => {
                    setShareModalOpen(false);
                  }}
                >
                  ×
                </button>
              </div>

              <p className="text-sm text-muted-foreground">来分享吧！让更多人知道这个有趣的项目和叩饭（Cofounder），越多人看到，越能帮助更多人匹配到合适的Cofounder。</p>

              <label className="grid gap-2 text-sm font-medium text-foreground" htmlFor={`share-text-${card.id}`}>
                分享文案（供参考）
                <textarea
                  className="min-h-[140px] rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  id={`share-text-${card.id}`}
                  value={shareText}
                  onChange={(event) => {
                    setShareText(event.target.value);
                    if (copyMessage) {
                      setCopyMessage(null);
                    }
                    if (nativeShareMessage) {
                      setNativeShareMessage(null);
                    }
                  }}
                />
              </label>

              <p className="text-xs text-muted-foreground break-all">分享链接：{shareUrl}</p>

              <div className="flex flex-wrap gap-2">
                {canUseNativeShare ? (
                  <button className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent" type="button" onClick={() => void handleNativeShare()}>
                    系统分享
                  </button>
                ) : null}
                <button className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent" type="button" onClick={() => void handleCopyShareText()}>
                  复制文案
                </button>
                <button
                  className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-muted-foreground hover:bg-accent"
                  type="button"
                  onClick={() => {
                    setShareText(defaultShareText);
                    setCopyMessage(null);
                    setNativeShareMessage(null);
                  }}
                >
                  重置文案
                </button>
              </div>

              {nativeShareMessage ? <p className="text-sm text-muted-foreground">{nativeShareMessage}</p> : null}
              {copyMessage ? <p className="text-sm text-muted-foreground">{copyMessage}</p> : null}
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}

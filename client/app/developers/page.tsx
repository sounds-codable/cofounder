'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CardPublishForm } from '@/components/card-publish-form';
import { PublicCardGrid } from '@/components/public-card-grid';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCardEngagementState } from '@/lib/card-engagement';
import { fetchCards, fetchMyRequests } from '@/lib/platform-api';
import { fallbackPublicCards, type PublicCard } from '@/lib/site-data';
import { useAuthState } from '@/lib/use-auth';

type RequestCardMeta = {
  status: string;
  createdAt: string;
  publisherViewedRequesterDetailAt?: string | null;
  detailPreview: PublicCard['detailPreview'] | null;
};

function parseFilters(value: string | null) {
  if (!value) {
    return [];
  }

  return Array.from(new Set(value.split(',').map((item) => item.trim()).filter(Boolean)));
}

function toTimestamp(updatedAt?: string) {
  if (!updatedAt) {
    return 0;
  }

  const timestamp = new Date(updatedAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function DevelopersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authenticated, profile } = useAuthState();
  const engagement = useCardEngagementState();
  const [cards, setCards] = useState(fallbackPublicCards.filter((card) => card.role === 'developer'));
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [requestMetaByCardId, setRequestMetaByCardId] = useState<Record<string, RequestCardMeta>>({});
  const view = searchParams.get('view') || 'all';
  const activeCities = useMemo(() => parseFilters(searchParams.get('cities')), [searchParams]);
  const activeTags = useMemo(() => parseFilters(searchParams.get('tags')), [searchParams]);
  const activeOwners = useMemo(() => parseFilters(searchParams.get('owners')), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadRequests() {
      if (!authenticated) {
        if (!cancelled) {
          setRequestMetaByCardId({});
        }
        return;
      }

      try {
        const requestCenter = await fetchMyRequests();

        if (cancelled) {
          return;
        }

        const latestByCard: Record<string, RequestCardMeta & { createdAtNumber: number }> = {};

        requestCenter.outgoing.forEach((request) => {
          const createdAt = new Date(request.createdAt).getTime();
          const current = latestByCard[request.targetCard.id];

          if (!current || createdAt > current.createdAtNumber) {
            latestByCard[request.targetCard.id] = {
              status: request.status,
              createdAt: request.createdAt,
              publisherViewedRequesterDetailAt: request.publisherViewedRequesterDetailAt,
              detailPreview: profile?.user.detailedProfile ?? null,
              createdAtNumber: createdAt,
            };
          }
        });

        setRequestMetaByCardId(
          Object.entries(latestByCard).reduce<Record<string, RequestCardMeta>>((acc, [cardId, value]) => {
            acc[cardId] = {
              status: value.status,
              createdAt: value.createdAt,
              publisherViewedRequesterDetailAt: value.publisherViewedRequesterDetailAt,
              detailPreview: value.detailPreview,
            };
            return acc;
          }, {})
        );
      } catch {
        if (!cancelled) {
          setRequestMetaByCardId({});
        }
      }
    }

    void loadRequests();

    return () => {
      cancelled = true;
    };
  }, [authenticated, profile]);

  useEffect(() => {
    let cancelled = false;

    async function loadCards() {
      const nextCards = await fetchCards('developer');

      if (!cancelled) {
        setCards(nextCards);
      }
    }

    void loadCards();

    return () => {
      cancelled = true;
    };
  }, []);

  const sortedCards = useMemo(() => [...cards].sort((a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt)), [cards]);

  useEffect(() => {
    if (!publishModalOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPublishModalOpen(false);
      }
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [publishModalOpen]);

  function handleCreateDeveloperSuccess() {
    setPublishModalOpen(false);
    void fetchCards('developer').then((nextCards) => {
      setCards(nextCards);
    });
  }

  function updateFilters(nextCities: string[], nextTags: string[], nextOwners: string[]) {
    const next = new URLSearchParams(searchParams.toString());

    if (nextCities.length > 0) {
      next.set('cities', nextCities.join(','));
    } else {
      next.delete('cities');
    }

    if (nextTags.length > 0) {
      next.set('tags', nextTags.join(','));
    } else {
      next.delete('tags');
    }

    if (nextOwners.length > 0) {
      next.set('owners', nextOwners.join(','));
    } else {
      next.delete('owners');
    }

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function addCityFilter(city: string) {
    if (activeCities.includes(city)) {
      return;
    }

    updateFilters([...activeCities, city], activeTags, activeOwners);
  }

  function addTagFilter(tag: string) {
    if (activeTags.includes(tag)) {
      return;
    }

    updateFilters(activeCities, [...activeTags, tag], activeOwners);
  }

  function addOwnerFilter(ownerName: string) {
    if (activeOwners.includes(ownerName)) {
      return;
    }

    updateFilters(activeCities, activeTags, [...activeOwners, ownerName]);
  }

  function removeCityFilter(city: string) {
    updateFilters(activeCities.filter((item) => item !== city), activeTags, activeOwners);
  }

  function removeTagFilter(tag: string) {
    updateFilters(activeCities, activeTags.filter((item) => item !== tag), activeOwners);
  }

  function removeOwnerFilter(ownerName: string) {
    updateFilters(activeCities, activeTags, activeOwners.filter((item) => item !== ownerName));
  }

  let visibleCards = sortedCards;

  if (view === 'favorited') {
    if (!authenticated) {
      visibleCards = [];
    } else {
      const favoriteIds = new Set(Object.keys(engagement.favorites));
      visibleCards = sortedCards.filter((card) => favoriteIds.has(card.id));
    }
  } else if (view === 'liked') {
    if (!authenticated) {
      visibleCards = [];
    } else {
      const likeIds = new Set(Object.keys(engagement.likes));
      visibleCards = sortedCards.filter((card) => likeIds.has(card.id));
    }
  }

  if (activeCities.length > 0) {
    const citySet = new Set(activeCities);
    visibleCards = visibleCards.filter((card) => citySet.has(card.city));
  }

  if (activeTags.length > 0) {
    const tagSet = new Set(activeTags);
    visibleCards = visibleCards.filter((card) => card.strengths.some((tag) => tagSet.has(tag)));
  }

  if (activeOwners.length > 0) {
    const ownerSet = new Set(activeOwners);
    visibleCards = visibleCards.filter((card) => ownerSet.has(card.ownerName?.trim() || ''));
  }

  visibleCards = [...visibleCards].sort((a, b) => {
    const aRequested = Boolean(requestMetaByCardId[a.id]);
    const bRequested = Boolean(requestMetaByCardId[b.id]);

    if (aRequested !== bRequested) {
      return aRequested ? -1 : 1;
    }

    return toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt);
  });

  const hasFilters = activeCities.length > 0 || activeTags.length > 0 || activeOwners.length > 0;
  const hasScopedView = view !== 'all';

  return (
    <div className="relative mx-auto w-full max-w-6xl space-y-5 overflow-visible px-4 py-6 md:px-6 md:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_0%_0%,rgba(19,191,168,0.16),transparent_45%),radial-gradient(circle_at_100%_20%,rgba(76,200,255,0.14),transparent_45%)]" />
      {!authenticated ? (
        <section className="relative rounded-2xl border border-border/70 bg-card/85 p-5 shadow-[0_18px_44px_rgba(73,101,163,0.14)] backdrop-blur-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-secondary/80 px-3 py-1 text-xs text-secondary-foreground">程序员库</span>
              <h1 className="mt-3 text-2xl font-semibold leading-tight text-foreground md:text-3xl">技术能力先对齐，再推进下一步沟通。</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">展示你能做的技术方向和真实经验，项目方会先看到你的基础信息，再决定是否开放项目详情与深入沟通。</p>
            </div>
            <div className="w-full md:w-auto md:min-w-[220px]">
              <Link className={buttonVariants({ size: 'lg' })} href="/login?next=%2Fdevelopers">
                立即登记程序员信息
              </Link>
            </div>
          </div>
        </section>
      ) : null}
      {authenticated ? (
        <div className="relative flex flex-wrap gap-2">
          <button className={buttonVariants()} type="button" onClick={() => setPublishModalOpen(true)}>
            登记程序员
          </button>
          <Link className={buttonVariants({ variant: 'outline' })} href="/developers?view=favorited">
            我收藏的程序员
          </Link>
          <Link className={buttonVariants({ variant: 'outline' })} href="/developers?view=liked">
            我点赞的程序员
          </Link>
        </div>
      ) : null}
      {publishModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[120] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="发布程序员卡片">
              <button className="absolute inset-0 bg-foreground/30" onClick={() => setPublishModalOpen(false)} type="button" aria-label="关闭弹框" />
              <section className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-2xl border border-border/70 bg-card/96 p-4 shadow-[0_18px_42px_rgba(79,108,163,0.24)] [touch-action:pan-y] [-webkit-overflow-scrolling:touch] backdrop-blur-md md:p-5">
                <CardPublishForm
                  role="developer"
                  loginNext="/developers"
                  successRedirect="/developers"
                  presentation="modal"
                  onCancel={() => setPublishModalOpen(false)}
                  onSuccess={handleCreateDeveloperSuccess}
                />
              </section>
            </div>,
            document.body
          )
        : null}
      {hasFilters || hasScopedView ? (
        <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 backdrop-blur-sm">
          <Link className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'px-0')} href="/developers">
            ← 返回查看全部程序员
          </Link>
        </div>
      ) : null}
      {hasFilters || hasScopedView ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2 backdrop-blur-sm" role="status">
          <span className="text-sm text-muted-foreground">筛选状态：</span>
          {hasScopedView ? <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">视图：{view === 'favorited' ? '我收藏的程序员' : '我点赞的程序员'}</span> : null}
          {activeCities.map((city) => (
            <button className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent" key={`city-${city}`} type="button" onClick={() => removeCityFilter(city)}>
              城市「{city}」×
            </button>
          ))}
          {activeTags.map((tag) => (
            <button className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent" key={`tag-${tag}`} type="button" onClick={() => removeTagFilter(tag)}>
              标签「{tag}」×
            </button>
          ))}
          {activeOwners.map((ownerName) => (
            <button className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent" key={`owner-${ownerName}`} type="button" onClick={() => removeOwnerFilter(ownerName)}>
              发布者「{ownerName}」×
            </button>
          ))}
          {hasFilters ? (
            <button className={buttonVariants({ variant: 'ghost', size: 'sm' })} type="button" onClick={() => updateFilters([], [], [])}>
              清空筛选
            </button>
          ) : null}
        </div>
      ) : null}
      {visibleCards.length > 0 ? (
        <PublicCardGrid
          cards={visibleCards}
          activeCities={activeCities}
          activeTags={activeTags}
          activeOwners={activeOwners}
          requestMetaByCardId={requestMetaByCardId}
          onCityFilter={addCityFilter}
          onTagFilter={addTagFilter}
          onOwnerFilter={addOwnerFilter}
          subjectLabel="程序员"
        />
      ) : (
        <Card className="border-border/70 bg-card/82 shadow-[0_14px_36px_rgba(73,101,163,0.14)]">
          <CardHeader>
            <CardTitle>当前还没有内容</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">你可以先登记程序员信息，或者在公开列表里收藏、点赞感兴趣的程序员。</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DevelopersPage() {
  return (
    <Suspense fallback={null}>
      <DevelopersPageContent />
    </Suspense>
  );
}

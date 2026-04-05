'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { PublicCardGrid } from '@/components/public-card-grid';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCardEngagementState } from '@/lib/card-engagement';
import { fetchCards } from '@/lib/platform-api';
import { fallbackPublicCards } from '@/lib/site-data';
import { useAuthState } from '@/lib/use-auth';

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

function ProjectsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authenticated, profile } = useAuthState();
  const engagement = useCardEngagementState();
  const [cards, setCards] = useState(fallbackPublicCards.filter((card) => card.role === 'expert'));
  const view = searchParams.get('view') || 'all';
  const activeCities = useMemo(() => parseFilters(searchParams.get('cities')), [searchParams]);
  const activeTags = useMemo(() => parseFilters(searchParams.get('tags')), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadCards() {
      const nextCards = await fetchCards('expert');

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

  function updateFilters(nextCities: string[], nextTags: string[]) {
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

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function addCityFilter(city: string) {
    if (activeCities.includes(city)) {
      return;
    }

    updateFilters([...activeCities, city], activeTags);
  }

  function addTagFilter(tag: string) {
    if (activeTags.includes(tag)) {
      return;
    }

    updateFilters(activeCities, [...activeTags, tag]);
  }

  function removeCityFilter(city: string) {
    updateFilters(activeCities.filter((item) => item !== city), activeTags);
  }

  function removeTagFilter(tag: string) {
    updateFilters(activeCities, activeTags.filter((item) => item !== tag));
  }

  let visibleCards = sortedCards;

  if (view === 'created') {
    visibleCards = !authenticated || profile?.user.role !== 'expert' || !profile.card?.id ? [] : sortedCards.filter((card) => card.id === profile.card?.id);
  } else if (view === 'favorited') {
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

  const addProjectHref = authenticated ? '/onboarding/basic?role=expert' : '/login?next=/onboarding/basic%3Frole%3Dexpert';
  const hasFilters = activeCities.length > 0 || activeTags.length > 0;
  const hasScopedView = view !== 'all';

  return (
    <div className="relative mx-auto w-full max-w-6xl space-y-5 overflow-hidden px-4 py-6 md:px-6 md:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_0%_0%,rgba(124,141,255,0.18),transparent_45%),radial-gradient(circle_at_100%_20%,rgba(87,217,197,0.16),transparent_45%)]" />
      <section className="relative rounded-2xl border border-border/70 bg-card/85 p-5 shadow-[0_18px_44px_rgba(73,101,163,0.14)] backdrop-blur-sm">
        <span className="inline-flex rounded-full bg-secondary/80 px-3 py-1 text-xs text-secondary-foreground">项目库</span>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-foreground md:text-3xl">真实场景先公开，合作筛选再深入。</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">先看基础信息，再按城市与标签做筛选，最后决定是否发起进一步了解。</p>
      </section>
      {authenticated ? (
        <div className="relative flex flex-wrap gap-2">
          <Link className={buttonVariants()} href={addProjectHref}>
            添加项目
          </Link>
          <Link className={buttonVariants({ variant: 'outline' })} href="/projects?view=created">
            我创建的项目
          </Link>
          <Link className={buttonVariants({ variant: 'outline' })} href="/projects?view=favorited">
            我收藏的项目
          </Link>
          <Link className={buttonVariants({ variant: 'outline' })} href="/projects?view=liked">
            我点赞的项目
          </Link>
        </div>
      ) : null}
      {hasFilters || hasScopedView ? (
        <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 backdrop-blur-sm">
          <Link className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'px-0')} href="/projects">
            ← 返回查看全部项目
          </Link>
        </div>
      ) : null}
      {hasFilters || hasScopedView ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2 backdrop-blur-sm" role="status">
          <span className="text-sm text-muted-foreground">筛选状态：</span>
          {hasScopedView ? (
            <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">视图：{view === 'created' ? '我创建的项目' : view === 'favorited' ? '我收藏的项目' : '我点赞的项目'}</span>
          ) : null}
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
          {hasFilters ? (
            <button className={buttonVariants({ variant: 'ghost', size: 'sm' })} type="button" onClick={() => updateFilters([], [])}>
              清空筛选
            </button>
          ) : null}
        </div>
      ) : null}
      {visibleCards.length > 0 ? (
        <PublicCardGrid cards={visibleCards} activeCities={activeCities} activeTags={activeTags} onCityFilter={addCityFilter} onTagFilter={addTagFilter} subjectLabel="项目" />
      ) : (
        <Card className="border-border/70 bg-card/82 shadow-[0_14px_36px_rgba(73,101,163,0.14)]">
          <CardHeader>
            <CardTitle>当前还没有内容</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">你可以先添加项目，或者在公开列表里收藏、点赞感兴趣的项目。</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={null}>
      <ProjectsPageContent />
    </Suspense>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { PublicCardGrid } from '@/components/public-card-grid';
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

function toTimestamp(createdAt?: string) {
  if (!createdAt) {
    return 0;
  }

  const timestamp = new Date(createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function DevelopersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authenticated } = useAuthState();
  const engagement = useCardEngagementState();
  const [cards, setCards] = useState(fallbackPublicCards.filter((card) => card.role === 'developer'));
  const view = searchParams.get('view') || 'all';
  const activeCities = useMemo(() => parseFilters(searchParams.get('cities')), [searchParams]);
  const activeTags = useMemo(() => parseFilters(searchParams.get('tags')), [searchParams]);

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

  const sortedCards = useMemo(() => [...cards].sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt)), [cards]);

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

  const addDeveloperHref = authenticated ? '/onboarding/basic?role=developer' : '/login?next=/onboarding/basic%3Frole%3Ddeveloper';
  const hasFilters = activeCities.length > 0 || activeTags.length > 0;
  const hasScopedView = view !== 'all';

  return (
    <div className="site-shell page-section page-stack">
      {authenticated ? (
        <div className="section-action-row">
          <Link className="primary-button" href={addDeveloperHref}>
            登记程序员
          </Link>
          <Link className="ghost-button" href="/developers?view=favorited">
            我收藏的程序员
          </Link>
          <Link className="ghost-button" href="/developers?view=liked">
            我点赞的程序员
          </Link>
        </div>
      ) : null}
      {hasFilters || hasScopedView ? (
        <div className="filter-nav-bar">
          <Link className="filter-back-link" href="/developers">
            ← 返回查看全部程序员
          </Link>
        </div>
      ) : null}
      {hasFilters || hasScopedView ? (
        <div className="filter-summary" role="status">
          <span className="filter-summary-label">筛选状态：</span>
          {hasScopedView ? <span className="filter-chip is-static">视图：{view === 'favorited' ? '我收藏的程序员' : '我点赞的程序员'}</span> : null}
          {activeCities.map((city) => (
            <button className="filter-chip" key={`city-${city}`} type="button" onClick={() => removeCityFilter(city)}>
              城市「{city}」×
            </button>
          ))}
          {activeTags.map((tag) => (
            <button className="filter-chip" key={`tag-${tag}`} type="button" onClick={() => removeTagFilter(tag)}>
              标签「{tag}」×
            </button>
          ))}
          {hasFilters ? (
            <button className="filter-clear-button" type="button" onClick={() => updateFilters([], [])}>
              清空筛选
            </button>
          ) : null}
        </div>
      ) : null}
      {visibleCards.length > 0 ? (
        <PublicCardGrid cards={visibleCards} activeCities={activeCities} activeTags={activeTags} onCityFilter={addCityFilter} onTagFilter={addTagFilter} subjectLabel="程序员" />
      ) : (
        <section className="detail-card empty-state-card"><h2>当前还没有内容</h2><p>你可以先登记程序员信息，或者在公开列表里收藏、点赞感兴趣的程序员。</p></section>
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

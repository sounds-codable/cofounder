'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { InfoDisclosure } from '@/components/info-disclosure';
import { PublicCardGrid } from '@/components/public-card-grid';
import { SectionHeading } from '@/components/section-heading';
import { useCardEngagementState } from '@/lib/card-engagement';
import { fetchCards } from '@/lib/platform-api';
import { fallbackPublicCards } from '@/lib/site-data';
import { useAuthState } from '@/lib/use-auth';

function ProjectsPageContent() {
  const searchParams = useSearchParams();
  const { authenticated, profile } = useAuthState();
  const engagement = useCardEngagementState();
  const [cards, setCards] = useState(fallbackPublicCards.filter((card) => card.role === 'expert'));
  const view = searchParams.get('view') || 'all';

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

  let visibleCards = cards;

  if (view === 'created') {
    visibleCards = !authenticated || profile?.user.role !== 'expert' || !profile.card?.id ? [] : cards.filter((card) => card.id === profile.card?.id);
  } else if (view === 'favorited') {
    const favoriteIds = new Set(Object.keys(engagement.favorites));
    visibleCards = cards.filter((card) => favoriteIds.has(card.id));
  } else if (view === 'liked') {
    const likeIds = new Set(Object.keys(engagement.likes));
    visibleCards = cards.filter((card) => likeIds.has(card.id));
  }

  const heading =
    view === 'created'
      ? {
          eyebrow: '我的项目',
          title: '这里集中展示你已创建并公开的项目卡片。',
          description: '后续可以继续扩展为多项目管理、收藏与点赞汇总。',
        }
      : view === 'favorited'
        ? {
            eyebrow: '我收藏的项目',
            title: '把你标记过的项目集中收起来，方便后续继续判断。',
            description: '当前基于本地登录设备记录收藏状态。',
          }
        : view === 'liked'
          ? {
              eyebrow: '我点赞的项目',
              title: '这里展示你已经点过赞的项目。',
              description: '点赞列表适合作为轻量意向池，后续可继续完善。',
            }
          : {
              eyebrow: '项目方列表',
              title: '先看项目方公开卡片，找到你真正想进一步了解的方向。',
              description: '这里先展示项目的公开基础信息，方便你快速浏览与筛选。',
            };

  const addProjectHref = authenticated ? '/onboarding/basic?role=expert' : '/login?next=/onboarding/basic%3Frole%3Dexpert';

  return (
    <div className="site-shell page-section page-stack">
      <SectionHeading
        eyebrow={heading.eyebrow}
        title={heading.title}
        description={heading.description}
      >
        <InfoDisclosure title="这页能看到什么" compact>
          <p>你现在看到的是公开基础信息。</p>
          <p>想继续收藏、点赞或申请了解详情时，再进入下一步即可。</p>
        </InfoDisclosure>
      </SectionHeading>
      <div className="section-action-row">
        <Link className="primary-button" href={addProjectHref}>
          添加项目
        </Link>
        <Link className="ghost-button" href="/projects?view=created">
          我创建的项目
        </Link>
        <Link className="ghost-button" href="/projects?view=favorited">
          我收藏的项目
        </Link>
        <Link className="ghost-button" href="/projects?view=liked">
          我点赞的项目
        </Link>
      </div>
      {visibleCards.length > 0 ? <PublicCardGrid cards={visibleCards} /> : <section className="detail-card empty-state-card"><h2>当前还没有内容</h2><p>你可以先添加项目，或者在公开列表里收藏、点赞感兴趣的项目。</p></section>}
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

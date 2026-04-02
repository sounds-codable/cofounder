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

function DevelopersPageContent() {
  const searchParams = useSearchParams();
  const { authenticated } = useAuthState();
  const engagement = useCardEngagementState();
  const [cards, setCards] = useState(fallbackPublicCards.filter((card) => card.role === 'developer'));
  const view = searchParams.get('view') || 'all';

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

  let visibleCards = cards;

  if (view === 'favorited') {
    const favoriteIds = new Set(Object.keys(engagement.favorites));
    visibleCards = cards.filter((card) => favoriteIds.has(card.id));
  } else if (view === 'liked') {
    const likeIds = new Set(Object.keys(engagement.likes));
    visibleCards = cards.filter((card) => likeIds.has(card.id));
  }

  const heading =
    view === 'favorited'
      ? {
          eyebrow: '我收藏的程序员',
          title: '这里展示你收藏过的程序员，方便后续继续跟进。',
          description: '当前收藏状态基于本地登录设备记录。',
        }
      : view === 'liked'
        ? {
            eyebrow: '我点赞的程序员',
            title: '这里集中展示你点过赞的程序员公开卡片。',
            description: '后续可以继续扩展成更完整的人才池管理。',
          }
        : {
            eyebrow: '程序员列表',
            title: '先看程序员公开卡片，判断是否值得继续深入了解。',
            description: '这里展示的是合作判断最需要的公开基础信息，先帮助你快速找到合适的人。',
          };

  const addDeveloperHref = authenticated ? '/onboarding/basic?role=developer' : '/login?next=/onboarding/basic%3Frole%3Ddeveloper';

  return (
    <div className="site-shell page-section page-stack">
      <SectionHeading
        eyebrow={heading.eyebrow}
        title={heading.title}
        description={heading.description}
      >
        <InfoDisclosure title="这页能看到什么" compact>
          <p>这一页先展示技能、项目经历、偏好方向和所在城市。</p>
          <p>更完整的背景信息，会在后续授权步骤里逐步开放。</p>
        </InfoDisclosure>
      </SectionHeading>
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
      {visibleCards.length > 0 ? <PublicCardGrid cards={visibleCards} /> : <section className="detail-card empty-state-card"><h2>当前还没有内容</h2><p>你可以先登记程序员信息，或者在公开列表里收藏、点赞感兴趣的程序员。</p></section>}
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

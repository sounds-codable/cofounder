'use client';

import { useEffect, useState } from 'react';
import { InfoDisclosure } from '@/components/info-disclosure';
import { PublicCardGrid } from '@/components/public-card-grid';
import { SectionHeading } from '@/components/section-heading';
import { fetchCards } from '@/lib/platform-api';
import { fallbackPublicCards } from '@/lib/site-data';

export default function ProjectsPage() {
  const [cards, setCards] = useState(fallbackPublicCards.filter((card) => card.role === 'expert'));

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

  return (
    <div className="site-shell page-section page-stack">
      <SectionHeading
        eyebrow="项目方列表"
        title="先看项目方公开卡片，找到你真正想进一步了解的方向。"
        description="这里先展示项目的公开基础信息，方便你快速浏览与筛选。"
      >
        <InfoDisclosure title="这页能看到什么" compact>
          <p>你现在看到的是公开基础信息。</p>
          <p>想继续收藏、点赞或申请了解详情时，再进入下一步即可。</p>
        </InfoDisclosure>
      </SectionHeading>
      <PublicCardGrid cards={cards} />
    </div>
  );
}

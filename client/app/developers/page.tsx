'use client';

import { useEffect, useState } from 'react';
import { InfoDisclosure } from '@/components/info-disclosure';
import { PublicCardGrid } from '@/components/public-card-grid';
import { SectionHeading } from '@/components/section-heading';
import { fetchCards } from '@/lib/platform-api';
import { fallbackPublicCards } from '@/lib/site-data';

export default function DevelopersPage() {
  const [cards, setCards] = useState(fallbackPublicCards.filter((card) => card.role === 'developer'));

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

  return (
    <div className="site-shell page-section page-stack">
      <SectionHeading
        eyebrow="程序员列表"
        title="先看程序员公开卡片，判断是否值得继续深入了解。"
        description="这里展示的是合作判断最需要的公开基础信息，先帮助你快速找到合适的人。"
      >
        <InfoDisclosure title="这页能看到什么" compact>
          <p>这一页先展示技能、项目经历、偏好方向和所在城市。</p>
          <p>更完整的背景信息，会在后续授权步骤里逐步开放。</p>
        </InfoDisclosure>
      </SectionHeading>
      <PublicCardGrid cards={cards} />
    </div>
  );
}

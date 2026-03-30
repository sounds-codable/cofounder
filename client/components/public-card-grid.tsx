'use client';

import Link from 'next/link';
import { CardEngagementActions } from '@/components/card-engagement-actions';
import { InfoDisclosure } from '@/components/info-disclosure';
import { PublicCard, roleLabels } from '@/lib/site-data';

type PublicCardGridProps = {
  cards: PublicCard[];
};

export function PublicCardGrid({ cards }: PublicCardGridProps) {
  return (
    <div className="card-grid">
      {cards.map((card) => (
        <article className="listing-card" key={card.id}>
          <div className="card-meta-row">
            <span className="pill pill-role">{roleLabels[card.role]}</span>
            <span className="pill">{card.city}</span>
          </div>
          <h3>{card.headline}</h3>
          <p>{card.basicSummary}</p>
          <div className="tag-row">
            {card.strengths.map((strength) => (
              <span className="tag" key={strength}>
                {strength}
              </span>
            ))}
          </div>
          {card.optionalDirection ? <p className="optional-copy">偏好方向：{card.optionalDirection}</p> : null}
          <div className="card-action-row">
            <CardEngagementActions cardId={card.id} />
            <Link className="primary-button" href={`/cards/${card.id}`}>
              查看公开信息
            </Link>
          </div>
          <InfoDisclosure title="申请说明" compact>
            <p>进入卡片后，你可以再决定是否申请了解详情。</p>
            <p>联系方式不会在这一步直接展示。</p>
          </InfoDisclosure>
        </article>
      ))}
    </div>
  );
}

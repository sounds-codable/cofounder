'use client';

import Link from 'next/link';
import { CardEngagementActions } from '@/components/card-engagement-actions';
import { PublicCard, roleLabels } from '@/lib/site-data';

type PublicCardGridProps = {
  cards: PublicCard[];
  activeCities?: string[];
  activeTags?: string[];
  onCityFilter?: (city: string) => void;
  onTagFilter?: (tag: string) => void;
  subjectLabel?: '项目' | '程序员';
};

function formatPublishedAt(updatedAt?: string) {
  if (!updatedAt) {
    return '发布时间未知';
  }

  const date = new Date(updatedAt);

  if (Number.isNaN(date.getTime())) {
    return '发布时间未知';
  }

  return `发布于 ${date.toLocaleDateString('zh-CN')}`;
}

export function PublicCardGrid({
  cards,
  activeCities = [],
  activeTags = [],
  onCityFilter,
  onTagFilter,
  subjectLabel = '项目',
}: PublicCardGridProps) {
  const activeCitySet = new Set(activeCities);
  const activeTagSet = new Set(activeTags);

  return (
    <div className="card-grid">
      {cards.map((card) => (
        <article className="listing-card" key={card.id}>
          <div className="card-head">
            <div className="card-meta-row">
              <span className="pill pill-role">{roleLabels[card.role]}</span>
              <button
                aria-label={`点击可查看更多${card.city}的${subjectLabel}`}
                className={`pill filter-pill-button ${activeCitySet.has(card.city) ? 'is-active' : ''}`}
                data-tooltip={`点击可查看更多「${card.city}」的${subjectLabel}`}
                title={`点击可查看更多「${card.city}」的${subjectLabel}`}
                type="button"
                onClick={() => onCityFilter?.(card.city)}
              >
                {card.city}
              </button>
            </div>
          </div>
          <p className="card-id">{formatPublishedAt(card.updatedAt)}</p>
          <p className="card-id">编号：{card.id}</p>
          <h3>{card.headline}</h3>
          <p>{card.basicSummary}</p>
          <div className="tag-row">
            {card.strengths.map((strength) => (
              <button
                aria-label={`点击可查看更多${strength}相关${subjectLabel}`}
                className={`tag filter-tag-button ${activeTagSet.has(strength) ? 'is-active' : ''}`}
                data-tooltip={`点击可查看更多「${strength}」相关${subjectLabel}`}
                key={strength}
                title={`点击可查看更多「${strength}」相关${subjectLabel}`}
                type="button"
                onClick={() => onTagFilter?.(strength)}
              >
                {strength}
              </button>
            ))}
          </div>
          {card.optionalDirection ? <p className="optional-copy">偏好方向：{card.optionalDirection}</p> : null}
          <div className="card-engagement-row">
            <div className="card-engagement-icons">
              <CardEngagementActions cardId={card.id} />
            </div>
            <Link className="card-detail-link card-detail-link-inline" href={`/cards/${card.id}`}>
              查看详情
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

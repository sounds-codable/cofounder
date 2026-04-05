'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CardEngagementActions } from '@/components/card-engagement-actions';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  const activeCitySet = useMemo(() => new Set(activeCities), [activeCities]);
  const activeTagSet = useMemo(() => new Set(activeTags), [activeTags]);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <article className="group relative space-y-3 overflow-hidden rounded-2xl border border-border/70 bg-card/82 p-5 shadow-[0_14px_34px_rgba(83,110,161,0.14)] backdrop-blur-sm transition-all duration-[var(--motion-normal)] ease-[var(--motion-ease)] hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(83,110,161,0.2)]" key={card.id}>
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[var(--motion-normal)] ease-[var(--motion-ease)] group-hover:opacity-100 bg-[radial-gradient(circle_at_0%_0%,rgba(124,141,255,0.16),transparent_42%),radial-gradient(circle_at_100%_100%,rgba(87,217,197,0.16),transparent_40%)]" />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{roleLabels[card.role]}</span>
              <button
                aria-label={`点击可查看更多${card.city}的${subjectLabel}`}
                className={cn(
                  'inline-flex rounded-full border px-2.5 py-1 text-xs transition-colors duration-[var(--motion-fast)] ease-[var(--motion-ease)]',
                  activeCitySet.has(card.city)
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                data-tooltip={`点击可查看更多「${card.city}」的${subjectLabel}`}
                title={`点击可查看更多「${card.city}」的${subjectLabel}`}
                type="button"
                onClick={() => onCityFilter?.(card.city)}
              >
                {card.city}
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{formatPublishedAt(card.updatedAt)}</p>
          <p className="text-xs text-muted-foreground">编号：{card.id}</p>
          <h3 className="text-lg font-semibold leading-snug text-foreground">{card.headline}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{card.basicSummary}</p>
          <div className="flex flex-wrap gap-2">
            {card.strengths.map((strength) => (
              <button
                aria-label={`点击可查看更多${strength}相关${subjectLabel}`}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs transition-colors duration-[var(--motion-fast)] ease-[var(--motion-ease)]',
                  activeTagSet.has(strength)
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
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
          {card.optionalDirection ? <p className="text-sm text-muted-foreground">偏好方向：{card.optionalDirection}</p> : null}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CardEngagementActions cardId={card.id} />
            </div>
            <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'ml-auto')} href={`/cards/${card.id}`}>
              查看详情
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

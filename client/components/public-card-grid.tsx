'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CardEngagementActions } from '@/components/card-engagement-actions';
import { SmartTooltip } from '@/components/smart-tooltip';
import { buttonVariants } from '@/components/ui/button';
import { formatBeijingDateTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import { PublicCard, roleLabels } from '@/lib/site-data';

type RequestCardMeta = {
  status: string;
  createdAt: string;
  publisherViewedRequesterDetailAt?: string | null;
  detailPreview: PublicCard['detailPreview'] | null;
  incomingCount?: number;
};

type PublicCardGridProps = {
  cards: PublicCard[];
  activeCities?: string[];
  activeTags?: string[];
  activeOwners?: string[];
  requestMetaByCardId?: Record<string, RequestCardMeta>;
  onCityFilter?: (city: string) => void;
  onTagFilter?: (tag: string) => void;
  onOwnerFilter?: (ownerName: string) => void;
  subjectLabel?: '项目' | '程序员';
};

const requestStatusLabels: Record<string, string> = {
  approved_detail_visible: '已收到联系申请 - 待处理',
  contact_exchanged: '匹配成功！',
  pending_request: '已申请更多信息',
  publisher_viewed_detail: '已申请更多信息',
  requester_declined_contact: '不想联系',
  received_request: '当前状态：收到申请',
  rejected: '已拒绝',
};

function formatPublishedAt(updatedAt?: string) {
  return formatBeijingDateTime(updatedAt, '时间未知');
}

function getRequestStatusBadgeClass(status: string) {
  if (status === 'approved_detail_visible') {
    return 'border-sky-300/80 bg-sky-50/90 text-sky-800';
  }

  if (status === 'pending_request') {
    return 'border-amber-300/80 bg-amber-50/90 text-amber-800';
  }

  if (status === 'publisher_viewed_detail') {
    return 'border-emerald-300/80 bg-emerald-50/90 text-emerald-800';
  }

  if (status === 'contact_exchanged') {
    return 'border-cyan-300/80 bg-cyan-50/90 text-cyan-800';
  }

  if (status === 'rejected') {
    return 'border-rose-300/80 bg-rose-50/90 text-rose-800';
  }

  if (status === 'received_request') {
    return 'border-sky-300/80 bg-sky-50/90 text-sky-800';
  }

  return 'border-border/80 bg-background/88 text-foreground';
}

export function PublicCardGrid({
  cards,
  activeCities = [],
  activeTags = [],
  activeOwners = [],
  requestMetaByCardId = {},
  onCityFilter,
  onTagFilter,
  onOwnerFilter,
  subjectLabel = '项目',
}: PublicCardGridProps) {
  const activeCitySet = useMemo(() => new Set(activeCities), [activeCities]);
  const activeTagSet = useMemo(() => new Set(activeTags), [activeTags]);
  const activeOwnerSet = useMemo(() => new Set(activeOwners), [activeOwners]);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const requestMeta = requestMetaByCardId[card.id];
        const requestStatus = requestMeta?.status;
        const incomingCount = requestMeta?.incomingCount || 0;
        const requestStatusLabel = incomingCount > 0 ? `已收到 ${incomingCount} 条申请` : requestStatus ? requestStatusLabels[requestStatus] || requestStatus : '';
        const ownerName = card.ownerName?.trim() || '未知发布者';
        const ownerFilterable = ownerName !== '未知发布者';

        return (
          <article
            className={cn(
              'group relative flex h-full flex-col gap-3 overflow-visible rounded-2xl border border-border/70 bg-card/82 p-5 shadow-[0_14px_34px_rgba(83,110,161,0.14)] backdrop-blur-sm transition-all duration-[var(--motion-normal)] ease-[var(--motion-ease)] hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(83,110,161,0.2)]',
              requestStatus
                ? 'border-sky-300/70 bg-[linear-gradient(135deg,rgba(236,248,255,0.95)_0%,rgba(248,253,255,0.92)_100%)] shadow-[0_16px_36px_rgba(75,132,188,0.2)]'
                : undefined,
              requestStatus === 'pending_request' || requestStatus === 'publisher_viewed_detail'
                ? 'border-emerald-400/85 bg-[linear-gradient(145deg,rgba(232,252,246,0.98)_0%,rgba(213,248,238,0.96)_56%,rgba(241,254,250,0.98)_100%)] ring-1 ring-emerald-300/65 shadow-[0_18px_38px_rgba(11,138,106,0.2)]'
                : undefined,
              requestStatus === 'received_request'
                ? 'border-sky-400/85 bg-[linear-gradient(145deg,rgba(230,245,255,0.98)_0%,rgba(214,238,255,0.96)_56%,rgba(240,250,255,0.98)_100%)] ring-1 ring-sky-300/70 shadow-[0_18px_38px_rgba(39,123,186,0.22)]'
                : undefined,
            )}
            key={card.id}
          >
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[var(--motion-normal)] ease-[var(--motion-ease)] group-hover:opacity-100 bg-[radial-gradient(circle_at_0%_0%,rgba(19,191,168,0.16),transparent_42%),radial-gradient(circle_at_100%_100%,rgba(76,200,255,0.16),transparent_40%)]" />
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{roleLabels[card.role]}</span>
            <SmartTooltip content={`点击可查看更多「${card.city}」的${subjectLabel}`}>
              <button
                aria-label={`点击可查看更多${card.city}的${subjectLabel}`}
                className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                type="button"
                onClick={() => onCityFilter?.(card.city)}
              >
                {card.city}
              </button>
            </SmartTooltip>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>{formatPublishedAt(card.updatedAt)}</span>
            <span>by</span>
            {ownerFilterable ? (
              <SmartTooltip content={`点击可查看更多「${ownerName}」发布的${subjectLabel}`}>
                <button
                  aria-label={`点击可查看更多${ownerName}发布的${subjectLabel}`}
                  className={cn(
                    'inline-flex rounded-full border px-2 py-0.5 transition-colors duration-[var(--motion-fast)] ease-[var(--motion-ease)]',
                    activeOwnerSet.has(ownerName)
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  type="button"
                  onClick={() => onOwnerFilter?.(ownerName)}
                >
                  {ownerName}
                </button>
              </SmartTooltip>
            ) : (
              <span>{ownerName}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">编号：{card.id}</p>
          <h3
            className="text-lg font-semibold leading-snug text-foreground"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {card.headline}
          </h3>
          <p
            className="text-sm leading-6 text-muted-foreground"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {card.basicSummary}
          </p>
          <div className="flex flex-wrap gap-2">
            {card.strengths.map((strength) => (
              <SmartTooltip content={`点击可查看更多「${strength}」相关${subjectLabel}`} key={strength}>
                <button
                  aria-label={`点击可查看更多${strength}相关${subjectLabel}`}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs transition-colors duration-[var(--motion-fast)] ease-[var(--motion-ease)]',
                    activeTagSet.has(strength)
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  type="button"
                  onClick={() => onTagFilter?.(strength)}
                >
                  {strength}
                </button>
              </SmartTooltip>
            ))}
          </div>
          {card.optionalDirection ? (
            <p
              className="text-sm text-muted-foreground"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              偏好方向：{card.optionalDirection}
            </p>
          ) : (
            <div className="h-[22px]" />
          )}
          <div className="mt-auto flex min-h-10 items-end gap-3">
            <div className="flex items-center gap-2">
              <CardEngagementActions cardId={card.id} />
            </div>
            <div className="ml-auto flex flex-col items-end gap-2">
              {requestStatus ? (
                <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', incomingCount > 0 ? 'border-sky-300/80 bg-sky-50/90 text-sky-800' : getRequestStatusBadgeClass(requestStatus))}>
                  {requestStatusLabel}
                </span>
              ) : null}
              <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-9')} href={`/cards/${card.id}`}>
                查看详情
              </Link>
            </div>
          </div>
          </article>
        );
      })}
    </div>
  );
}

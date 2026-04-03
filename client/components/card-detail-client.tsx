'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CardEngagementActions } from '@/components/card-engagement-actions';
import { InfoDisclosure } from '@/components/info-disclosure';
import { createDetailRequest, extractErrorMessage, fetchCardById, type ContactMethod, type PlatformCardDetail } from '@/lib/platform-api';
import { fallbackPublicCards, roleLabels } from '@/lib/site-data';
import { useAuthState } from '@/lib/use-auth';

type CardDetailClientProps = {
  id: string;
};

const viewerStatusLabels: Record<string, string> = {
  approved_detail_visible: '已开放详细信息',
  contact_exchanged: '已交换联系方式',
  pending_request: '待对方处理',
  publisher_viewed_detail: '对方处理中',
  rejected: '已拒绝',
};

function formatPublishedAt(createdAt?: string) {
  if (!createdAt) {
    return '发布时间未知';
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return '发布时间未知';
  }

  return `发布于 ${date.toLocaleDateString('zh-CN')}`;
}

export function CardDetailClient({ id }: CardDetailClientProps) {
  const { authenticated, profile } = useAuthState();
  const fallbackCard = useMemo(() => fallbackPublicCards.find((item) => item.id === id) ?? null, [id]);
  const [card, setCard] = useState<PlatformCardDetail | null>(
    fallbackCard
      ? {
          ...fallbackCard,
          viewerState: null,
        }
      : null,
  );
  const [loading, setLoading] = useState(!fallbackCard);
  const [message, setMessage] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCard() {
      setLoading(!fallbackCard);

      const nextCard = await fetchCardById(id);

      if (cancelled) {
        return;
      }

      setCard(nextCard);
      setLoading(false);
    }

    void loadCard();

    return () => {
      cancelled = true;
    };
  }, [fallbackCard, id]);

  async function handleCreateRequest() {
    setSubmittingRequest(true);
    setMessage(null);

    try {
      await createDetailRequest(id);
      const nextCard = await fetchCardById(id);
      setCard(nextCard);
      setMessage('已成功发起了解详情请求，接下来等待发布者先查看并处理。');
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setSubmittingRequest(false);
    }
  }

  if (loading && !card) {
    return (
      <div className="site-shell page-section page-stack">
        <section className="detail-card">
          <h1>正在加载资料…</h1>
          <p>请稍候。</p>
        </section>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="site-shell page-section page-stack">
        <section className="detail-card">
          <h1>未找到该卡片</h1>
          <p>这张公开卡片暂时不可查看。</p>
          <Link className="primary-button" href="/projects">
            返回公开列表
          </Link>
        </section>
      </div>
    );
  }

  const detailVisible = Boolean(card.viewerState?.detailVisible && card.viewerState.revealedDetail);
  const statusLabel = card.viewerState ? viewerStatusLabels[card.viewerState.status] || card.viewerState.status : null;
  const backToListHref = card.role === 'expert' ? '/projects' : '/developers';
  const backToListLabel = card.role === 'expert' ? '返回项目列表' : '返回程序员列表';

  return (
    <div className="site-shell page-section page-stack">
      {message ? <p className="status-text">{message}</p> : null}

      <div className="detail-back-nav">
        <Link className="filter-back-link" href={backToListHref}>
          ← {backToListLabel}
        </Link>
      </div>

      <section className="detail-hero">
        <div className="card-meta-row">
          <span className="pill pill-role">{roleLabels[card.role]}</span>
          <span className="pill">{card.city}</span>
          <span className="pill card-published-at">{formatPublishedAt(card.createdAt)}</span>
        </div>
        <h1>{card.headline}</h1>
        <p>{card.basicSummary}</p>
        <div className="tag-row">
          {card.strengths.map((strength) => (
            <span className="tag" key={strength}>
              {strength}
            </span>
          ))}
        </div>
        <div className="cta-panel">
          <div className="detail-action-row">
            <div className="card-engagement-icons">
              <CardEngagementActions cardId={id} />
            </div>
            {!authenticated ? (
              <Link className="card-detail-link card-detail-link-inline" href={`/login?next=/cards/${id}`}>
                登录后申请了解详情
              </Link>
            ) : profile?.user.role !== 'developer' || card.role !== 'expert' ? (
              <span className="pill card-detail-link-inline">当前仅支持程序员向项目方申请了解详情</span>
            ) : !profile?.completion.hasDetailProfile ? (
              <Link className="card-detail-link card-detail-link-inline" href="/onboarding/detail">
                先完善详细信息
              </Link>
            ) : card.viewerState ? (
              <span className="pill pill-role card-detail-link-inline">当前状态：{statusLabel}</span>
            ) : (
              <button className="card-detail-link card-detail-link-inline" disabled={submittingRequest} type="button" onClick={() => void handleCreateRequest()}>
                {submittingRequest ? '发送中…' : '申请了解详情'}
              </button>
            )}
          </div>
        </div>
      </section>

      

      {card.viewerState?.contactVisible && card.viewerState.contactMethods.length > 0 ? (
        <section className="detail-card">
          <h2>已可见联系方式</h2>
          <div className="contact-list">
            {card.viewerState.contactMethods.map((contact: ContactMethod) => (
              <div className="contact-item" key={contact.id}>
                <strong>{contact.type}</strong>
                <p>{contact.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

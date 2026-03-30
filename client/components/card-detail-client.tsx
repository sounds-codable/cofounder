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

  return (
    <div className="site-shell page-section page-stack">
      {message ? <p className="status-text">{message}</p> : null}

      <section className="detail-hero">
        <div className="card-meta-row">
          <span className="pill pill-role">{roleLabels[card.role]}</span>
          <span className="pill">{card.city}</span>
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
          <div>
            <strong>下一步</strong>
            <p>如果你想继续深入了解，可以在这里发起申请。</p>
            <InfoDisclosure title="申请前说明" compact>
              <p>这是一个授权动作，不是立即私聊。</p>
              <p>先开放详细信息，联系方式需要后续单独交换。</p>
            </InfoDisclosure>
          </div>
          <div className="hero-actions">
            <CardEngagementActions cardId={id} />
            {!authenticated ? (
              <Link className="primary-button hero-primary" href={`/login?next=/cards/${id}`}>
                登录后申请了解详情
              </Link>
            ) : !profile?.completion.hasDetailProfile ? (
              <Link className="primary-button hero-primary" href="/onboarding/detail">
                先完善详细信息
              </Link>
            ) : card.viewerState ? (
              <span className="pill pill-role">当前状态：{statusLabel}</span>
            ) : (
              <button className="primary-button hero-primary" disabled={submittingRequest} type="button" onClick={() => void handleCreateRequest()}>
                {submittingRequest ? '发送中…' : '申请了解详情'}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="detail-grid">
        <article className="detail-card">
          <h2>当前公开信息</h2>
          <ul className="detail-list">
            <li>基础描述：{card.headline}</li>
            <li>所在城市：{card.city}</li>
            {card.optionalDirection ? <li>偏好方向：{card.optionalDirection}</li> : null}
          </ul>
        </article>
        <article className="detail-card masked-card">
          <h2>{detailVisible ? '已解锁的详细信息' : '更完整的信息'}</h2>
          {detailVisible && card.viewerState?.revealedDetail ? (
            <div className="revealed-section">
              <div className="detail-preview-box">
                <strong>个人简介</strong>
                <p>{card.viewerState.revealedDetail.intro}</p>
              </div>
              <div className="detail-preview-box">
                <strong>教育背景</strong>
                <p>{card.viewerState.revealedDetail.education}</p>
              </div>
              <div className="detail-preview-box">
                <strong>工作背景</strong>
                <p>{card.viewerState.revealedDetail.experience}</p>
              </div>
              <div className="detail-preview-box">
                <strong>{card.role === 'expert' ? '项目详情' : '产品 / 项目介绍'}</strong>
                <p>{card.viewerState.revealedDetail.projectDetail}</p>
              </div>
            </div>
          ) : (
            <div className="revealed-section">
              <p>对方同意后，你才能在这里看到更完整的背景信息。</p>
              <InfoDisclosure title="会在后续步骤看到什么" compact>
                <p>你会先看到对方的详细背景信息。</p>
                <p>联系方式不会在这一步直接出现。</p>
              </InfoDisclosure>
            </div>
          )}
        </article>
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

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { InfoDisclosure } from '@/components/info-disclosure';
import {
  approveDetailRequest,
  exchangeContact,
  extractErrorMessage,
  fetchMyRequests,
  rejectDetailRequest,
  type IncomingRequest,
  type OutgoingRequest,
  type RequestCenterResponse,
  viewRequesterDetail,
} from '@/lib/platform-api';
import { useAuthState } from '@/lib/use-auth';

const requestStatusLabels: Record<string, string> = {
  approved_detail_visible: '已开放详细信息',
  contact_exchanged: '已交换联系方式',
  pending_request: '待对方处理',
  publisher_viewed_detail: '对方已查看你的详细信息',
  rejected: '已拒绝',
};

export function RequestCenterClient() {
  const { authenticated, loading } = useAuthState();
  const [requestCenter, setRequestCenter] = useState<RequestCenterResponse>({ incoming: [], outgoing: [] });
  const [message, setMessage] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  async function loadData() {
    const nextRequests = await fetchMyRequests();
    setRequestCenter(nextRequests);
  }

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      if (!authenticated) {
        return;
      }

      try {
        const nextRequests = await fetchMyRequests();

        if (!cancelled) {
          setRequestCenter(nextRequests);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(extractErrorMessage(error));
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  async function handleIncomingAction(requestId: string, action: 'view' | 'approve' | 'reject') {
    setBusyRequestId(requestId);
    setMessage(null);

    try {
      if (action === 'view') {
        await viewRequesterDetail(requestId);
      }

      if (action === 'approve') {
        await approveDetailRequest(requestId);
      }

      if (action === 'reject') {
        const reason = window.prompt('请输入拒绝理由', '当前方向暂不匹配');

        if (!reason) {
          setBusyRequestId(null);
          return;
        }

        await rejectDetailRequest(requestId, reason);
      }

      await loadData();
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setBusyRequestId(null);
    }
  }

  async function handleOutgoingExchange(requestId: string) {
    setBusyRequestId(requestId);
    setMessage(null);

    try {
      await exchangeContact(requestId);
      await loadData();
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setBusyRequestId(null);
    }
  }

  if (!loading && !authenticated) {
    return (
      <div className="site-shell page-section page-stack">
        <section className="form-shell">
          <div className="section-heading left">
            <span>请求中心</span>
            <h1>登录后才能查看和处理你的请求记录。</h1>
            <p>这里会集中展示你发出的请求和收到的请求。</p>
          </div>
          <div className="card-action-row left-aligned">
            <Link className="primary-button" href="/login?next=/requests">
              去登录
            </Link>
            <Link className="ghost-button" href="/projects">
              先浏览公开卡片
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="site-shell page-section page-stack">
      <section className="section-heading left">
        <span>请求中心</span>
        <h1>在这里统一查看和处理你的请求进展。</h1>
        <p>只展示当前阶段对你有用的信息，避免把所有流程一次性摊开。</p>
        <div className="section-heading-extra">
          <InfoDisclosure title="使用说明" compact>
            <p>收到请求时，先看公开信息，再决定是否进入下一步。</p>
            <p>联系方式只有在后续真正交换后才会显示。</p>
          </InfoDisclosure>
        </div>
      </section>

      {message ? <p className="status-text">{message}</p> : null}

      <section className="request-layout">
        <article className="detail-card">
          <h2>我发出的请求</h2>
          {requestCenter.outgoing.length === 0 ? (
            <p>你还没有发出任何请求。可以先去公开列表挑选感兴趣的项目或程序员。</p>
          ) : (
            requestCenter.outgoing.map((request) => <OutgoingRequestCard key={request.id} request={request} onExchange={handleOutgoingExchange} busy={busyRequestId === request.id} />)
          )}
        </article>

        <article className="detail-card">
          <h2>我收到的请求</h2>
          {requestCenter.incoming.length === 0 ? (
            <p>你暂时还没有收到新的请求。</p>
          ) : (
            requestCenter.incoming.map((request) => (
              <IncomingRequestCard
                key={request.id}
                request={request}
                busy={busyRequestId === request.id}
                onAction={handleIncomingAction}
              />
            ))
          )}
        </article>
      </section>
    </div>
  );
}

function isIncomingDetailVisible(status: string) {
  return ['approved_detail_visible', 'contact_exchanged', 'publisher_viewed_detail', 'rejected'].includes(status);
}

function isOutgoingDetailVisible(status: string) {
  return ['approved_detail_visible', 'contact_exchanged'].includes(status);
}

function isContactVisible(status: string) {
  return status === 'contact_exchanged';
}

type IncomingRequestCardProps = {
  busy: boolean;
  onAction: (requestId: string, action: 'view' | 'approve' | 'reject') => Promise<void>;
  request: IncomingRequest;
};

function IncomingRequestCard({ busy, onAction, request }: IncomingRequestCardProps) {
  const detailVisible = Boolean(request.requester.detailedProfile && isIncomingDetailVisible(request.status));
  const contactVisible = Boolean(request.requester.contactMethods.length > 0 && isContactVisible(request.status));

  return (
    <div className="request-card">
      <strong>{request.requester.displayName} 希望查看你的详细信息</strong>
      <span>当前状态：{requestStatusLabels[request.status] || request.status}</span>
      <p>
        对方基础信息：{request.requester.city} · {request.requester.basicSummary}
      </p>
      {detailVisible && request.requester.detailedProfile ? (
        <div className="detail-preview-box">
          <p>个人简介：{request.requester.detailedProfile.intro}</p>
          <p>教育背景：{request.requester.detailedProfile.education}</p>
          <p>工作背景：{request.requester.detailedProfile.experience}</p>
          <p>项目 / 作品：{request.requester.detailedProfile.projectDetail}</p>
        </div>
      ) : request.requester.detailedProfile ? (
        <div className="detail-preview-box">
          <strong>对方已填写详细信息</strong>
          <div className="masked-block">
            <strong>个人简介</strong>
            <p>{'█'.repeat(32)}</p>
          </div>
          <div className="masked-block">
            <strong>教育背景</strong>
            <p>{'█'.repeat(20)}</p>
          </div>
          <div className="masked-block">
            <strong>工作背景</strong>
            <p>{'█'.repeat(26)}</p>
          </div>
        </div>
      ) : null}
      {contactVisible ? (
        <div className="detail-preview-box">
          <p>联系方式：{request.requester.contactMethods.map((item) => `${item.type}: ${item.value}`).join(' ｜ ')}</p>
        </div>
      ) : null}
      {request.rejectionReason ? <p className="status-text">拒绝理由：{request.rejectionReason}</p> : null}
      <InfoDisclosure title="处理说明" compact>
        {request.actions.canViewRequesterDetail ? (
          <>
            <p>你可以先查看对方的详细信息，再决定是否同意。</p>
            <p>联系方式仍不会在这一步显示。</p>
          </>
        ) : request.actions.canApprove || request.actions.canReject ? (
          <>
            <p>请在认真看完资料后，再决定是否继续。</p>
            <p>如果同意，对方先看到你的详细信息，不会立刻看到联系方式。</p>
          </>
        ) : request.status === 'rejected' ? (
          <p>这条请求已经结束。</p>
        ) : (
          <p>当前请求正在等待下一步处理。</p>
        )}
      </InfoDisclosure>
      <div className="card-action-row left-aligned">
        {request.actions.canViewRequesterDetail ? (
          <button className="ghost-button" disabled={busy} onClick={() => void onAction(request.id, 'view')} type="button">
            查看对方详细信息
          </button>
        ) : null}
        {request.actions.canApprove ? (
          <button className="primary-button" disabled={busy} onClick={() => void onAction(request.id, 'approve')} type="button">
            同意查看详细信息
          </button>
        ) : null}
        {request.actions.canReject ? (
          <button className="ghost-button" disabled={busy} onClick={() => void onAction(request.id, 'reject')} type="button">
            拒绝
          </button>
        ) : null}
      </div>
    </div>
  );
}

type OutgoingRequestCardProps = {
  busy: boolean;
  onExchange: (requestId: string) => Promise<void>;
  request: OutgoingRequest;
};

function OutgoingRequestCard({ busy, onExchange, request }: OutgoingRequestCardProps) {
  const detailVisible = Boolean(request.publisher.detailedProfile && isOutgoingDetailVisible(request.status));
  const contactVisible = Boolean(request.publisher.contactMethods.length > 0 && isContactVisible(request.status));

  return (
    <div className="request-card">
      <strong>发给 {request.targetCard.ownerName} 的了解详情请求</strong>
      <span>当前状态：{requestStatusLabels[request.status] || request.status}</span>
      <p>{request.targetCard.headline}</p>
      {detailVisible && request.publisher.detailedProfile ? (
        <div className="detail-preview-box">
          <p>个人简介：{request.publisher.detailedProfile.intro}</p>
          <p>教育背景：{request.publisher.detailedProfile.education}</p>
          <p>工作背景：{request.publisher.detailedProfile.experience}</p>
          <p>项目详情：{request.publisher.detailedProfile.projectDetail}</p>
        </div>
      ) : null}
      {contactVisible ? (
        <div className="detail-preview-box">
          <p>联系方式：{request.publisher.contactMethods.map((item) => `${item.type}: ${item.value}`).join(' ｜ ')}</p>
        </div>
      ) : null}
      {request.rejectionReason ? <p className="status-text">对方反馈：{request.rejectionReason}</p> : null}
      <InfoDisclosure title="当前进度说明" compact>
        {request.actions.canExchangeContact ? (
          <>
            <p>对方已经同意，你现在可以继续交换联系方式。</p>
            <p>完成后，你才能看到对方授权给你的联系方式。</p>
          </>
        ) : detailVisible ? (
          <p>你已经可以查看对方更完整的背景信息。</p>
        ) : request.status === 'rejected' ? (
          <p>对方已拒绝这次请求，你可以查看对方的反馈。</p>
        ) : (
          <p>这条请求仍在等待对方处理。</p>
        )}
      </InfoDisclosure>
      {request.actions.canExchangeContact ? (
        <div className="card-action-row left-aligned">
          <button className="primary-button" disabled={busy} onClick={() => void onExchange(request.id)} type="button">
            发起联系方式交换
          </button>
        </div>
      ) : null}
    </div>
  );
}

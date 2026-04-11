'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { buildCardPath } from '@/lib/card-url';
import { formatBeijingDateTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import {
  exchangeContact,
  extractErrorMessage,
  fetchMyRequests,
  saveContactMethods,
  type IncomingRequest,
  type OutgoingRequest,
  type RequestCenterResponse,
} from '@/lib/platform-api';
import { useAuthState } from '@/lib/use-auth';

const requestStatusLabels: Record<string, string> = {
  approved_detail_visible: '已收到联系申请 - 待处理',
  contact_exchanged: '匹配成功！',
  pending_request: '已申请更多信息',
  publisher_viewed_detail: '已申请更多信息',
  requester_declined_contact: '不想联系',
  rejected: '已拒绝',
};

function formatRequestTime(value: string) {
  return `${formatBeijingDateTime(value, '时间未知')}`;
}

function isWaitingStatus(status: string) {
  return status === 'pending_request' || status === 'publisher_viewed_detail';
}

function getIncomingStatusLabel(status: string) {
  if (status === 'requester_declined_contact') {
    return '对方不想联系';
  }

  if (status === 'contact_exchanged') {
    return '匹配成功！';
  }

  if (status === 'approved_detail_visible') {
    return '已申请聊聊';
  }

  if (isWaitingStatus(status)) {
    return '已收到联系申请 - 待处理';
  }

  return requestStatusLabels[status] || status;
}

function getRequestStatusBadgeClass(status: string) {
  if (status === 'approved_detail_visible') {
    return 'border-sky-300/80 bg-sky-50/90 text-sky-800';
  }

  if (status === 'pending_request' || status === 'publisher_viewed_detail') {
    return 'border-amber-300/80 bg-amber-50/90 text-amber-800';
  }

  if (status === 'contact_exchanged') {
    return 'border-cyan-300/80 bg-cyan-50/90 text-cyan-800';
  }

  if (status === 'requester_declined_contact' || status === 'rejected') {
    return 'border-rose-300/80 bg-rose-50/90 text-rose-800';
  }

  return 'border-border/80 bg-background/88 text-foreground';
}

function toggleFilter(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function splitOtherContactValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return { displayName: '', other: '' };
  }

  const withName = trimmed.match(/^称呼\s*[：:]\s*([^;；\n]+)(?:[;；\n](.*))?$/);

  if (!withName) {
    return { displayName: '', other: trimmed };
  }

  return {
    displayName: (withName[1] || '').trim(),
    other: (withName[2] || '').trim(),
  };
}

function composeOtherContactValue(displayName: string, other: string) {
  const normalizedName = displayName.trim();
  const normalizedOther = other.trim();

  if (normalizedName && normalizedOther) {
    return `称呼：${normalizedName}；${normalizedOther}`;
  }

  if (normalizedName) {
    return `称呼：${normalizedName}`;
  }

  return normalizedOther;
}

export function RequestCenterClient() {
  const { authenticated, loading, profile, refresh } = useAuthState();
  const [requestCenter, setRequestCenter] = useState<RequestCenterResponse>({ incoming: [], outgoing: [] });
  const [message, setMessage] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [activeIncomingRequesters, setActiveIncomingRequesters] = useState<string[]>([]);
  const [activeOutgoingOwners, setActiveOutgoingOwners] = useState<string[]>([]);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [targetExchangeRequestId, setTargetExchangeRequestId] = useState<string | null>(null);
  const [savingContacts, setSavingContacts] = useState(false);
  const [contactDisplayName, setContactDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [wechat, setWechat] = useState('');
  const [qq, setQq] = useState('');
  const [email, setEmail] = useState('');
  const [other, setOther] = useState('');

  const hasContactMethods = Boolean(profile?.contactMethods.some((item) => item.value.trim().length > 0));

  async function loadData() {
    const nextRequests = await fetchMyRequests();
    setRequestCenter(nextRequests);
  }

  const outgoingOrderByRequestId = new Map(
    [...requestCenter.outgoing]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((request, index) => [request.id, index + 1]),
  );

  const incomingOrderByRequestId = new Map(
    [...requestCenter.incoming]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((request, index) => [request.id, index + 1]),
  );

  const filteredOutgoingRequests =
    activeOutgoingOwners.length > 0
      ? requestCenter.outgoing.filter((request) => activeOutgoingOwners.includes(request.targetCard.ownerName))
      : requestCenter.outgoing;

  const filteredIncomingRequests =
    activeIncomingRequesters.length > 0
      ? requestCenter.incoming.filter((request) => activeIncomingRequesters.includes(request.requester.displayName))
      : requestCenter.incoming;

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

  useEffect(() => {
    if (!profile) {
      return;
    }

    const parsedOther = splitOtherContactValue(profile.contactMethods.find((item) => item.type === 'other')?.value || '');
    setContactDisplayName(parsedOther.displayName || profile.user.displayName || '');
    setPhone(profile.contactMethods.find((item) => item.type === 'phone')?.value || '');
    setWechat(profile.contactMethods.find((item) => item.type === 'wechat')?.value || '');
    setQq(profile.contactMethods.find((item) => item.type === 'qq')?.value || '');
    setEmail(profile.contactMethods.find((item) => item.type === 'email')?.value || profile.user.email || '');
    setOther(parsedOther.other);
  }, [profile]);

  async function handleSaveContactsAndExchange() {
    if (!targetExchangeRequestId) {
      return;
    }

    if (![phone, wechat, qq, email, other].some((item) => item.trim().length > 0)) {
      setMessage('请至少填写一种联系方式，再发起交换。');
      return;
    }

    setSavingContacts(true);
    setBusyRequestId(targetExchangeRequestId);
    setMessage(null);

    try {
      await saveContactMethods({
        phone,
        wechat,
        qq,
        email,
        other: composeOtherContactValue(contactDisplayName, other),
      });
      await refresh();
      await exchangeContact(targetExchangeRequestId);
      await loadData();
      setContactModalOpen(false);
      setTargetExchangeRequestId(null);
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setSavingContacts(false);
      setBusyRequestId(null);
    }
  }

  async function handleOutgoingExchange(requestId: string) {
    if (!hasContactMethods) {
      setTargetExchangeRequestId(requestId);
      setContactModalOpen(true);
      return;
    }

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
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <Card className="border-border/70 bg-card/80 shadow-[0_16px_38px_rgba(79,108,163,0.14)]">
          <CardHeader className="space-y-3">
            <p className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-wide text-secondary-foreground">请求中心</p>
            <CardTitle className="text-2xl">登录后才能查看和处理你的请求记录。</CardTitle>
            <p className="text-sm text-muted-foreground">这里会集中展示你发出的请求和收到的请求。</p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link className={buttonVariants()} href="/login?next=/requests">
              去登录
            </Link>
            <Link className={buttonVariants({ variant: 'outline' })} href="/projects">
              先浏览公开卡片
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-6xl space-y-6 overflow-hidden px-4 py-6 md:px-6 md:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_8%_0%,rgba(19,191,168,0.16),transparent_46%),radial-gradient(circle_at_88%_18%,rgba(76,200,255,0.14),transparent_44%)]" />
      

      {message ? <p className="rounded-lg border border-border/70 bg-background/76 px-3 py-2 text-sm text-muted-foreground backdrop-blur-sm">{message}</p> : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/70 bg-card/80 shadow-[0_12px_30px_rgba(79,108,163,0.1)]">
          <CardHeader>
            <CardTitle>我发出的请求</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
          {activeOutgoingOwners.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2">
              <span className="text-xs text-muted-foreground">已筛选发布者：</span>
              {activeOutgoingOwners.map((owner) => (
                <button
                  className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
                  key={`outgoing-owner-${owner}`}
                  type="button"
                  onClick={() => setActiveOutgoingOwners((previous) => toggleFilter(previous, owner))}
                >
                  {owner} ×
                </button>
              ))}
              <button className={buttonVariants({ variant: 'ghost', size: 'sm' })} type="button" onClick={() => setActiveOutgoingOwners([])}>
                清空
              </button>
            </div>
          ) : null}
          {filteredOutgoingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">你还没有发出任何请求。可以先去公开列表挑选感兴趣的项目或程序员。</p>
          ) : (
            filteredOutgoingRequests.map((request) => (
              <OutgoingRequestCard
                key={request.id}
                request={request}
                orderNumber={outgoingOrderByRequestId.get(request.id) || 0}
                ownerFilterActive={activeOutgoingOwners.includes(request.targetCard.ownerName)}
                onOwnerFilter={(ownerName) => setActiveOutgoingOwners((previous) => toggleFilter(previous, ownerName))}
              />
            ))
          )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80 shadow-[0_12px_30px_rgba(79,108,163,0.1)]">
          <CardHeader>
            <CardTitle>我收到的请求</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
          {activeIncomingRequesters.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2">
              <span className="text-xs text-muted-foreground">已筛选请求方：</span>
              {activeIncomingRequesters.map((requester) => (
                <button
                  className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
                  key={`incoming-requester-${requester}`}
                  type="button"
                  onClick={() => setActiveIncomingRequesters((previous) => toggleFilter(previous, requester))}
                >
                  {requester} ×
                </button>
              ))}
              <button className={buttonVariants({ variant: 'ghost', size: 'sm' })} type="button" onClick={() => setActiveIncomingRequesters([])}>
                清空
              </button>
            </div>
          ) : null}
          {filteredIncomingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">你暂时还没有收到新的请求。</p>
          ) : (
            filteredIncomingRequests.map((request) => (
              <IncomingRequestCard
                key={request.id}
                request={request}
                orderNumber={incomingOrderByRequestId.get(request.id) || 0}
                requesterFilterActive={activeIncomingRequesters.includes(request.requester.displayName)}
                onRequesterFilter={(requesterName) => setActiveIncomingRequesters((previous) => toggleFilter(previous, requesterName))}
              />
            ))
          )}
          </CardContent>
        </Card>
      </section>

      {contactModalOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label="补充联系方式并发起交换">
          <button className="fixed inset-0 bg-foreground/30" onClick={() => setContactModalOpen(false)} type="button" aria-label="关闭弹框" />
          <div className="relative z-10 flex min-h-full items-start justify-center py-2 md:items-center">
            <section className="w-full max-w-xl space-y-4 rounded-2xl border border-border/70 bg-card/96 p-5 shadow-[0_18px_42px_rgba(79,108,163,0.24)] backdrop-blur-md">
              <h2 className="text-xl font-semibold text-foreground">交换联系方式</h2>
              <p className="text-sm text-muted-foreground">先补充你的联系方式，再发起交换。完成后双方才会看到彼此联系方式。</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm text-foreground sm:col-span-2">
                  称呼
                  <Input name="contactDisplayName" onChange={(event) => setContactDisplayName(event.target.value)} placeholder="选填，例如 王女士 / Alex" type="text" value={contactDisplayName} />
                </label>
                <label className="grid gap-1 text-sm text-foreground">
                  电话
                  <Input name="phone" onChange={(event) => setPhone(event.target.value)} placeholder="选填" type="text" value={phone} />
                </label>
                <label className="grid gap-1 text-sm text-foreground">
                  微信
                  <Input name="wechat" onChange={(event) => setWechat(event.target.value)} placeholder="选填" type="text" value={wechat} />
                </label>
                <label className="grid gap-1 text-sm text-foreground">
                  QQ
                  <Input name="qq" onChange={(event) => setQq(event.target.value)} placeholder="选填" type="text" value={qq} />
                </label>
                <label className="grid gap-1 text-sm text-foreground">
                  邮箱
                  <Input name="email" onChange={(event) => setEmail(event.target.value)} placeholder="选填" type="email" value={email} />
                </label>
              </div>
              <label className="grid gap-1 text-sm text-foreground">
                其他联系方式
                <Input name="other" onChange={(event) => setOther(event.target.value)} placeholder="选填，例如 Telegram / 飞书" type="text" value={other} />
              </label>
              <div className="flex flex-wrap gap-2">
                <button className={buttonVariants()} disabled={savingContacts || !targetExchangeRequestId} onClick={() => void handleSaveContactsAndExchange()} type="button">
                  {savingContacts ? '提交中…' : '保存并发起联系方式交换'}
                </button>
                <button className={buttonVariants({ variant: 'outline' })} disabled={savingContacts} onClick={() => setContactModalOpen(false)} type="button">
                  取消
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function isIncomingDetailVisible(status: string) {
  return ['approved_detail_visible', 'contact_exchanged', 'publisher_viewed_detail', 'rejected'].includes(status);
}

type IncomingRequestCardProps = {
  orderNumber: number;
  onRequesterFilter: (requesterName: string) => void;
  request: IncomingRequest;
  requesterFilterActive: boolean;
};

function IncomingRequestCard({ orderNumber, onRequesterFilter, request, requesterFilterActive }: IncomingRequestCardProps) {
  const detailHref = buildCardPath({
    id: request.targetCard.id,
    role: request.targetCard.role,
    headline: request.targetCard.headline,
  });
  const requesterName = request.requester.displayName?.trim() || '未知用户';

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-background/74 p-4 shadow-[0_10px_24px_rgba(79,108,163,0.08)]">
      <div className="flex flex-wrap items-center gap-1.5 text-foreground">
        <strong>#{orderNumber} 收到</strong>
        <button
          className={cn(
            'inline-flex rounded-full border px-2 py-0.5 text-sm transition-colors',
            requesterFilterActive
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
          type="button"
          onClick={() => onRequesterFilter(requesterName)}
        >
          {requesterName}
        </button>
        <strong>的请求</strong>
      </div>
      <span className={cn('inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium', getRequestStatusBadgeClass(request.status))}>当前状态：{getIncomingStatusLabel(request.status)}</span>
      <p className="text-xs text-muted-foreground">请求时间：{formatRequestTime(request.createdAt)}</p>
      <p className="text-sm text-muted-foreground">项目名称：{request.targetCard.headline}</p>
      <div className="flex justify-end pt-1">
        <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 rounded-md border-border/70 bg-background/80 px-3 text-foreground hover:bg-muted')} href={detailHref}>
          查看详请
        </Link>
      </div>
    </div>
  );
}

type OutgoingRequestCardProps = {
  onOwnerFilter: (ownerName: string) => void;
  ownerFilterActive: boolean;
  orderNumber: number;
  request: OutgoingRequest;
};

function OutgoingRequestCard({
  onOwnerFilter,
  ownerFilterActive,
  orderNumber,
  request,
}: OutgoingRequestCardProps) {
  const detailHref = buildCardPath({
    id: request.targetCard.id,
    role: request.targetCard.role,
    headline: request.targetCard.headline,
  });
  const ownerName = request.targetCard.ownerName?.trim() || '未知发布者';

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-background/74 p-4 shadow-[0_10px_24px_rgba(79,108,163,0.08)]">
      <div className="flex flex-wrap items-center gap-1.5 text-foreground">
        <strong>#{orderNumber} 发给</strong>
        <button
          className={cn(
            'inline-flex rounded-full border px-2 py-0.5 text-sm transition-colors',
            ownerFilterActive
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
          type="button"
          onClick={() => onOwnerFilter(ownerName)}
        >
          {ownerName}
        </button>
        <strong>的请求</strong>
      </div>
      <span className={cn('inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium', getRequestStatusBadgeClass(request.status))}>当前状态：{requestStatusLabels[request.status] || request.status}</span>
      <p className="text-xs text-muted-foreground">请求时间：{formatRequestTime(request.createdAt)}</p>
      <p className="text-sm text-muted-foreground">项目名称：{request.targetCard.headline}</p>
      <div className="flex justify-end pt-1">
        <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 rounded-md border-border/70 bg-background/80 px-3 text-foreground hover:bg-muted')} href={detailHref}>
          查看详请
        </Link>
      </div>
    </div>
  );
}

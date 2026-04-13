'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthState } from '@/lib/use-auth';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  extractErrorMessage,
  extractRiskReview,
  fetchInviteCodeAvailability,
  fetchInviteOverview,
  saveInviteCode,
  type InviteOverview,
} from '@/lib/platform-api';
import { formatBeijingDateTime } from '@/lib/time';
import { cn, copyTextToClipboard } from '@/lib/utils';

const SAFE_ACCOUNT_NAME_PATTERN = /^[A-Za-z0-9_]+$/;

export default function InviteCodesPage() {
  const { authenticated, loading } = useAuthState();
  const [data, setData] = useState<InviteOverview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingInviteCode, setEditingInviteCode] = useState(false);
  const [inviteCodeDraft, setInviteCodeDraft] = useState('');
  const [inviteCodeMessage, setInviteCodeMessage] = useState<string | null>(null);
  const [inviteCodeAvailable, setInviteCodeAvailable] = useState<boolean | null>(null);
  const [checkingInviteCode, setCheckingInviteCode] = useState(false);
  const [savingInviteCode, setSavingInviteCode] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTextDraft, setShareTextDraft] = useState('');
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [nativeShareMessage, setNativeShareMessage] = useState<string | null>(null);
  const loadingData = authenticated && !data && !message;

  const shareUrl = useMemo(() => {
    if (!data?.inviteLink) {
      return '';
    }

    if (typeof window === 'undefined') {
      return data.inviteLink;
    }

    const resolvedUrl = new URL(data.inviteLink, window.location.origin);
    resolvedUrl.protocol = 'https:';
    return resolvedUrl.toString();
  }, [data?.inviteLink]);

  const defaultShareText = useMemo(() => {
    const baseText = data?.shareText?.trim() || '';
    const inviteCode = data?.inviteCode?.trim() || '';
    const inviteCodeLine = inviteCode ? `邀请码：${inviteCode}` : '';

    if (baseText) {
      if (!inviteCodeLine) {
        return baseText;
      }

      const hasInviteCode = baseText.toLowerCase().includes(inviteCode.toLowerCase());
      return hasInviteCode ? baseText : `${baseText}\n${inviteCodeLine}`;
    }

    return ['来叩饭（Cofounder）看看项目和程序员，或许能匹配到你的Cofounder。', inviteCodeLine, shareUrl]
      .filter(Boolean)
      .join('\n');
  }, [data?.inviteCode, data?.shareText, shareUrl]);

  const canUseNativeShare = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return false;
    }

    return typeof navigator.share === 'function';
  }, []);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    let cancelled = false;
    fetchInviteOverview()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setMessage(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage(extractErrorMessage(error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  useEffect(() => {
    setInviteCodeDraft(data?.inviteCode || '');
  }, [data?.inviteCode]);

  useEffect(() => {
    if (!editingInviteCode) {
      setCheckingInviteCode(false);
      setInviteCodeAvailable(null);
      return;
    }

    const nextCode = inviteCodeDraft.trim();
    const currentCode = data?.inviteCode?.trim() || '';

    if (!nextCode) {
      setCheckingInviteCode(false);
      setInviteCodeAvailable(null);
      setInviteCodeMessage(null);
      return;
    }

    if (nextCode.length < 2) {
      setCheckingInviteCode(false);
      setInviteCodeAvailable(false);
      setInviteCodeMessage('邀请码至少需要 2 个字符。');
      return;
    }

    if (!SAFE_ACCOUNT_NAME_PATTERN.test(nextCode)) {
      setCheckingInviteCode(false);
      setInviteCodeAvailable(false);
      setInviteCodeMessage('邀请码仅支持英文大小写、数字和下划线（_）。');
      return;
    }

    if (nextCode === currentCode) {
      setCheckingInviteCode(false);
      setInviteCodeAvailable(true);
      setInviteCodeMessage(null);
      return;
    }

    let cancelled = false;
    setCheckingInviteCode(true);
    setInviteCodeAvailable(null);

    const timer = window.setTimeout(async () => {
      try {
        const result = await fetchInviteCodeAvailability(nextCode);

        if (cancelled) {
          return;
        }

        setInviteCodeAvailable(result.available);
        setInviteCodeMessage(result.available ? '邀请码可用。' : result.message || '邀请码已被使用，请换一个。');
      } catch (error) {
        if (cancelled) {
          return;
        }

        setInviteCodeAvailable(null);
        setInviteCodeMessage(extractErrorMessage(error));
      } finally {
        if (!cancelled) {
          setCheckingInviteCode(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [data?.inviteCode, editingInviteCode, inviteCodeDraft]);

  async function handleCopyShareText() {
    if (!shareTextDraft) {
      return;
    }

    const copied = await copyTextToClipboard(shareTextDraft);
    setCopyMessage(copied ? '已复制，可直接粘贴到微信/小红书/微博/知乎等社交媒体。' : '复制失败，请手动选择文案后复制。');
  }

  function handleOpenShareModal() {
    setShareTextDraft(defaultShareText);
    setCopyMessage(null);
    setNativeShareMessage(null);
    setShareModalOpen(true);
  }

  async function handleNativeShare() {
    if (!canUseNativeShare || typeof navigator === 'undefined') {
      return;
    }

    try {
      await navigator.share({
        title: '叩饭 Cofounder',
        text: shareTextDraft,
        ...(shareUrl ? { url: shareUrl } : {}),
      });
      setNativeShareMessage('已唤起系统分享面板。');
    } catch {
      setNativeShareMessage('未完成系统分享，可继续复制文案转发。');
    }
  }

  async function handleSaveInviteCode() {
    const nextCode = inviteCodeDraft.trim();

    if (nextCode.length < 2) {
      setInviteCodeMessage('邀请码至少需要 2 个字符。');
      setInviteCodeAvailable(false);
      return;
    }

    if (!SAFE_ACCOUNT_NAME_PATTERN.test(nextCode)) {
      setInviteCodeMessage('邀请码仅支持英文大小写、数字和下划线（_）。');
      setInviteCodeAvailable(false);
      return;
    }

    if (checkingInviteCode) {
      setInviteCodeMessage('正在检查邀请码是否可用，请稍候。');
      return;
    }

    if (inviteCodeAvailable === false) {
      setInviteCodeMessage('邀请码已被使用，请换一个。');
      return;
    }

    setSavingInviteCode(true);
    setInviteCodeMessage(null);

    try {
      const result = await saveInviteCode(nextCode);
      setData(result);
      setEditingInviteCode(false);
      setMessage('邀请码已更新。');
    } catch (error) {
      const riskReview = extractRiskReview(error);

      if (riskReview) {
        const confirmed = window.confirm(
          `系统检测到潜在风险内容。\n风险等级：${riskReview.riskLevel}\n命中类别：${riskReview.categories.join('、') || '未知'}\n命中词：${riskReview.matchedTerms.join('、') || '未知'}\n\n是否仍继续发布？`,
        );

        if (confirmed) {
          try {
            const retryResult = await saveInviteCode(nextCode, true);
            setData(retryResult);
            setEditingInviteCode(false);
            setMessage('邀请码已更新。');
            return;
          } catch (retryError) {
            setInviteCodeMessage(extractErrorMessage(retryError));
            return;
          }
        }

        setInviteCodeMessage('你已取消本次修改。');
        return;
      }

      setInviteCodeMessage(extractErrorMessage(error));
    } finally {
      setSavingInviteCode(false);
    }
  }

  if (!loading && !authenticated) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-8">
        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>请先登录后查看邀请码</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const shareModal =
    shareModalOpen && typeof document !== 'undefined'
      ? createPortal(
          <div aria-label="分享邀请码" aria-modal="true" className="fixed inset-0 z-[140] overflow-y-auto p-4" role="dialog">
            <button
              aria-label="关闭分享弹框"
              className="fixed inset-0 bg-foreground/30"
              type="button"
              onClick={() => {
                setShareModalOpen(false);
              }}
            />
            <div className="relative z-10 flex min-h-full items-start justify-center py-2 md:items-center">
              <section className="w-full max-w-lg space-y-4 rounded-2xl border border-border/70 bg-card/96 p-5 shadow-[0_18px_42px_rgba(79,108,163,0.24)] backdrop-blur-md">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold text-foreground">分享</h2>
                  <button
                    aria-label="关闭分享弹框"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-lg leading-none text-muted-foreground hover:bg-accent"
                    type="button"
                    onClick={() => {
                      setShareModalOpen(false);
                    }}
                  >
                    ×
                  </button>
                </div>

                <p className="text-sm text-muted-foreground">来分享吧！把邀请码和叩饭（Cofounder）分享给朋友，邀请TA一起使用。</p>

                <label className="grid gap-2 text-sm font-medium text-foreground" htmlFor="invite-share-text">
                  分享文案（供参考）
                  <textarea
                    className="min-h-[140px] rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    id="invite-share-text"
                    value={shareTextDraft}
                    onChange={(event) => {
                      setShareTextDraft(event.target.value);
                      if (copyMessage) {
                        setCopyMessage(null);
                      }
                      if (nativeShareMessage) {
                        setNativeShareMessage(null);
                      }
                    }}
                  />
                </label>

                {shareUrl ? <p className="text-xs text-muted-foreground break-all">分享链接：{shareUrl}</p> : null}

                <div className="flex flex-wrap gap-2">
                  {canUseNativeShare ? (
                    <button className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent" type="button" onClick={() => void handleNativeShare()}>
                      系统分享
                    </button>
                  ) : null}
                  <button className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent" type="button" onClick={() => void handleCopyShareText()}>
                    复制文案
                  </button>
                  <button
                    className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-muted-foreground hover:bg-accent"
                    type="button"
                    onClick={() => {
                      setShareTextDraft(defaultShareText);
                      setCopyMessage(null);
                      setNativeShareMessage(null);
                    }}
                  >
                    重置文案
                  </button>
                </div>

                {nativeShareMessage ? <p className="text-sm text-muted-foreground">{nativeShareMessage}</p> : null}
                {copyMessage ? <p className="text-sm text-muted-foreground">{copyMessage}</p> : null}
              </section>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="space-y-5">
      <Card className="border-border/70 bg-card/82">
        <CardHeader>
          <CardTitle>邀请码管理</CardTitle>
          <p className="text-sm text-muted-foreground">{data?.activationGuide || '激活邀请码的方式：添加项目，或登记程序员信息。'}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.invitedBy ? (
            <div className="rounded-xl border border-sky-300/70 bg-sky-50/70 px-4 py-3">
              <p className="text-xs text-sky-800">邀请我的用户</p>
              <p className="mt-1 text-base font-semibold text-sky-950">{data.invitedBy.displayName || '未命名用户'}</p>
            </div>
          ) : null}
          <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-3">
            <p className="text-xs text-muted-foreground">我的邀请码</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-2xl font-semibold tracking-wide text-foreground">{loadingData ? '生成中…' : data?.inviteCode || '暂未激活'}</p>
              {data?.inviteCode ? (
                <button
                  aria-label="修改邀请码"
                  className="inline-flex size-7 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition-colors hover:text-foreground"
                  title="修改邀请码"
                  type="button"
                  onClick={() => {
                    setEditingInviteCode((current) => !current);
                    setInviteCodeMessage(null);
                    setInviteCodeAvailable(null);
                  }}
                >
                  <svg aria-hidden="true" className="size-3.5" viewBox="0 0 24 24">
                    <path d="M4 16.5V20h3.5l10-10-3.5-3.5-10 10z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                    <path d="M13.5 6.5l3.5 3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  </svg>
                </button>
              ) : null}
            </div>
            {data?.inviteLink ? <p className="mt-2 break-all text-xs text-muted-foreground">{data.inviteLink}</p> : null}
            {editingInviteCode ? (
              <div className="mt-3 space-y-2 rounded-md border border-border/70 bg-background/72 px-3 py-2">
                <label className="grid gap-1 text-xs text-muted-foreground">
                  新邀请码
                  <input
                    className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    maxLength={20}
                    value={inviteCodeDraft}
                    onChange={(event) => setInviteCodeDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void handleSaveInviteCode();
                      }
                    }}
                  />
                </label>
                {checkingInviteCode ? <p className="text-xs text-muted-foreground">正在检查邀请码是否重复…</p> : null}
                <div className="flex gap-2">
                  <button className={cn(buttonVariants({ size: 'sm' }), 'h-8')} disabled={savingInviteCode} type="button" onClick={() => void handleSaveInviteCode()}>
                    {savingInviteCode ? '保存中…' : '保存'}
                  </button>
                  <button
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8')}
                    disabled={savingInviteCode}
                    type="button"
                    onClick={() => {
                      setEditingInviteCode(false);
                      setInviteCodeDraft(data?.inviteCode || '');
                      setInviteCodeMessage(null);
                      setInviteCodeAvailable(null);
                      setCheckingInviteCode(false);
                    }}
                  >
                    取消
                  </button>
                </div>
                {inviteCodeMessage ? <p className={cn('text-xs', inviteCodeAvailable ? 'text-emerald-600' : 'text-destructive')}>{inviteCodeMessage}</p> : null}
              </div>
            ) : null}
          </div>
          <button className={buttonVariants()} disabled={!data?.inviteCode} type="button" onClick={handleOpenShareModal}>
            分享邀请码
          </button>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/82">
        <CardHeader>
          <CardTitle>通过我邀请码注册的用户</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data?.invitedUsers?.length ? (
            data.invitedUsers.map((user) => (
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-3 py-2" key={user.id}>
                <div>
                  <p className="text-sm text-foreground">{user.displayName || '未命名用户'}</p>
                  <p className="text-xs text-muted-foreground">注册时间：{formatBeijingDateTime(user.registeredAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">暂无通过你邀请码注册并完成激活的用户。</p>
          )}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
      {shareModal}
    </div>
  );
}

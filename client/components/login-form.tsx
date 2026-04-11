'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { InfoDisclosure } from '@/components/info-disclosure';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { extractErrorMessage, sendLoginCode, verifyLoginCode } from '@/lib/platform-api';
import { setStoredAccessToken } from '@/lib/session';
import { useAuthState } from '@/lib/use-auth';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated, loading } = useAuthState();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteModalMessage, setInviteModalMessage] = useState<string | null>(null);
  const resolvedNextPath = useMemo(() => searchParams.get('next') || '/projects', [searchParams]);
  const inviteCode = useMemo(() => searchParams.get('invite')?.trim() || '', [searchParams]);

  const parseApiError = (error: unknown) => {
    if (!(error instanceof Error)) {
      return { code: null as string | null, message: '请求失败' };
    }

    try {
      const parsed = JSON.parse(error.message) as { code?: string; message?: string | string[] };
      return {
        code: parsed.code || null,
        message: Array.isArray(parsed.message) ? parsed.message.join('，') : parsed.message || error.message,
      };
    } catch {
      return { code: null as string | null, message: error.message };
    }
  };

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cooldownSeconds]);

  useEffect(() => {
    if (loading || !authenticated) {
      return;
    }

    router.replace(resolvedNextPath);
    router.refresh();
  }, [authenticated, loading, resolvedNextPath, router]);

  async function handleSendCode(overrideInviteCode?: string) {
    setSending(true);
    setMessage(null);
    setInviteModalMessage(null);

    const nextInviteCode = overrideInviteCode?.trim() || inviteCode || undefined;

    try {
      const result = await sendLoginCode(email, nextInviteCode);
      setDevCode(result.devCode ?? null);
      setCooldownSeconds(60);
      setMessage(result.message || '验证码已发送，请留意邮箱。');
      setInviteModalOpen(false);
    } catch (error) {
      const parsed = parseApiError(error);

      if (parsed.code === 'INVITE_CODE_REQUIRED' || parsed.code === 'INVITE_CODE_INVALID') {
        setInviteCodeInput(overrideInviteCode?.trim() || inviteCode || '');
        setInviteModalMessage(parsed.message);
        setInviteModalOpen(true);
      } else {
        setMessage(extractErrorMessage(error));
      }
    } finally {
      setSending(false);
    }
  }

  async function handleConfirmInviteAndSendCode() {
    await handleSendCode(inviteCodeInput);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const result = await verifyLoginCode(email, code);
      setStoredAccessToken(result.accessToken);
      router.replace(resolvedNextPath);
      router.refresh();
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && authenticated) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-3">
          <p className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-wide text-secondary-foreground">登录 / 注册</p>
          <CardTitle className="text-2xl">登录或注册</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-foreground">
          邮箱
          <Input name="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" value={email} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
          验证码
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input className="sm:flex-1" name="code" onChange={(event) => setCode(event.target.value)} placeholder="输入邮箱验证码" type="text" value={code} />
            <Button className="sm:shrink-0" variant="outline" disabled={sending || !email || cooldownSeconds > 0} type="button" onClick={() => void handleSendCode()}>
              {sending ? '发送中…' : cooldownSeconds > 0 ? `${cooldownSeconds}s 后重发` : '发送验证码'}
            </Button>
          </div>
            </label>
            <InfoDisclosure title="收不到验证码？" compact>
              <p>请稍等1-2分钟，同时检查垃圾邮件箱，或者更换邮箱尝试；如果仍未收到，请联系我们 x@cofounder.icu</p>
              {devCode ? <p>当前本地环境调试验证码：{devCode}</p> : null}
            </InfoDisclosure>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <Button className="w-full sm:w-auto" disabled={submitting || !email || !code} type="submit">
          {submitting ? '登录中…' : '登录并继续'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {inviteModalOpen ? (
        <div aria-label="邀请码提示" aria-modal="true" className="fixed inset-0 z-[70] overflow-y-auto p-4" role="dialog">
          <button
            aria-label="关闭弹框"
            className="fixed inset-0 bg-foreground/30"
            type="button"
            onClick={() => {
              setInviteModalOpen(false);
              setInviteModalMessage(null);
            }}
          />
          <div className="relative z-10 flex min-h-full items-start justify-center py-2 md:items-center">
            <section className="w-full max-w-lg space-y-4 rounded-2xl border border-border/70 bg-card/96 p-5 shadow-[0_18px_42px_rgba(79,108,163,0.24)] backdrop-blur-md">
              <h2 className="text-xl font-semibold text-foreground">本站邀请制，请输入邀请码</h2>
              <p className="text-sm text-muted-foreground">本站目前仅对受邀用户开放</p>

              <label className="grid gap-2 text-sm font-medium text-foreground">
                邀请码
                <Input placeholder="请输入邀请码" type="text" value={inviteCodeInput} onChange={(event) => setInviteCodeInput(event.target.value)} />
              </label>

              <div className="rounded-xl border border-sky-300/60 bg-sky-50/70 p-3 text-sm text-sky-900">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-sky-300 text-xs font-semibold">i</span>
                  <strong>如何获得邀请码</strong>
                </div>
                <p className="mt-2 leading-6">本站现有用户可提供邀请码。可在 小红书上查找『叩饭 邀请码』或『Cofounder 邀请码』。邀请码是免费的，无需付费。</p>
              </div>

              {inviteModalMessage ? <p className="text-sm text-destructive">{inviteModalMessage}</p> : null}

              <div className="flex flex-wrap gap-2">
                <Button disabled={sending || !email || !inviteCodeInput.trim()} type="button" onClick={() => void handleConfirmInviteAndSendCode()}>
                  {sending ? '发送中…' : '提交邀请码并发送验证码'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setInviteModalOpen(false);
                    setInviteModalMessage(null);
                  }}
                >
                  取消
                </Button>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </section>
  );
}

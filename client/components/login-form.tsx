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
  const resolvedNextPath = useMemo(() => searchParams.get('next') || '/projects', [searchParams]);

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

  async function handleSendCode() {
    setSending(true);
    setMessage(null);

    try {
      const result = await sendLoginCode(email);
      setDevCode(result.devCode ?? null);
      setCooldownSeconds(60);
      setMessage(result.message || '验证码已发送，请留意邮箱。');
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setSending(false);
    }
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
            <Button className="sm:shrink-0" variant="outline" disabled={sending || !email || cooldownSeconds > 0} type="button" onClick={handleSendCode}>
              {sending ? '发送中…' : cooldownSeconds > 0 ? `${cooldownSeconds}s 后重发` : '发送验证码'}
            </Button>
          </div>
            </label>
            <InfoDisclosure title="收不到验证码怎么办" compact>
              <p>请先检查垃圾邮件箱。</p>
              {devCode ? <p>当前本地环境调试验证码：{devCode}</p> : <p>如果本地开发未配置邮件服务，可稍后查看开发环境提示。</p>}
            </InfoDisclosure>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <Button className="w-full sm:w-auto" disabled={submitting || !email || !code} type="submit">
          {submitting ? '登录中…' : '登录并继续'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

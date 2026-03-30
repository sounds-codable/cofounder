'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { InfoDisclosure } from '@/components/info-disclosure';
import { extractErrorMessage, sendLoginCode, verifyLoginCode } from '@/lib/platform-api';
import { setStoredAccessToken } from '@/lib/session';
import { useAuthState } from '@/lib/use-auth';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated, loading, profile } = useAuthState();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const resolvedNextPath = useMemo(() => searchParams.get('next') || '/requests', [searchParams]);

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
      router.push(resolvedNextPath);
      router.refresh();
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && authenticated && profile) {
    return (
      <section className="form-shell">
        <div className="section-heading left">
          <span>当前已登录</span>
          <h1>你已经以 {profile.user.displayName} 身份登录。</h1>
          <p>你可以继续完善资料、处理请求，或直接返回目标页面。</p>
        </div>
        <div className="notice-box emphasis">
          <strong>{profile.user.email || '未绑定邮箱'}</strong>
          <p>
            当前角色：{profile.user.role === 'expert' ? '项目方 / 行业专家' : '程序员'}
            {' · '}
            城市：{profile.user.city}
          </p>
        </div>
        <div className="card-action-row left-aligned">
          <button className="primary-button" onClick={() => router.push(resolvedNextPath)} type="button">
            继续前往目标页面
          </button>
          <button className="ghost-button" onClick={() => router.push('/onboarding/basic')} type="button">
            继续完善基础信息
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="form-shell">
      <div className="section-heading left">
        <span>登录 / 注册</span>
        <h1>登录后，你就可以继续收藏、点赞和处理请求。</h1>
        <p>这里使用邮箱验证码登录。</p>
      </div>
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          邮箱
          <input name="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" value={email} />
        </label>
        <label>
          验证码
          <div className="inline-field">
            <input name="code" onChange={(event) => setCode(event.target.value)} placeholder="输入邮箱验证码" type="text" value={code} />
            <button className="ghost-button" disabled={sending || !email || cooldownSeconds > 0} type="button" onClick={handleSendCode}>
              {sending ? '发送中…' : cooldownSeconds > 0 ? `${cooldownSeconds}s 后重发` : '发送验证码'}
            </button>
          </div>
        </label>
        <InfoDisclosure title="收不到验证码怎么办" compact>
          <p>请先检查垃圾邮件箱。</p>
          {devCode ? <p>当前本地环境调试验证码：{devCode}</p> : <p>如果本地开发未配置邮件服务，可稍后查看开发环境提示。</p>}
        </InfoDisclosure>
        {message ? <p className="status-text">{message}</p> : null}
        <button className="primary-button hero-primary" disabled={submitting || !email || !code} type="submit">
          {submitting ? '登录中…' : '登录并继续'}
        </button>
      </form>
    </section>
  );
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { InfoDisclosure } from '@/components/info-disclosure';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { extractErrorMessage, saveBasicProfile } from '@/lib/platform-api';
import { useAuthState } from '@/lib/use-auth';

export function BasicProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated, loading, profile, refresh } = useAuthState();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<'expert' | 'developer'>('expert');
  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [basicSummary, setBasicSummary] = useState('');
  const [city, setCity] = useState('');
  const [desiredDirection, setDesiredDirection] = useState('');
  const [strengths, setStrengths] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const roleParam = searchParams.get('role');

    if (!profile && (roleParam === 'expert' || roleParam === 'developer')) {
      setRole(roleParam);
    }
  }, [profile, searchParams]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setRole(profile.user.role);
    setDisplayName(profile.user.displayName === '新用户' ? '' : profile.user.displayName);
    setHeadline(profile.card?.headline || '');
    setBasicSummary(profile.card?.basicSummary || (profile.user.basicSummary === '待补充基础信息' ? '' : profile.user.basicSummary));
    setCity(profile.user.city === '待填写' ? '' : profile.user.city);
    setDesiredDirection(profile.user.desiredDirection || profile.card?.optionalDirection || '');
    setStrengths(profile.card?.strengths.join('，') || '');
  }, [profile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await saveBasicProfile({
        role,
        displayName,
        headline,
        basicSummary,
        city,
        desiredDirection,
        strengths: strengths
          .split(/[,，\n]/)
          .map((item) => item.trim())
          .filter(Boolean),
      });
      await refresh();
      setMessage('基础信息已保存。接下来建议继续填写详细信息。');
      router.push('/onboarding/detail');
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && !authenticated) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-3">
            <p className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-wide text-secondary-foreground">需要登录</p>
            <CardTitle className="text-2xl">请先登录，再录入基础信息。</CardTitle>
            <p className="text-sm text-muted-foreground">登录后你的资料和请求记录才能被稳定保存。</p>
          </CardHeader>
          <CardContent>
            <Button
          onClick={() =>
            router.push(`/login?next=${encodeURIComponent(`/onboarding/basic${role ? `?role=${role}` : ''}`)}`)
          }
          type="button"
        >
          去登录
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!mounted) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-3">
          <p className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-wide text-secondary-foreground">基础信息</p>
          <CardTitle className="text-2xl leading-tight">先补公开信息，让别人先快速了解你在做什么。</CardTitle>
          <p className="text-sm text-muted-foreground">这一页保存的是会出现在公开卡片里的内容。</p>
          <div>
          <InfoDisclosure title="这一步会公开什么" compact>
            {role === 'expert' ? (
              <>
                <p>项目方侧重点是项目描述和所在城市。</p>
                <p>更完整的个人背景与项目细节，后续再补充。</p>
              </>
            ) : (
              <>
                <p>程序员侧重点是技能、做过的项目、偏好方向和所在城市。</p>
                <p>更完整的履历和联系方式，不会在这一步直接显示。</p>
              </>
            )}
          </InfoDisclosure>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-foreground">
          你的角色
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            name="role"
            onChange={(event) => setRole(event.target.value as 'expert' | 'developer')}
            value={role}
          >
            <option value="expert">项目方 / 行业专家</option>
            <option value="developer">程序员</option>
          </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
          对外显示名称
          <Input name="displayName" onChange={(event) => setDisplayName(event.target.value)} placeholder="例如：陈医生 / 林工" type="text" value={displayName} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
          卡片标题
          <Textarea name="headline" onChange={(event) => setHeadline(event.target.value)} placeholder="一句话说明你的项目或能力亮点" rows={3} value={headline} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
          基础信息主描述
          <Textarea name="summary" onChange={(event) => setBasicSummary(event.target.value)} placeholder="用最少的话说明你的项目或能力情况" rows={5} value={basicSummary} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
          所在城市
          <Input name="city" onChange={(event) => setCity(event.target.value)} placeholder="例如：杭州" type="text" value={city} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
          想做什么方向 / 类型的项目（程序员可选）
          <Input name="direction" onChange={(event) => setDesiredDirection(event.target.value)} placeholder="例如：AI 工具、效率平台、产业互联网" type="text" value={desiredDirection} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
          标签 / 技能（逗号分隔）
          <Input name="strengths" onChange={(event) => setStrengths(event.target.value)} placeholder="例如：Next.js，NestJS，增长实验" type="text" value={strengths} />
            </label>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <Button className="w-full sm:w-auto" disabled={submitting} type="submit">
          {submitting ? '保存中…' : '保存基础信息'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

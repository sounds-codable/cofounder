'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { fetchCards, fetchMyRequests } from '@/lib/platform-api';
import { useCardEngagementState } from '@/lib/card-engagement';
import { useAuthState } from '@/lib/use-auth';

export function DashboardOverview() {
  const { authenticated, loading, profile } = useAuthState();
  const engagement = useCardEngagementState();
  const [requestCounts, setRequestCounts] = useState({ incoming: 0, outgoing: 0 });
  const [projectCards, setProjectCards] = useState<Array<{ id: string }>>([]);
  const [developerCards, setDeveloperCards] = useState<Array<{ id: string }>>([]);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    let cancelled = false;

    async function loadOverview() {
      const [requests, projects, developers] = await Promise.all([fetchMyRequests(), fetchCards('expert'), fetchCards('developer')]);

      if (cancelled) {
        return;
      }

      setRequestCounts({
        incoming: requests.incoming.length,
        outgoing: requests.outgoing.length,
      });
      setProjectCards(projects);
      setDeveloperCards(developers);
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  const favoriteIds = useMemo(() => new Set(Object.keys(engagement.favorites)), [engagement.favorites]);
  const likeIds = useMemo(() => new Set(Object.keys(engagement.likes)), [engagement.likes]);

  const projectCounts = useMemo(
    () => ({
      created: profile?.card ? 1 : 0,
      favorited: projectCards.filter((card) => favoriteIds.has(card.id)).length,
      liked: projectCards.filter((card) => likeIds.has(card.id)).length,
    }),
    [favoriteIds, likeIds, profile, projectCards],
  );

  const developerCounts = useMemo(
    () => ({
      favorited: developerCards.filter((card) => favoriteIds.has(card.id)).length,
      liked: developerCards.filter((card) => likeIds.has(card.id)).length,
    }),
    [developerCards, favoriteIds, likeIds],
  );

  const completionItems = useMemo(
    () => [
      {
        label: '基础信息',
        value: profile?.completion.hasBasicProfile ? '已完成' : '待完善',
      },
      {
        label: '详细信息',
        value: profile?.completion.hasDetailProfile ? '已完成' : '待完善',
      },
      {
        label: '公开卡片',
        value: profile?.completion.hasPublicCard ? '已发布' : '待发布',
      },
    ],
    [profile],
  );

  const quickLinks = useMemo(
    () => [
      { href: '/requests', label: '处理请求中心', description: '统一查看我收到的请求与我发出的请求。' },
      { href: '/projects?view=created', label: '查看我创建的项目', description: '管理已发布的项目卡片与后续协作。' },
      { href: '/projects?view=favorited', label: '查看我收藏的项目', description: '回看已标记的潜在合作项目。' },
      { href: '/developers?view=favorited', label: '查看我收藏的程序员', description: '快速回到已筛选过的人选。' },
    ],
    [],
  );

  if (!loading && !authenticated) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-8">
        <Card className="border-border/70 bg-card/82 shadow-[0_16px_38px_rgba(79,108,163,0.14)]">
          <CardHeader className="space-y-3">
            <p className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-wide text-secondary-foreground">需要登录</p>
            <CardTitle className="text-2xl">请先登录，再进入控制台。</CardTitle>
            <p className="text-sm text-muted-foreground">登录后即可统一查看项目、程序员、请求和我的信息。</p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link className={buttonVariants()} href="/login?next=/dashboard">
              去登录
            </Link>
            <Link className={buttonVariants({ variant: 'outline' })} href="/projects">
              先浏览项目方
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_10%_0%,rgba(19,191,168,0.14),transparent_48%),radial-gradient(circle_at_90%_20%,rgba(76,200,255,0.14),transparent_45%)]" />
      <section className="relative grid gap-4 rounded-2xl border border-border/70 bg-card/82 p-6 shadow-[0_16px_38px_rgba(79,108,163,0.14)] backdrop-blur-sm md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <span className="inline-flex rounded-full bg-secondary/85 px-3 py-1 text-xs font-semibold tracking-wide text-secondary-foreground">控制台概览</span>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">把最常用的协作动作收敛到一个清晰的后台里。</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">这里优先展示请求、收藏、资料状态和常用入口，减少跳转层级，让你更快进入下一步操作。</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className={buttonVariants()} href="/projects">
            查看项目
          </Link>
          <Link className={buttonVariants({ variant: 'outline' })} href="/developers">
            查看程序员
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{
          title: '待处理请求', value: requestCounts.incoming, desc: '需要你响应、确认或继续推进的请求数量。'
        }, {
          title: '我发出的请求', value: requestCounts.outgoing, desc: '你已经发起，正在等待对方响应或继续推进的请求。'
        }, {
          title: '收藏的项目', value: projectCounts.favorited, desc: '你已标记并准备持续关注的项目数量。'
        }, {
          title: '收藏的程序员', value: developerCounts.favorited, desc: '你已标记并准备进一步了解的程序员数量。'
        }].map((item) => (
          <Card className="border-border/70 bg-card/82 shadow-[0_12px_30px_rgba(79,108,163,0.1)] transition-all duration-[var(--motion-normal)] ease-[var(--motion-ease)] hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(79,108,163,0.14)]" key={item.title}>
            <CardContent className="space-y-2 p-5">
              <strong className="text-sm text-muted-foreground">{item.title}</strong>
              <h3 className="text-3xl font-semibold text-foreground">{item.value}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/70 bg-card/82 shadow-[0_12px_30px_rgba(79,108,163,0.1)]">
          <CardHeader>
            <CardTitle>快捷入口</CardTitle>
            <p className="text-sm text-muted-foreground">只保留高频动作，筛选型页面入口放在这里，不再占用左侧主导航。</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickLinks.map((item) => (
              <Link
                className="grid gap-1 rounded-xl border border-border/60 bg-background/74 p-3 transition-all duration-[var(--motion-normal)] ease-[var(--motion-ease)] hover:-translate-y-0.5 hover:bg-accent/60"
                href={item.href}
                key={item.href}
              >
                <strong className="text-foreground">{item.label}</strong>
                <span className="text-sm text-muted-foreground">{item.description}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/82 shadow-[0_12px_30px_rgba(79,108,163,0.1)]">
          <CardHeader>
            <CardTitle>资料状态</CardTitle>
            <p className="text-sm text-muted-foreground">{projectCounts.created > 0 ? `你当前已发布 ${projectCounts.created} 个项目卡片。` : '完善资料后更容易被对方识别与发起请求。'}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {completionItems.map((item) => (
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/74 px-3 py-2" key={item.label}>
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <strong className={cn('text-sm', item.value.includes('待') ? 'text-destructive' : 'text-foreground')}>{item.value}</strong>
              </div>
            ))}
            <div className="flex flex-wrap gap-3 pt-1">
              <Link className={buttonVariants({ variant: 'outline' })} href="/onboarding/profile">
              我的资料
            </Link>
              <Link className={buttonVariants()} href="/onboarding/detail">
              详细信息
            </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { fetchCards, fetchMyRequests } from '@/lib/platform-api';
import { useCardEngagementState } from '@/lib/card-engagement';
import { useAuthState } from '@/lib/use-auth';

export function DashboardOverview() {
  const { authenticated, loading, profile } = useAuthState();
  const engagement = useCardEngagementState();
  const [requestCounts, setRequestCounts] = useState({ incoming: 0, outgoing: 0 });
  const [projectCounts, setProjectCounts] = useState({ favorited: 0, liked: 0, created: 0 });
  const [developerCounts, setDeveloperCounts] = useState({ favorited: 0, liked: 0 });

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

      const favoriteIds = new Set(Object.keys(engagement.favorites));
      const likeIds = new Set(Object.keys(engagement.likes));

      setRequestCounts({
        incoming: requests.incoming.length,
        outgoing: requests.outgoing.length,
      });

      setProjectCounts({
        created: profile?.user.role === 'expert' && profile.card ? 1 : 0,
        favorited: projects.filter((card) => favoriteIds.has(card.id)).length,
        liked: projects.filter((card) => likeIds.has(card.id)).length,
      });

      setDeveloperCounts({
        favorited: developers.filter((card) => favoriteIds.has(card.id)).length,
        liked: developers.filter((card) => likeIds.has(card.id)).length,
      });
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [authenticated, engagement.favorites, engagement.likes, profile?.card, profile?.user.role]);

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
      <div className="site-shell narrow-shell page-section page-stack">
        <section className="form-shell">
          <div className="section-heading left">
            <span>需要登录</span>
            <h1>请先登录，再进入控制台。</h1>
            <p>登录后即可统一查看项目、程序员、请求和我的信息。</p>
          </div>
          <div className="card-action-row left-aligned">
            <Link className="primary-button" href="/login?next=/dashboard">
              去登录
            </Link>
            <Link className="ghost-button" href="/projects">
              先浏览项目方
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack dashboard-page-stack">
      <section className="dashboard-hero-card">
        <div>
          <span className="section-chip">控制台概览</span>
          <h2>把最常用的协作动作收敛到一个清晰的后台里。</h2>
          <p>这里优先展示请求、收藏、资料状态和常用入口，减少跳转层级，让你更快进入下一步操作。</p>
        </div>
        <div className="dashboard-hero-actions">
          <Link className="primary-button" href="/projects">
            查看项目
          </Link>
          <Link className="ghost-button" href="/developers">
            查看程序员
          </Link>
        </div>
      </section>

      <section className="compact-grid dashboard-stat-grid">
        <article className="detail-card">
          <strong>待处理请求</strong>
          <h3>{requestCounts.incoming}</h3>
          <p>需要你响应、确认或继续推进的请求数量。</p>
        </article>
        <article className="detail-card">
          <strong>我发出的请求</strong>
          <h3>{requestCounts.outgoing}</h3>
          <p>你已经发起，正在等待对方响应或继续推进的请求。</p>
        </article>
        <article className="detail-card">
          <strong>收藏的项目</strong>
          <h3>{projectCounts.favorited}</h3>
          <p>你已标记并准备持续关注的项目数量。</p>
        </article>
        <article className="detail-card">
          <strong>收藏的程序员</strong>
          <h3>{developerCounts.favorited}</h3>
          <p>你已标记并准备进一步了解的程序员数量。</p>
        </article>
      </section>

      <section className="request-layout">
        <article className="detail-card">
          <h2>快捷入口</h2>
          <p>只保留高频动作，筛选型页面入口放在这里，不再占用左侧主导航。</p>
          <div className="dashboard-link-list">
            {quickLinks.map((item) => (
              <Link href={item.href} key={item.href}>
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </Link>
            ))}
          </div>
        </article>
        <article className="detail-card">
          <h2>资料状态</h2>
          <p>{profile?.user.role === 'expert' ? `你当前已发布 ${projectCounts.created} 个项目卡片。` : '完善资料后更容易被项目方识别与发起请求。'}</p>
          <div className="dashboard-completion-list">
            {completionItems.map((item) => (
              <div className="dashboard-completion-item" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          <div className="card-action-row left-aligned">
            <Link className="ghost-button" href="/onboarding/basic">
              基础信息
            </Link>
            <Link className="primary-button" href="/onboarding/detail">
              详细信息
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

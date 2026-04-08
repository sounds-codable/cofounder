'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import {
  extractErrorMessage,
  fetchAdminOverview,
  fetchAdminUserDetail,
  fetchAdminUsers,
  type AdminOverview,
  type AdminUserDetail,
  type AdminUserSearchResult,
} from '@/lib/platform-api';
import { useAuthState } from '@/lib/use-auth';

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN');
}

export default function AdminPage() {
  const { authenticated, loading, profile } = useAuthState();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserSearchResult['items']>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AdminUserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const isAdmin = Boolean(profile?.user.isAdmin);

  useEffect(() => {
    if (!authenticated || !isAdmin) {
      return;
    }

    let cancelled = false;

    async function loadInitial() {
      try {
        const [nextOverview, nextUsers] = await Promise.all([fetchAdminOverview(), fetchAdminUsers('', 30)]);

        if (cancelled) {
          return;
        }

        setOverview(nextOverview);
        setUsers(nextUsers.items);
        setMessage(null);

        if (nextUsers.items.length > 0) {
          setLoadingDetail(true);
          setSelectedUserId(nextUsers.items[0].id);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(extractErrorMessage(error));
        }
      }
    }

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, [authenticated, isAdmin]);

  useEffect(() => {
    if (!authenticated || !isAdmin || !selectedUserId) {
      return;
    }

    let cancelled = false;

    fetchAdminUserDetail(selectedUserId)
      .then((detail) => {
        if (!cancelled) {
          setSelectedDetail(detail);
          setMessage(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage(extractErrorMessage(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authenticated, isAdmin, selectedUserId]);

  const summaryItems = useMemo(() => {
    if (!overview) {
      return [];
    }

    return [
      { label: '当前注册用户', value: overview.summary.totalUsers },
      { label: '发布的项目/卡片', value: overview.summary.totalCards },
      { label: '匹配中的项目', value: overview.summary.matchingInProgress },
      { label: '匹配成功数量', value: overview.summary.matchingSuccess },
      { label: '匹配失败（拒绝）', value: overview.summary.matchingFailed },
      { label: '7天内活跃用户', value: overview.summary.activeUsersLast7Days },
      { label: '已填写详细信息用户', value: overview.summary.usersWithDetailedProfile },
      { label: '已填写联系方式用户', value: overview.summary.usersWithContacts },
    ];
  }, [overview]);

  async function handleSearch() {
    if (!isAdmin) {
      return;
    }

    try {
      const result = await fetchAdminUsers(searchKeyword, 50);
      setUsers(result.items);
      setMessage(null);
      setLoadingDetail(Boolean(result.items[0]?.id));
      setSelectedUserId(result.items[0]?.id || null);
      if (!result.items.length) {
        setSelectedDetail(null);
      }
    } catch (error) {
      setMessage(extractErrorMessage(error));
    }
  }

  if (!loading && !authenticated) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-8">
        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>请先登录后访问管理后台</CardTitle>
          </CardHeader>
          <CardContent>
            <Link className={buttonVariants()} href="/login?next=/admin">
              去登录
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!loading && authenticated && !isAdmin) {
    return (
      <div className="space-y-4">
        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>你没有管理员权限</CardTitle>
            <p className="text-sm text-muted-foreground">仅 `users.isAdmin = true` 的用户可以访问后台管理页面。</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <Card className="border-border/70 bg-card/82" key={item.label}>
            <CardContent className="space-y-2 p-5">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-3xl font-semibold text-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>排行榜</CardTitle>
            <p className="text-sm text-muted-foreground">邀请最多 / 发项目最多 / 参与联系最多</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: '邀请最多', items: overview?.leaders.invitedLeaders || [] },
              { title: '发项目最多', items: overview?.leaders.projectLeaders || [] },
              { title: '参与联系最多', items: overview?.leaders.participationLeaders || [] },
            ].map((group) => (
              <div className="space-y-2" key={group.title}>
                <p className="text-sm font-medium text-foreground">{group.title}</p>
                {group.items.length ? (
                  group.items.map((item) => (
                    <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2" key={`${group.title}-${item.userId}`}>
                      <p className="text-sm text-foreground">{item.displayName}</p>
                      <p className="text-xs text-muted-foreground">{item.email || '未绑定邮箱'}</p>
                      <p className="text-xs text-muted-foreground">次数：{item.count}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">暂无数据</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/82 xl:col-span-2">
          <CardHeader>
            <CardTitle>管理员说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(overview?.adminNotes || []).map((note) => (
              <p className="text-sm text-muted-foreground" key={note}>
                {note}
              </p>
            ))}
            {overview ? (
              <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-3 text-sm text-muted-foreground">
                积分交易总记录：{overview.summary.totalRewardTransactions} 条
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>查找用户</CardTitle>
            <div className="flex gap-2">
              <input
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                placeholder="输入昵称或邮箱"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleSearch();
                  }
                }}
              />
              <button className={buttonVariants()} type="button" onClick={() => void handleSearch()}>
                查找
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.length ? (
              users.map((item) => (
                <button
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    selectedUserId === item.id
                      ? 'border-secondary/70 bg-secondary/10'
                      : 'border-border/60 bg-background/70 hover:bg-accent/60'
                  }`}
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setLoadingDetail(true);
                    setSelectedUserId(item.id);
                  }}
                >
                  <p className="text-sm font-medium text-foreground">{item.displayName}</p>
                  <p className="text-xs text-muted-foreground">{item.email || '未绑定邮箱'}</p>
                  <p className="text-xs text-muted-foreground">卡片 {item.cardsCount} · 邀请 {item.invitedUsersCount} · 积分 {item.points}</p>
                  {item.isAdmin ? <p className="mt-1 text-xs font-medium text-sky-700">管理员</p> : null}
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">没有找到用户</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>用户详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingDetail ? <p className="text-sm text-muted-foreground">加载中…</p> : null}
            {!loadingDetail && !selectedDetail ? <p className="text-sm text-muted-foreground">请选择一个用户查看详情</p> : null}
            {selectedDetail ? (
              <>
                <div className="grid gap-2 rounded-xl border border-border/60 bg-background/70 p-3 text-sm">
                  <p>昵称：{selectedDetail.user.displayName}</p>
                  <p>邮箱：{selectedDetail.user.email || '未绑定邮箱'}</p>
                  <p>用户ID：{selectedDetail.user.id}</p>
                  <p>管理员：{selectedDetail.user.isAdmin ? '是' : '否'}</p>
                  <p>注册时间：{formatDate(selectedDetail.user.createdAt)}</p>
                  <p>最近登录：{formatDate(selectedDetail.user.lastLoginAt)}</p>
                  <p>邀请码：{selectedDetail.user.inviteCode || '未激活'}</p>
                </div>

                <div className="grid gap-2 rounded-xl border border-border/60 bg-background/70 p-3 text-sm">
                  <p className="font-medium text-foreground">详细资料</p>
                  <pre className="whitespace-pre-wrap break-all text-xs text-muted-foreground">{JSON.stringify(selectedDetail.user.detailedProfile, null, 2)}</pre>
                </div>

                <div className="grid gap-2 rounded-xl border border-border/60 bg-background/70 p-3 text-sm">
                  <p className="font-medium text-foreground">项目卡片（{selectedDetail.cards.length}）</p>
                  {selectedDetail.cards.length ? (
                    selectedDetail.cards.map((card) => (
                      <div className="rounded-md border border-border/60 bg-background/80 px-3 py-2" key={card.id}>
                        <p>{card.headline}</p>
                        <p className="text-xs text-muted-foreground">{card.city} · {card.role}</p>
                        <a className="text-xs text-sky-700 underline" href={card.link} target="_blank" rel="noreferrer">
                          {card.link}
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">暂无卡片</p>
                  )}
                </div>

                <div className="grid gap-2 rounded-xl border border-border/60 bg-background/70 p-3 text-sm">
                  <p className="font-medium text-foreground">互动与联系</p>
                  <p>点赞：{selectedDetail.engagements.likesCount}</p>
                  <p>收藏：{selectedDetail.engagements.favoritesCount}</p>
                  <p>参与请求：{selectedDetail.requests.total}</p>
                  <p>邀请人数：{selectedDetail.invitation.invitedUsersCount}</p>
                  <p>积分：{selectedDetail.rewards.totalPoints}</p>
                </div>

                <div className="grid gap-2 rounded-xl border border-border/60 bg-background/70 p-3 text-sm">
                  <p className="font-medium text-foreground">状态分布</p>
                  {Object.entries(selectedDetail.requests.statusCount).map(([status, count]) => (
                    <p key={status}>
                      {status}: {count}
                    </p>
                  ))}
                </div>

                <div className="grid gap-2 rounded-xl border border-border/60 bg-background/70 p-3 text-sm">
                  <p className="font-medium text-foreground">数据库手动设置管理员 SQL</p>
                  <code className="block overflow-auto whitespace-pre-wrap break-all text-xs text-foreground">{selectedDetail.adminHints.updateAdminSql}</code>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </section>

      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </div>
  );
}

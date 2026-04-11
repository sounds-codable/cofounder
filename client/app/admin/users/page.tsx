'use client';

import { useEffect, useState } from 'react';
import { AdminPageShell, formatAdminDate } from '@/components/admin/admin-page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import {
  extractErrorMessage,
  fetchAdminUserDetail,
  fetchAdminUsers,
  type AdminUserDetail,
  type AdminUserSearchResult,
} from '@/lib/platform-api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserSearchResult['items']>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AdminUserDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchAdminUsers('', 30)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setUsers(result.items);
        setSelectedUserId(result.items[0]?.id || null);
        setMessage(null);
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage(extractErrorMessage(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingList(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedDetail(null);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);

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
  }, [selectedUserId]);

  async function handleSearch() {
    try {
      setLoadingList(true);
      const result = await fetchAdminUsers(searchKeyword, 50);
      setUsers(result.items);
      setSelectedUserId(result.items[0]?.id || null);
      setMessage(null);
      if (!result.items.length) {
        setSelectedDetail(null);
      }
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setLoadingList(false);
    }
  }

  return (
    <AdminPageShell title="用户查询" description="按昵称/邮箱检索用户，查看用户画像、卡片、互动、请求与积分信息。">
      <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>查找用户</CardTitle>
            <div className="flex gap-2">
              <input
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                onChange={(event) => setSearchKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleSearch();
                  }
                }}
                placeholder="输入昵称或邮箱"
                value={searchKeyword}
              />
              <button className={buttonVariants()} onClick={() => void handleSearch()} type="button">
                查找
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingList ? <p className="text-sm text-muted-foreground">加载中…</p> : null}
            {!loadingList && users.length ? (
              users.map((item) => (
                <button
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    selectedUserId === item.id
                      ? 'border-secondary/70 bg-secondary/10'
                      : 'border-border/60 bg-background/70 hover:bg-accent/60'
                  }`}
                  key={item.id}
                  onClick={() => setSelectedUserId(item.id)}
                  type="button"
                >
                  <p className="text-sm font-medium text-foreground">{item.displayName}</p>
                  <p className="text-xs text-muted-foreground">{item.email || '未绑定邮箱'}</p>
                  <p className="text-xs text-muted-foreground">卡片 {item.cardsCount} · 邀请 {item.invitedUsersCount} · 积分 {item.points}</p>
                  {item.isAdmin ? <p className="mt-1 text-xs font-medium text-sky-700">管理员</p> : null}
                </button>
              ))
            ) : null}
            {!loadingList && !users.length ? <p className="text-sm text-muted-foreground">没有找到用户</p> : null}
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
                  <p>注册时间：{formatAdminDate(selectedDetail.user.createdAt)}</p>
                  <p>最近登录：{formatAdminDate(selectedDetail.user.lastLoginAt)}</p>
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
                        <a className="text-xs text-sky-700 underline" href={card.link} rel="noreferrer" target="_blank">
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
    </AdminPageShell>
  );
}

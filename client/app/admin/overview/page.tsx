'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { extractErrorMessage, fetchAdminOverview, type AdminOverview } from '@/lib/platform-api';

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchAdminOverview()
      .then((result) => {
        if (!cancelled) {
          setOverview(result);
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
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <AdminPageShell title="运营概览" description="查看平台整体统计、排行榜与管理说明。">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <Card className="border-border/70 bg-card/82" key={item.label}>
            <CardContent className="space-y-2 p-5">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-3xl font-semibold text-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
        {loading && !summaryItems.length ? <p className="text-sm text-muted-foreground">加载中…</p> : null}
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

      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </AdminPageShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPageShell, formatAdminDate } from '@/components/admin/admin-page-shell';
import { extractErrorMessage, fetchAdminDailyFeed, type AdminDailyFeed } from '@/lib/platform-api';

export default function AdminPage() {
  const [feed, setFeed] = useState<AdminDailyFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchAdminDailyFeed(20)
      .then((result) => {
        if (!cancelled) {
          setFeed(result);
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

  return (
    <AdminPageShell
      title="每日必看"
      description="将需要每天优先处理的内容集中展示：违规风险、最新留言、新项目/程序员、新注册用户。"
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>风险待处理队列</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? <p className="text-sm text-muted-foreground">加载中…</p> : null}
            {!loading && !feed?.riskQueue.length ? <p className="text-sm text-muted-foreground">暂无高优先级风险内容。</p> : null}
            {feed?.riskQueue.map((item) => (
              <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs" key={item.id}>
                <p>时间：{formatAdminDate(item.operationAt)} · 类型：{item.operationType}</p>
                <p>等级：{item.riskLevel || 'none'} · 用户：{item.userEmail || item.userId}</p>
                <p>分类：{item.categories.join('、') || '无'} · 命中词：{item.matchedTerms.join('、') || '无'}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>最新留言</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? <p className="text-sm text-muted-foreground">加载中…</p> : null}
            {!loading && !feed?.recentMessages.length ? <p className="text-sm text-muted-foreground">暂无留言。</p> : null}
            {feed?.recentMessages.map((item) => (
              <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs" key={item.id}>
                <p>时间：{formatAdminDate(item.createdAt)} · 联系方式：{item.contact}</p>
                <p>称呼：{item.name || '匿名'}</p>
                <p className="line-clamp-2 text-muted-foreground">{item.message}</p>
                {item.risk?.reviewRequired ? <p className="text-destructive">风险：{item.risk.riskLevel || 'unknown'} · {item.risk.categories.join('、') || '未知'}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>新项目 / 程序员</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? <p className="text-sm text-muted-foreground">加载中…</p> : null}
            {!loading && !feed?.recentCards.length ? <p className="text-sm text-muted-foreground">暂无新增卡片。</p> : null}
            {feed?.recentCards.map((item) => (
              <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs" key={item.id}>
                <p>时间：{formatAdminDate(item.createdAt)} · 类型：{item.role === 'expert' ? '项目方' : '程序员'}</p>
                <p>{item.headline} · {item.city}</p>
                <p className="text-muted-foreground">发布者：{item.ownerName}（{item.ownerEmail || '未绑定邮箱'}）</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>新注册用户</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? <p className="text-sm text-muted-foreground">加载中…</p> : null}
            {!loading && !feed?.recentUsers.length ? <p className="text-sm text-muted-foreground">暂无新增用户。</p> : null}
            {feed?.recentUsers.map((item) => (
              <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs" key={item.id}>
                <p>时间：{formatAdminDate(item.createdAt)} · 昵称：{item.displayName}</p>
                <p>邮箱：{item.email || '未绑定邮箱'} · 最近登录：{formatAdminDate(item.lastLoginAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </AdminPageShell>
  );
}

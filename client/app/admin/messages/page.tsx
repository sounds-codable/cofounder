'use client';

import { useEffect, useState } from 'react';
import { AdminPageShell, formatAdminDate } from '@/components/admin/admin-page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { extractErrorMessage, fetchAdminPublicWelfareMessages, type AdminPublicWelfareMessages } from '@/lib/platform-api';

export default function AdminMessagesPage() {
  const [query, setQuery] = useState('');
  const [riskOnly, setRiskOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<AdminPublicWelfareMessages | null>(null);

  async function loadMessages(nextQuery = query, nextRiskOnly = riskOnly) {
    setLoading(true);
    try {
      const result = await fetchAdminPublicWelfareMessages({
        query: nextQuery,
        riskOnly: nextRiskOnly,
        limit: 100,
      });
      setData(result);
      setMessage(null);
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetchAdminPublicWelfareMessages({ query: '', riskOnly: false, limit: 100 })
      .then((result) => {
        if (!cancelled) {
          setData(result);
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
    <AdminPageShell title="留言管理" description="集中查看公益留言，支持关键词检索与风险留言筛选。">
      <Card className="border-border/70 bg-card/82">
        <CardHeader>
          <CardTitle>筛选</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <input
            className="h-10 min-w-[220px] flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void loadMessages();
              }
            }}
            placeholder="搜索称呼 / 联系方式 / 留言内容"
            value={query}
          />
          <button
            className={buttonVariants({ variant: riskOnly ? 'default' : 'outline' })}
            onClick={() => {
              const next = !riskOnly;
              setRiskOnly(next);
              void loadMessages(query, next);
            }}
            type="button"
          >
            {riskOnly ? '仅看风险：开' : '仅看风险：关'}
          </button>
          <button className={buttonVariants()} onClick={() => void loadMessages()} type="button">
            查询
          </button>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/82">
        <CardHeader>
          <CardTitle>留言列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">加载中…</p> : null}
          {!loading && !data?.items.length ? <p className="text-sm text-muted-foreground">暂无匹配留言。</p> : null}
          {data?.items.map((item) => (
            <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-3 text-sm" key={item.id}>
              <p className="text-xs text-muted-foreground">时间：{formatAdminDate(item.createdAt)}</p>
              <p>称呼：{item.name || '匿名'}</p>
              <p>联系方式：{item.contact}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{item.message}</p>
              {item.risk?.reviewRequired ? (
                <p className="mt-2 text-xs text-destructive">
                  风险：{item.risk.riskLevel || 'unknown'} · 分类：{item.risk.categories.join('、') || '未知'} · 命中词：
                  {item.risk.matchedTerms.join('、') || '未知'}
                </p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </AdminPageShell>
  );
}

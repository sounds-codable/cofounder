'use client';

import { useEffect, useState } from 'react';
import { AdminPageShell, formatAdminDate } from '@/components/admin/admin-page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { extractErrorMessage, fetchAdminComplianceLogs, type AdminComplianceLogs } from '@/lib/platform-api';

export default function AdminCompliancePage() {
  const [logs, setLogs] = useState<AdminComplianceLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function loadLogs() {
    setLoading(true);
    try {
      const result = await fetchAdminComplianceLogs(100);
      setLogs(result);
      setMessage(null);
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, []);

  return (
    <AdminPageShell
      title="合规日志"
      description="留存用户账号、操作时间、操作类型、网络源/目标地址与端口、客户端硬件特征及发布信息记录。"
    >
      <Card className="border-border/70 bg-card/82">
        <CardHeader>
          <CardTitle>日志操作</CardTitle>
        </CardHeader>
        <CardContent>
          <button className={buttonVariants()} disabled={loading} onClick={() => void loadLogs()} type="button">
            {loading ? '刷新中…' : '刷新日志'}
          </button>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>操作审计日志（最近 {logs?.operationLogs.length || 0} 条）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!loading && !logs?.operationLogs.length ? <p className="text-sm text-muted-foreground">暂无操作审计日志。</p> : null}
            {logs?.operationLogs.map((item) => (
              <div className="rounded-md border border-border/60 bg-background/80 px-3 py-2 text-xs" key={item.id}>
                <p>时间：{formatAdminDate(item.operationAt)} · 用户：{item.userEmail || item.userId || '匿名'}</p>
                <p>操作：{item.operationType} · 请求：{item.requestMethod} {item.requestPath}</p>
                <p>状态：{item.statusCode ?? '—'} · 成功：{item.success ? '是' : '否'} · 耗时：{item.durationMs}ms</p>
                <p>网络：{item.sourceAddress || '—'}:{item.sourcePort ?? '—'} → {item.destinationAddress || '—'}:{item.destinationPort ?? '—'}</p>
                <p>客户端硬件特征：{item.clientHardware || '—'}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>发布信息记录（最近 {logs?.publishedRecords.length || 0} 条）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!loading && !logs?.publishedRecords.length ? <p className="text-sm text-muted-foreground">暂无发布信息记录。</p> : null}
            {logs?.publishedRecords.map((item) => (
              <div className="rounded-md border border-border/60 bg-background/80 px-3 py-2 text-xs" key={item.id}>
                <p>时间：{formatAdminDate(item.operationAt)} · 用户：{item.userEmail || item.userId}</p>
                <p>类型：{item.operationType} · 卡片：{item.cardPublicCode || item.cardId || '—'}</p>
                <p>风险：{item.reviewRequired ? '需审核' : '无需审核'} · 等级：{item.riskLevel || 'none'} · 人工确认：{item.confirmedToPublish ? '是' : '否'}</p>
                <p>分类：{item.riskCategories.join('、') || '无'} · 命中词：{item.riskMatchedTerms.join('、') || '无'}</p>
                <pre className="mt-1 whitespace-pre-wrap break-all rounded border border-border/50 bg-background/90 px-2 py-1 text-xs text-muted-foreground">
                  {JSON.stringify(item.contentSnapshot, null, 2)}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </AdminPageShell>
  );
}

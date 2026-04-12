'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { extractErrorMessage, fetchPointsOverview, type PointsOverview } from '@/lib/platform-api';
import { formatBeijingDateTime } from '@/lib/time';
import { useAuthState } from '@/lib/use-auth';

export default function PointsPage() {
  const { authenticated, loading } = useAuthState();
  const [data, setData] = useState<PointsOverview | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    let cancelled = false;
    fetchPointsOverview()
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
      });

    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  if (!loading && !authenticated) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-8">
        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>请先登录后查看积分</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-border/70 bg-card/82">
        <CardHeader>
          <CardTitle>当前积分</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-semibold text-foreground">{data?.totalPoints ?? 0}</p>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/82">
        <CardHeader>
          <CardTitle>积分明细</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data?.history?.length ? (
            data.history.map((item) => (
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-3 py-2" key={item.id}>
                <div>
                  <p className="text-sm text-foreground">{item.description}</p>
                  {item.action === 'invite_user' && item.relatedUserDisplayName ? (
                    <p className="text-xs text-muted-foreground">邀请用户：{item.relatedUserDisplayName}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">{formatBeijingDateTime(item.createdAt)}</p>
                </div>
                <span className="text-sm font-medium text-foreground">+{item.points}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">暂无积分记录。</p>
          )}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/82">
        <CardHeader>
          <CardTitle>积分规则</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data?.rules || []).map((rule) => (
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-3 py-2" key={rule.action}>
              <span className="text-sm text-foreground">{rule.label}</span>
              <span className="text-sm font-medium text-foreground">+{rule.points}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

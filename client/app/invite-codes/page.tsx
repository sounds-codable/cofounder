'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from '@/lib/use-auth';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { extractErrorMessage, fetchInviteOverview, type InviteOverview } from '@/lib/platform-api';
import { formatBeijingDateTime } from '@/lib/time';
import { copyTextToClipboard } from '@/lib/utils';

export default function InviteCodesPage() {
  const { authenticated, loading } = useAuthState();
  const [data, setData] = useState<InviteOverview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const loadingData = authenticated && !data && !message;

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    let cancelled = false;
    fetchInviteOverview()
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

  async function handleCopyShareText() {
    if (!data?.shareText) {
      return;
    }

    const copied = await copyTextToClipboard(data.shareText);
    setMessage(copied ? '分享文案已复制，你可以直接发到朋友圈/小红书。' : '复制失败，请手动长按或选择文本后复制。');
  }

  if (!loading && !authenticated) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-8">
        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>请先登录后查看邀请码</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-border/70 bg-card/82">
        <CardHeader>
          <CardTitle>邀请码管理</CardTitle>
          <p className="text-sm text-muted-foreground">{data?.activationGuide || '激活邀请码的方式：添加项目，或登记程序员信息。'}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.invitedBy ? (
            <div className="rounded-xl border border-sky-300/70 bg-sky-50/70 px-4 py-3">
              <p className="text-xs text-sky-800">邀请我的用户</p>
              <p className="mt-1 text-base font-semibold text-sky-950">{data.invitedBy.displayName || '未命名用户'}</p>
            </div>
          ) : null}
          <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-3">
            <p className="text-xs text-muted-foreground">我的邀请码</p>
            <p className="mt-1 text-2xl font-semibold tracking-wide text-foreground">{loadingData ? '生成中…' : data?.inviteCode || '暂未激活'}</p>
            {data?.inviteLink ? <p className="mt-2 break-all text-xs text-muted-foreground">{data.inviteLink}</p> : null}
          </div>
          <button className={buttonVariants()} disabled={!data?.shareText} type="button" onClick={() => void handleCopyShareText()}>
            分享邀请码
          </button>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/82">
        <CardHeader>
          <CardTitle>通过我邀请码注册的用户</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data?.invitedUsers?.length ? (
            data.invitedUsers.map((user) => (
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-3 py-2" key={user.id}>
                <div>
                  <p className="text-sm text-foreground">{user.displayName || '未命名用户'}</p>
                  <p className="text-xs text-muted-foreground">注册时间：{formatBeijingDateTime(user.registeredAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">暂无通过你邀请码注册并完成激活的用户。</p>
          )}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

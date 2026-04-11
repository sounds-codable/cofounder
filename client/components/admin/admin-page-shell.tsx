'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthState } from '@/lib/use-auth';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { href: '/admin', label: '每日必看', exact: true },
  { href: '/admin/messages', label: '留言管理' },
  { href: '/admin/overview', label: '运营概览' },
  { href: '/admin/users', label: '用户查询' },
  { href: '/admin/compliance', label: '合规日志' },
];

export function formatAdminDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN');
}

function AdminSubNav() {
  const pathname = usePathname();

  return (
    <Card className="border-border/70 bg-card/82">
      <CardContent className="flex flex-wrap gap-2 p-3">
        {adminNavItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                buttonVariants({ variant: active ? 'default' : 'outline', size: 'sm' }),
                'h-8 rounded-full px-4'
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

type AdminPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AdminPageShell({ title, description, children }: AdminPageShellProps) {
  const { authenticated, loading, profile } = useAuthState();
  const isAdmin = Boolean(profile?.user.isAdmin);

  if (!loading && !authenticated) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <AdminSubNav />
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
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <AdminSubNav />
        <Card className="border-border/70 bg-card/82">
          <CardHeader>
            <CardTitle>你没有管理员权限</CardTitle>
            <p className="text-sm text-muted-foreground">仅 `users.isAdmin = true` 的用户可以访问后台管理页面。</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!authenticated || !isAdmin) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <AdminSubNav />
        <Card className="border-border/70 bg-card/82">
          <CardContent className="p-6 text-sm text-muted-foreground">正在校验管理员权限…</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <AdminSubNav />
      <Card className="border-border/70 bg-card/82">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
      </Card>
      {children}
    </div>
  );
}

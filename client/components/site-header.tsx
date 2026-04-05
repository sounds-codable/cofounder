'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { clearStoredAccessToken } from '@/lib/session';
import type { LogoVariant } from '@/lib/platform-api';
import { useAuthState } from '@/lib/use-auth';

const navItems = [
  { href: '/projects', label: '项目库' },
  { href: '/developers', label: '程序员' },
  { href: '/public-welfare', label: '公益' },
  { href: '/origin', label: '缘起' },
];

type SiteHeaderProps = {
  logoVariant?: LogoVariant;
};

export function SiteHeader({ logoVariant = 'overlap' }: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const { authenticated, profile } = useAuthState();

  function handleLogout() {
    startTransition(() => {
      clearStoredAccessToken();

      if (pathname.startsWith('/requests') || pathname.startsWith('/onboarding') || pathname.startsWith('/dashboard')) {
        router.replace('/');
      }

      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex w-[min(1180px,calc(100vw-48px))] flex-wrap items-center gap-3 py-3 md:flex-nowrap md:justify-between">
        <Link className="inline-flex min-w-0 items-center gap-3" href="/">
          <span aria-hidden="true" className={`brand-mark brand-mark-${logoVariant}`}>
            <span className="brand-mark-core" />
            <span className="brand-mark-core brand-mark-core-alt" />
            <span className="brand-mark-dot" />
          </span>
          <div className="grid gap-0.5">
            <strong className="text-sm font-semibold text-foreground md:text-base">叩饭 Cofounder</strong>
            <span className="text-xs text-muted-foreground md:text-sm">行业专家 × 程序员，先做 MVP 再谈更远</span>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 md:gap-2" aria-label="主导航">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: pathname.startsWith(item.href) ? 'secondary' : 'ghost', size: 'sm' }),
                'rounded-full text-xs md:text-sm'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {authenticated && profile ? (
            <>
              <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')} href="/dashboard">
                {profile.user.displayName}
              </Link>
              <button className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'rounded-full')} onClick={handleLogout} type="button">
                {pending ? '退出中…' : '退出'}
              </button>
            </>
          ) : (
            <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')} href="/login">
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

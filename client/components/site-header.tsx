'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { clearStoredAccessToken } from '@/lib/session';
import { useAuthState } from '@/lib/use-auth';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/projects', label: '项目方' },
  { href: '/developers', label: '程序员' },
  { href: '/requests', label: '请求中心' },
  { href: '/onboarding/basic', label: '录入资料' },
];

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const { authenticated, profile } = useAuthState();

  function handleLogout() {
    startTransition(() => {
      clearStoredAccessToken();

      if (pathname.startsWith('/requests') || pathname.startsWith('/onboarding')) {
        router.replace('/');
      }

      router.refresh();
    });
  }

  return (
    <header className="site-header">
      <div className="site-shell header-inner">
        <Link className="brand" href="/">
          <span className="brand-mark">叩</span>
          <div>
            <strong>叩饭 Cofounder</strong>
            <span>行业专家 × 程序员，先做 MVP 再谈更远</span>
          </div>
        </Link>
        <nav className="nav-links" aria-label="主导航">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          {authenticated && profile ? (
            <>
              <Link className="ghost-button" href="/requests">
                {profile.user.displayName}
              </Link>
              <button className="icon-button" onClick={handleLogout} type="button">
                {pending ? '退出中…' : '退出'}
              </button>
            </>
          ) : (
            <Link className="ghost-button" href="/login">
              登录
            </Link>
          )}
          <Link className="primary-button" href={authenticated ? '/onboarding/detail' : '/login?next=/onboarding/detail'}>
            填写详细信息
          </Link>
        </div>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, type ReactNode, useEffect, useRef, useState, useTransition } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchOverview, type LogoVariant } from '@/lib/platform-api';
import { clearStoredAccessToken } from '@/lib/session';
import { useAuthState } from '@/lib/use-auth';

type AppShellProps = {
  children: ReactNode;
};

type DashboardNavGroup = {
  title: string;
  items: Array<{
    href: string;
    label: string;
    icon: 'dashboard' | 'requests' | 'projects' | 'developers' | 'profile';
    match?: 'exact' | 'prefix';
  }>;
};

const dashboardNavGroups: DashboardNavGroup[] = [
  {
    title: '工作台',
    items: [
      { href: '/dashboard', label: '控制台', icon: 'dashboard', match: 'exact' },
      { href: '/requests', label: '请求中心', icon: 'requests', match: 'prefix' },
    ],
  },
  {
    title: '内容',
    items: [
      { href: '/projects', label: '项目管理', icon: 'projects', match: 'prefix' },
      { href: '/developers', label: '程序员', icon: 'developers', match: 'prefix' },
    ],
  },
  {
    title: '账号',
    items: [
      { href: '/onboarding/basic', label: '我的资料', icon: 'profile', match: 'prefix' },
    ],
  },
];

function DashboardNavIcon({ icon }: { icon: DashboardNavGroup['items'][number]['icon'] }) {
  if (icon === 'dashboard') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" fill="currentColor" />
      </svg>
    );
  }

  if (icon === 'requests') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M6 3h9l5 5v12a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M15 3v6h6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 13h8M8 17h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === 'projects') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (icon === 'developers') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="9" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 18c.9-2.3 2.7-3.5 5-3.5s4.1 1.2 5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="17.5" cy="10" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 19c1.1-2.9 3.1-4.3 6-4.3s4.9 1.4 6 4.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DashboardToggleIcon({ mobile, expanded }: { mobile: boolean; expanded: boolean }) {
  if (mobile) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (expanded) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function isDashboardRoute(pathname: string) {
  return ['/dashboard', '/projects', '/developers', '/requests', '/onboarding', '/cards'].some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function getPageTitle(pathname: string) {
  if (pathname === '/dashboard') {
    return '控制台';
  }

  if (pathname.startsWith('/projects')) {
    return '项目';
  }

  if (pathname.startsWith('/developers')) {
    return '程序员';
  }

  if (pathname.startsWith('/requests')) {
    return '请求中心';
  }

  if (pathname.startsWith('/onboarding')) {
    return '我的资料';
  }

  if (pathname.startsWith('/cards')) {
    return '卡片详情';
  }

  return '控制台';
}

function AppShellContent({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [logoVariant, setLogoVariant] = useState<LogoVariant>('overlap');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [desktopViewport, setDesktopViewport] = useState(false);
  const [pending, startTransition] = useTransition();
  const { authenticated, profile } = useAuthState();

  const showDashboardShell = authenticated && pathname !== '/login' && pathname !== '/' && isDashboardRoute(pathname);

  useEffect(() => {
    let cancelled = false;

    async function loadLogoVariant() {
      const overview = await fetchOverview();

      if (!cancelled && overview?.logoVariant) {
        setLogoVariant(overview.logoVariant);
      }
    }

    void loadLogoVariant();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 981px)');

    function syncViewport(matches: boolean) {
      setDesktopViewport(matches);

      if (matches) {
        setSidebarOpen(false);
      }
    }

    syncViewport(mediaQuery.matches);

    function handleChange(event: MediaQueryListEvent) {
      syncViewport(event.matches);
    }

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSidebarOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname, sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!userMenuOpen) {
      return;
    }

    function handleOutsideClick(event: MouseEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [userMenuOpen]);

  function handleLogout() {
    startTransition(() => {
      clearStoredAccessToken();
      router.replace('/');
      router.refresh();
    });
  }

  function handleSidebarToggle() {
    if (desktopViewport) {
      setSidebarExpanded((current) => !current);
      return;
    }

    setSidebarOpen(true);
  }

  function handleSidebarCollapse() {
    if (desktopViewport) {
      setSidebarExpanded((current) => !current);
      return;
    }

    setSidebarOpen(false);
  }

  if (!showDashboardShell) {
    return (
      <>
        <SiteHeader logoVariant={logoVariant} />
        <main>{children}</main>
        <SiteFooter />
      </>
    );
  }

  return (
    <div className={cn('relative min-h-screen bg-background', sidebarExpanded ? 'is-sidebar-expanded' : undefined)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_8%_0%,rgba(124,141,255,0.16),transparent_46%),radial-gradient(circle_at_92%_8%,rgba(87,217,197,0.14),transparent_44%)]" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 gap-4 px-3 py-3 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-4 lg:py-4">
        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/88 px-4 py-3 shadow-[0_14px_34px_rgba(79,108,163,0.12)] backdrop-blur-sm lg:col-span-2">
          <Link className="inline-flex items-center gap-3" href="/dashboard">
            <span aria-hidden="true" className={`brand-mark brand-mark-${logoVariant}`}>
              <span className="brand-mark-core" />
              <span className="brand-mark-core brand-mark-core-alt" />
              <span className="brand-mark-dot" />
            </span>
            <div className="grid gap-0.5">
              <strong className="text-sm font-semibold text-foreground md:text-base">叩饭 Cofounder</strong>
              <span className="text-xs text-muted-foreground">协作后台</span>
            </div>
          </Link>
          {profile ? (
            <div className="relative" ref={userMenuRef}>
                <button
                  aria-label="打开用户菜单"
                  className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'rounded-full')}
                  onClick={() => setUserMenuOpen((current) => !current)}
                  type="button"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M6 19c1.1-2.9 3.1-4.3 6-4.3s4.9 1.4 6 4.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  </svg>
                </button>
                {userMenuOpen ? (
                  <div className="absolute right-0 top-12 z-50 grid min-w-56 gap-3 rounded-xl border border-border/70 bg-card/96 p-3 shadow-[0_14px_32px_rgba(79,108,163,0.2)] backdrop-blur-sm">
                    <p className="text-xs text-muted-foreground">{profile.user.email}</p>
                    <button className={buttonVariants({ variant: 'outline' })} onClick={handleLogout} type="button">
                      {pending ? '退出中…' : '退出登录'}
                    </button>
                  </div>
                ) : null}
            </div>
          ) : null}
        </div>

        <aside className={cn('rounded-2xl border border-border/70 bg-card/68 shadow-[0_14px_34px_rgba(79,108,163,0.12)] backdrop-blur-sm', sidebarOpen ? 'is-open' : undefined)}>
          <div className="flex h-full flex-col justify-between p-4">
            <nav className="space-y-5" aria-label="后台导航">
              {dashboardNavGroups.map((group) => (
                <div className="space-y-2" key={group.title}>
                  <p className="px-2 text-xs font-semibold tracking-wide text-muted-foreground">{group.title}</p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = item.match === 'prefix' ? pathname.startsWith(item.href) : pathname === item.href;

                      return (
                        <Link
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all duration-[var(--motion-normal)] ease-[var(--motion-ease)]',
                            active ? 'bg-secondary text-secondary-foreground shadow-[0_8px_20px_rgba(124,141,255,0.18)]' : 'text-muted-foreground hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground'
                          )}
                          data-tooltip={item.label}
                          href={item.href}
                          key={item.href}
                          onClick={() => setSidebarOpen(false)}
                          title={item.label}
                        >
                          <span aria-hidden="true" className="inline-flex size-4 items-center justify-center">
                            <DashboardNavIcon icon={item.icon} />
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="pt-4">
              <button
                aria-label={desktopViewport ? (sidebarExpanded ? '收起侧边导航' : '展开侧边导航') : '收起导航菜单'}
                className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'rounded-full')}
                data-tooltip={desktopViewport ? (sidebarExpanded ? '收起导航' : '展开导航') : '收起导航'}
                title={desktopViewport ? (sidebarExpanded ? '收起导航' : '展开导航') : '收起导航'}
                onClick={handleSidebarCollapse}
                type="button"
              >
                <DashboardToggleIcon expanded={sidebarExpanded} mobile={!desktopViewport} />
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen ? <button aria-label="关闭侧边导航" className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} type="button" /> : null}

        <div className="min-w-0 rounded-2xl border border-border/70 bg-background/76 shadow-[0_16px_36px_rgba(79,108,163,0.1)] backdrop-blur-sm">
          <div className="border-b border-border/60 px-5 py-4">
            <h1 className="text-xl font-semibold text-foreground">{getPageTitle(pathname)}</h1>
          </div>
          <main className="px-4 py-5 md:px-6">{children}</main>
        </div>
      </div>
      <SiteFooter className="mt-auto" contentClassName="max-w-[1400px]" />
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <Suspense
      fallback={
        <>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </>
      }
    >
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
}

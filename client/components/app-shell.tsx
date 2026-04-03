'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, type ReactNode, useEffect, useState, useTransition } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
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
    icon: string;
    match?: 'exact' | 'prefix';
  }>;
};

const dashboardNavGroups: DashboardNavGroup[] = [
  {
    title: '工作台',
    items: [
      { href: '/dashboard', label: '控制台', icon: '总', match: 'exact' },
      { href: '/requests', label: '请求中心', icon: '请', match: 'prefix' },
    ],
  },
  {
    title: '内容',
    items: [
      { href: '/projects', label: '项目管理', icon: '项', match: 'prefix' },
      { href: '/developers', label: '程序员', icon: '程', match: 'prefix' },
    ],
  },
  {
    title: '账号',
    items: [
      { href: '/onboarding/basic', label: '我的资料', icon: '我', match: 'prefix' },
    ],
  },
];

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

function getPageDescription(pathname: string) {
  if (pathname === '/dashboard') {
    return '集中查看关键数据、常用入口与资料状态';
  }

  if (pathname.startsWith('/projects')) {
    return '浏览、发布和整理项目方卡片';
  }

  if (pathname.startsWith('/developers')) {
    return '筛选、收藏与查看程序员卡片';
  }

  if (pathname.startsWith('/requests')) {
    return '统一处理授权请求与协作进度';
  }

  if (pathname.startsWith('/onboarding')) {
    return '维护你的公开资料与详细信息';
  }

  if (pathname.startsWith('/cards')) {
    return '查看当前卡片的公开信息与授权状态';
  }

  return '简洁清晰地管理你的协作后台';
}

function getRoleLabel(role: 'expert' | 'developer') {
  return role === 'expert' ? '项目方 / 行业专家' : '程序员';
}

function AppShellContent({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoVariant, setLogoVariant] = useState<LogoVariant>('overlap');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
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
    <div className={`dashboard-shell${sidebarExpanded ? ' is-sidebar-expanded' : ''}`}>
      <div className="dashboard-frame">
        <aside className={`dashboard-sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <div className="dashboard-sidebar-inner">
            <div className="dashboard-brand-block">
              <Link className="dashboard-brand" href="/dashboard">
                <span aria-hidden="true" className={`brand-mark brand-mark-${logoVariant}`}>
                  <span className="brand-mark-core" />
                  <span className="brand-mark-core brand-mark-core-alt" />
                  <span className="brand-mark-dot" />
                </span>
                <div className="dashboard-brand-text">
                  <strong>叩饭 Cofounder</strong>
                  <span className="dashboard-brand-copy">协作后台</span>
                </div>
              </Link>
              <button className="icon-button dashboard-close-button" onClick={() => setSidebarOpen(false)} type="button">
                关闭
              </button>
            </div>

            {profile ? (
              <div className="dashboard-user-card">
                <strong>{profile.user.displayName}</strong>
                <p>
                  {getRoleLabel(profile.user.role)}
                  {' · '}
                  {profile.user.city || '待填写城市'}
                </p>
              </div>
            ) : null}

            <nav className="dashboard-nav" aria-label="后台导航">
              {dashboardNavGroups.map((group) => (
                <div className="dashboard-nav-group" key={group.title}>
                  <p className="dashboard-nav-title">{group.title}</p>
                  <div className="dashboard-nav-links">
                    {group.items.map((item) => {
                      const active = item.match === 'prefix' ? pathname.startsWith(item.href) : pathname === item.href;

                      return (
                        <Link
                          className={`dashboard-nav-link${active ? ' is-active' : ''}`}
                          data-tooltip={item.label}
                          href={item.href}
                          key={item.href}
                          onClick={() => setSidebarOpen(false)}
                          title={item.label}
                        >
                          <span aria-hidden="true" className="dashboard-nav-link-icon">
                            {item.icon}
                          </span>
                          <span className="dashboard-nav-link-label">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="dashboard-sidebar-actions">
              <Link className="ghost-button" href="/projects" onClick={() => setSidebarOpen(false)}>
                浏览项目方
              </Link>
              <Link className="ghost-button" href="/developers" onClick={() => setSidebarOpen(false)}>
                浏览程序员
              </Link>
            </div>
          </div>
        </aside>

        {sidebarOpen ? <button aria-label="关闭侧边导航" className="dashboard-overlay" onClick={() => setSidebarOpen(false)} type="button" /> : null}

        <div className="dashboard-content-shell">
          <div className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <button
                aria-label={desktopViewport ? (sidebarExpanded ? '收起导航' : '展开导航') : '打开导航菜单'}
                className="icon-button dashboard-sidebar-toggle"
                onClick={handleSidebarToggle}
                type="button"
              >
                {desktopViewport ? (sidebarExpanded ? '◀' : '▶') : '☰'}
              </button>
              <div className="dashboard-topbar-copy">
                <span>{getPageDescription(pathname)}</span>
                <h1>{getPageTitle(pathname)}</h1>
              </div>
            </div>
            <div className="dashboard-topbar-actions">
              {profile ? (
                <div className="dashboard-topbar-meta">
                  <strong>{profile.user.displayName}</strong>
                  <span>{getRoleLabel(profile.user.role)}</span>
                </div>
              ) : null}
              <button className="ghost-button" onClick={handleLogout} type="button">
                {pending ? '退出中…' : '退出登录'}
              </button>
            </div>
          </div>
          <main className="dashboard-main">{children}</main>
        </div>
      </div>
      <SiteFooter className="dashboard-footer" contentClassName="dashboard-footer-content" />
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

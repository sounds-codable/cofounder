'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, type ReactNode, useEffect, useRef, useState, useTransition } from 'react';
import { CommunityRecruitmentEntry } from '@/components/community-recruitment-entry';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SmartTooltip } from '@/components/smart-tooltip';
import { buttonVariants } from '@/components/ui/button';
import { extractErrorMessage, extractRiskReview, fetchDisplayNameAvailability, fetchOverview, saveDisplayName, type LogoVariant } from '@/lib/platform-api';
import { cn } from '@/lib/utils';
import { clearStoredAccessToken } from '@/lib/session';
import { useAuthState } from '@/lib/use-auth';

type AppShellProps = {
  children: ReactNode;
};

const SAFE_ACCOUNT_NAME_PATTERN = /^[A-Za-z0-9_]+$/;

type DashboardNavGroup = {
  title: string;
  items: Array<{
    href: string;
    label: string;
    icon: 'requests' | 'projects' | 'developers' | 'blog' | 'invite' | 'points' | 'profile' | 'admin';
    match?: 'exact' | 'prefix';
  }>;
};

const dashboardNavGroupsBase: DashboardNavGroup[] = [
  {
    title: '工作台',
    items: [
      { href: '/requests', label: '请求中心', icon: 'requests', match: 'prefix' },
    ],
  },
  {
    title: '数据库',
    items: [
      { href: '/projects', label: '项目库', icon: 'projects', match: 'prefix' },
      { href: '/developers', label: '程序员', icon: 'developers', match: 'prefix' },
    ],
  },
  {
    title: '社群贡献',
    items: [
      { href: '/invite-codes', label: '邀请码', icon: 'invite', match: 'prefix' },
      { href: '/points', label: '积分', icon: 'points', match: 'prefix' },
    ],
  },
];

function getDashboardNavGroups(isAdmin: boolean): DashboardNavGroup[] {
  if (!isAdmin) {
    return dashboardNavGroupsBase;
  }

  return [
    ...dashboardNavGroupsBase,
    {
      title: '管理',
      items: [{ href: '/admin', label: '管理后台', icon: 'admin', match: 'prefix' }],
    },
  ];
}

function DashboardNavIcon({ icon }: { icon: DashboardNavGroup['items'][number]['icon'] }) {
  const navIconClassName = 'h-4 w-4';

  if (icon === 'admin') {
    return (
      <svg aria-hidden="true" className={navIconClassName} viewBox="0 0 24 24">
        <path d="M12 3l7 3v5c0 4.2-2.5 7.8-7 10-4.5-2.2-7-5.8-7-10V6l7-3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9.5 12l1.8 1.8L14.8 10" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (icon === 'invite') {
    return (
      <svg aria-hidden="true" className={navIconClassName} viewBox="0 0 24 24">
        <path d="M12 3l2.4 4.8L20 9l-4 3.9.9 5.6-4.9-2.6-4.9 2.6.9-5.6L4 9l5.6-1.2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === 'points') {
    return (
      <svg aria-hidden="true" className={navIconClassName} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 13.5h5a2 2 0 0 0 0-4H10a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (icon === 'requests') {
    return (
      <svg aria-hidden="true" className={navIconClassName} viewBox="0 0 24 24">
        <path d="M6 3h9l5 5v12a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M15 3v6h6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 13h8M8 17h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === 'projects') {
    return (
      <svg aria-hidden="true" className={navIconClassName} viewBox="0 0 24 24">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (icon === 'developers') {
    return (
      <svg aria-hidden="true" className={navIconClassName} viewBox="0 0 24 24">
        <circle cx="9" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 18c.9-2.3 2.7-3.5 5-3.5s4.1 1.2 5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="17.5" cy="10" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (icon === 'blog') {
    return (
      <svg aria-hidden="true" className={navIconClassName} viewBox="0 0 24 24">
        <path d="M6 4h8l4 4v12a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M14 4v5h5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 12h8M8 16h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className={navIconClassName} viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 19c1.1-2.9 3.1-4.3 6-4.3s4.9 1.4 6 4.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function DashboardPinIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M8 4h8M10 4v5l-3 3h10l-3-3V4M12 12v8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function DashboardKebabIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <circle cx="6" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="18" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}

function DashboardCloseIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M6 6l12 12M18 6l-12 12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function DashboardToggleIcon({ mobile, expanded }: { mobile: boolean; expanded: boolean }) {
  if (mobile) {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
        <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (expanded) {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
        <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function isDashboardRoute(pathname: string) {
  const dashboardRoutes = ['/dashboard', '/projects', '/developers', '/requests', '/invite-codes', '/points', '/onboarding', '/admin'];

  if (dashboardRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return true;
  }

  return /^\/[pd]-?[012356789]{5}(?:\/|$)/i.test(pathname);
}

function getPageTitle(pathname: string) {
  if (pathname === '/dashboard') {
    return '请求中心';
  }

  if (/^\/p-?[012356789]{5}(?:\/|$)/i.test(pathname)) {
    return '项目';
  }

  if (/^\/d-?[012356789]{5}(?:\/|$)/i.test(pathname)) {
    return '程序员';
  }

  if (pathname.startsWith('/projects')) {
    return '项目';
  }

  if (pathname.startsWith('/developers')) {
    return '程序员';
  }

  if (pathname.startsWith('/blog')) {
    return 'Blog';
  }

  if (pathname.startsWith('/requests')) {
    return '请求中心';
  }

  if (pathname.startsWith('/onboarding')) {
    return '详细信息';
  }

  if (pathname.startsWith('/invite-codes')) {
    return '邀请码';
  }

  if (pathname.startsWith('/points')) {
    return '积分';
  }

  if (pathname.startsWith('/admin')) {
    return '管理后台';
  }

  return '请求中心';
}

function AppShellContent({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [logoVariant, setLogoVariant] = useState<LogoVariant>('overlap');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [displayNameMessage, setDisplayNameMessage] = useState<string | null>(null);
  const [displayNameAvailable, setDisplayNameAvailable] = useState<boolean | null>(null);
  const [checkingDisplayName, setCheckingDisplayName] = useState(false);
  const [desktopViewport, setDesktopViewport] = useState(false);
  const [pending, startTransition] = useTransition();
  const { authenticated, profile, refresh } = useAuthState();
  const dashboardNavGroups = getDashboardNavGroups(Boolean(profile?.user.isAdmin));
  const sidebarCollapsedOnDesktop = desktopViewport && !sidebarExpanded;

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

    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      syncViewport(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }

    mediaQuery.addListener(handleChange);

    return () => {
      mediaQuery.removeListener(handleChange);
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSidebarOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname]);

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
    setDisplayNameDraft(profile?.user.displayName || '');
  }, [profile?.user.displayName]);

  useEffect(() => {
    if (!editingDisplayName) {
      setCheckingDisplayName(false);
      setDisplayNameAvailable(null);
      return;
    }

    const nextName = displayNameDraft.trim();
    const currentName = profile?.user.displayName?.trim() || '';

    if (!nextName) {
      setCheckingDisplayName(false);
      setDisplayNameAvailable(null);
      setDisplayNameMessage(null);
      return;
    }

    if (nextName.length < 2) {
      setCheckingDisplayName(false);
      setDisplayNameAvailable(false);
      setDisplayNameMessage('昵称至少需要 2 个字符。');
      return;
    }

    if (!SAFE_ACCOUNT_NAME_PATTERN.test(nextName)) {
      setCheckingDisplayName(false);
      setDisplayNameAvailable(false);
      setDisplayNameMessage('昵称仅支持英文大小写、数字和下划线（_）。');
      return;
    }

    if (nextName === currentName) {
      setCheckingDisplayName(false);
      setDisplayNameAvailable(true);
      setDisplayNameMessage(null);
      return;
    }

    let cancelled = false;
    setCheckingDisplayName(true);
    setDisplayNameAvailable(null);

    const timer = window.setTimeout(async () => {
      try {
        const result = await fetchDisplayNameAvailability(nextName);

        if (cancelled) {
          return;
        }

        setDisplayNameAvailable(result.available);
        setDisplayNameMessage(result.available ? '昵称可用。' : result.message || '昵称已被使用，请换一个。');
      } catch (error) {
        if (cancelled) {
          return;
        }

        setDisplayNameAvailable(null);
        setDisplayNameMessage(extractErrorMessage(error));
      } finally {
        if (!cancelled) {
          setCheckingDisplayName(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [displayNameDraft, editingDisplayName, profile?.user.displayName]);

  useEffect(() => {
    if (!userMenuOpen) {
      setEditingDisplayName(false);
      setDisplayNameMessage(null);
      setDisplayNameAvailable(null);
      setCheckingDisplayName(false);
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

  async function handleSaveDisplayName() {
    const nextName = displayNameDraft.trim();

    if (nextName.length < 2) {
      setDisplayNameMessage('昵称至少需要 2 个字符。');
      setDisplayNameAvailable(false);
      return;
    }

    if (!SAFE_ACCOUNT_NAME_PATTERN.test(nextName)) {
      setDisplayNameMessage('昵称仅支持英文大小写、数字和下划线（_）。');
      setDisplayNameAvailable(false);
      return;
    }

    if (checkingDisplayName) {
      setDisplayNameMessage('正在检查昵称是否可用，请稍候。');
      return;
    }

    if (displayNameAvailable === false) {
      setDisplayNameMessage('昵称已被使用，请换一个。');
      return;
    }

    setSavingDisplayName(true);
    setDisplayNameMessage(null);

    try {
      await saveDisplayName(nextName);
      await refresh();
      setEditingDisplayName(false);
    } catch (error) {
      const riskReview = extractRiskReview(error);

      if (riskReview) {
        const confirmed = window.confirm(
          `系统检测到潜在风险内容。\n风险等级：${riskReview.riskLevel}\n命中类别：${riskReview.categories.join('、') || '未知'}\n命中词：${riskReview.matchedTerms.join('、') || '未知'}\n\n是否仍继续发布？`,
        );

        if (confirmed) {
          try {
            await saveDisplayName(nextName, true);
            await refresh();
            setEditingDisplayName(false);
            return;
          } catch (retryError) {
            setDisplayNameMessage(extractErrorMessage(retryError));
            return;
          }
        }

        setDisplayNameMessage('你已取消本次修改。');
        return;
      }

      setDisplayNameMessage(extractErrorMessage(error));
    } finally {
      setSavingDisplayName(false);
    }
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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_8%_0%,rgba(19,191,168,0.16),transparent_46%),radial-gradient(circle_at_92%_8%,rgba(76,200,255,0.14),transparent_44%)]" />
      <div
        className={cn(
          'relative mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 gap-4 px-3 py-3 lg:px-4 lg:py-4',
          sidebarExpanded ? 'lg:grid-cols-[260px_minmax(0,1fr)]' : 'lg:grid-cols-[92px_minmax(0,1fr)]'
        )}
      >
        <div className="relative z-40 flex items-center justify-between overflow-visible rounded-2xl border border-border/70 bg-background/88 px-4 py-3 shadow-[0_14px_34px_rgba(79,108,163,0.12)] backdrop-blur-sm lg:col-span-2">
          <Link className="inline-flex items-center gap-3" href="/requests">
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
          <div className="ml-auto flex items-center gap-2">
            <CommunityRecruitmentEntry />
            <button
              aria-label="打开导航菜单"
              aria-expanded={!desktopViewport && sidebarOpen}
              aria-controls="dashboard-mobile-nav"
              title="打开导航菜单"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'icon' }),
                'relative rounded-full transition-all duration-[var(--motion-normal)] ease-[var(--motion-ease)] lg:hidden',
                !desktopViewport && sidebarOpen ? 'border-secondary/70 bg-secondary/15 text-secondary-foreground shadow-[0_10px_24px_rgba(19,191,168,0.22)]' : undefined
              )}
              onClick={handleSidebarToggle}
              type="button"
            >
              <DashboardKebabIcon />
              {!desktopViewport && sidebarOpen ? <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-rose-500" /> : null}
            </button>
            {profile ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  aria-label="打开用户菜单"
                  title="打开用户菜单"
                  className="inline-grid size-11 place-items-center rounded-full border border-border/70 bg-background text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setUserMenuOpen((current) => !current)}
                  type="button"
                >
                  <svg aria-hidden="true" className="size-6" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M6 19c1.1-2.9 3.1-4.3 6-4.3s4.9 1.4 6 4.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  </svg>
                </button>
                {userMenuOpen ? (
                  <div className="absolute right-0 top-12 z-50 grid min-w-64 gap-3 rounded-xl border border-border/70 bg-card/96 p-3 shadow-[0_14px_32px_rgba(79,108,163,0.2)] backdrop-blur-sm">
                    <div className="flex items-center gap-3 rounded-md border border-border/70 bg-background/72 px-3 py-2">
                      <span className="inline-grid size-11 shrink-0 place-items-center rounded-full border border-border/70 bg-background text-muted-foreground">
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6">
                          <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M6 19c1.1-2.9 3.1-4.3 6-4.3s4.9 1.4 6 4.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-foreground">{profile.user.displayName || '已登录用户'}</p>
                          <button
                            aria-label="修改昵称"
                            className="inline-flex size-6 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition-colors hover:text-foreground"
                            title="修改昵称"
                            type="button"
                            onClick={() => {
                              setEditingDisplayName((current) => !current);
                              setDisplayNameMessage(null);
                              setDisplayNameAvailable(null);
                            }}
                          >
                            <svg aria-hidden="true" className="size-3.5" viewBox="0 0 24 24">
                              <path d="M4 16.5V20h3.5l10-10-3.5-3.5-10 10z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                              <path d="M13.5 6.5l3.5 3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                            </svg>
                          </button>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{profile.user.email || '未绑定邮箱'}</p>
                      </div>
                    </div>
                    {editingDisplayName ? (
                      <div className="space-y-2 rounded-md border border-border/70 bg-background/72 px-3 py-2">
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          新昵称
                          <input
                            className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            maxLength={120}
                            value={displayNameDraft}
                            onChange={(event) => setDisplayNameDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                void handleSaveDisplayName();
                              }
                            }}
                          />
                        </label>
                        {checkingDisplayName ? <p className="text-xs text-muted-foreground">正在检查昵称是否重复…</p> : null}
                        <div className="flex gap-2">
                          <button className={cn(buttonVariants({ size: 'sm' }), 'h-8')} disabled={savingDisplayName} type="button" onClick={() => void handleSaveDisplayName()}>
                            {savingDisplayName ? '保存中…' : '保存'}
                          </button>
                          <button
                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8')}
                            disabled={savingDisplayName}
                            type="button"
                            onClick={() => {
                              setEditingDisplayName(false);
                              setDisplayNameDraft(profile.user.displayName || '');
                              setDisplayNameMessage(null);
                              setDisplayNameAvailable(null);
                              setCheckingDisplayName(false);
                            }}
                          >
                            取消
                          </button>
                        </div>
                        {displayNameMessage ? <p className={cn('text-xs', displayNameAvailable ? 'text-emerald-600' : 'text-destructive')}>{displayNameMessage}</p> : null}
                      </div>
                    ) : null}
                    <div className="overflow-hidden rounded-xl border border-border/70 bg-background/82">
                      <button className="inline-flex h-10 w-full items-center justify-center text-sm font-medium text-foreground transition-colors hover:bg-accent/70" onClick={handleLogout} type="button">
                        {pending ? '退出中…' : '退出登录'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <aside
          id="dashboard-mobile-nav"
          className={cn(
            'rounded-2xl border border-border/70 bg-card/68 shadow-[0_14px_34px_rgba(79,108,163,0.12)] backdrop-blur-sm lg:relative lg:z-20',
            'max-lg:fixed max-lg:inset-y-3 max-lg:left-3 max-lg:z-40 max-lg:w-[min(320px,calc(100vw-24px))] max-lg:overflow-y-auto max-lg:transition-transform max-lg:duration-200',
            desktopViewport || sidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-[120%]'
          )}
        >
          <div className="flex h-full flex-col justify-between p-4">
            <div className="mb-3 flex items-center justify-between lg:hidden">
              <p className="text-sm font-semibold text-foreground">导航菜单</p>
              <button
                aria-label="收起导航菜单"
                title="收起导航菜单"
                className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'rounded-full')}
                onClick={() => setSidebarOpen(false)}
                type="button"
              >
                <DashboardCloseIcon />
              </button>
            </div>
            <nav className="space-y-5" aria-label="后台导航">
              {dashboardNavGroups.map((group) => (
                <div className="space-y-2" key={group.title}>
                  <p className={cn('px-2 text-xs font-semibold tracking-wide text-muted-foreground', sidebarCollapsedOnDesktop ? 'lg:sr-only' : undefined)}>{group.title}</p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = item.match === 'prefix' ? pathname.startsWith(item.href) : pathname === item.href;
                      const navLink = (
                        <Link
                          aria-label={item.label}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all duration-[var(--motion-normal)] ease-[var(--motion-ease)]',
                            active ? 'bg-secondary text-secondary-foreground shadow-[0_8px_20px_rgba(19,191,168,0.18)]' : 'text-muted-foreground hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground',
                            sidebarCollapsedOnDesktop ? 'lg:justify-center lg:px-0' : undefined
                          )}
                          href={item.href}
                          key={item.href}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <span aria-hidden="true" className="inline-flex size-4 items-center justify-center">
                            <DashboardNavIcon icon={item.icon} />
                          </span>
                          <span className={cn(sidebarCollapsedOnDesktop ? 'lg:w-0 lg:overflow-hidden lg:opacity-0' : undefined)}>{item.label}</span>
                        </Link>
                      );

                      return (
                        sidebarCollapsedOnDesktop ? (
                          <SmartTooltip content={item.label} key={item.href} placement="right">
                            {navLink}
                          </SmartTooltip>
                        ) : (
                          navLink
                        )
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="pt-4">
              {(() => {
                const toggleButton = (
                  <button
                    aria-label={desktopViewport ? (sidebarExpanded ? '收起侧边导航' : '展开侧边导航') : '收起导航菜单'}
                    className={cn(
                      buttonVariants({ variant: desktopViewport ? 'outline' : 'outline', size: desktopViewport ? 'default' : 'icon' }),
                      desktopViewport
                        ? cn(
                          'h-10 w-full rounded-xl border-border/70 bg-background/86 text-sm text-foreground shadow-[0_10px_24px_rgba(79,108,163,0.14)] hover:-translate-y-0.5 hover:border-secondary/70 hover:bg-accent/60',
                            sidebarCollapsedOnDesktop ? 'justify-center px-2' : 'justify-between px-3'
                          )
                        : 'rounded-full'
                    )}
                    onClick={handleSidebarCollapse}
                    type="button"
                  >
                    {desktopViewport ? (
                      sidebarCollapsedOnDesktop ? (
                        <span aria-hidden="true" className="inline-flex size-5 items-center justify-center text-muted-foreground">
                          <DashboardToggleIcon expanded={sidebarExpanded} mobile={false} />
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex size-5 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground">
                              <DashboardPinIcon />
                            </span>
                            <span>{sidebarExpanded ? '收起导航' : '展开导航'}</span>
                          </span>
                          <span className="inline-flex size-5 items-center justify-center text-muted-foreground">
                            <DashboardToggleIcon expanded={sidebarExpanded} mobile={false} />
                          </span>
                        </>
                      )
                    ) : (
                      <span className="inline-flex size-5 items-center justify-center text-muted-foreground">
                        <DashboardToggleIcon expanded={sidebarExpanded} mobile={!desktopViewport} />
                      </span>
                    )}
                  </button>
                );

                if (desktopViewport && sidebarCollapsedOnDesktop) {
                  return (
                    <SmartTooltip content={sidebarExpanded ? '收起导航' : '展开导航'} placement="right">
                      {toggleButton}
                    </SmartTooltip>
                  );
                }

                return toggleButton;
              })()}
            </div>
          </div>
        </aside>

        {!desktopViewport && sidebarOpen ? <button aria-label="关闭侧边导航" className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} type="button" /> : null}

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

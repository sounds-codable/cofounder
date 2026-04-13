'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { MvpTerm } from '@/components/mvp-term';
import { buttonVariants } from '@/components/ui/button';
import { extractErrorMessage, extractRiskReview, saveDisplayName } from '@/lib/platform-api';
import { cn } from '@/lib/utils';
import { clearStoredAccessToken } from '@/lib/session';
import type { LogoVariant } from '@/lib/platform-api';
import { useAuthState } from '@/lib/use-auth';

const navItems = [
  { href: '/projects', label: '项目库' },
  { href: '/developers', label: '程序员' },
  { href: '/public-welfare', label: '公益' },
  { href: '/origin', label: '缘起' },
  { href: '/blog', label: 'Blog' },
];

type SiteHeaderProps = {
  logoVariant?: LogoVariant;
};

const SAFE_ACCOUNT_NAME_PATTERN = /^[A-Za-z0-9_]+$/;

export function SiteHeader({ logoVariant = 'overlap' }: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [displayNameMessage, setDisplayNameMessage] = useState<string | null>(null);
  const { authenticated, profile, refresh } = useAuthState();

  useEffect(() => {
    setDisplayNameDraft(profile?.user.displayName || '');
  }, [profile?.user.displayName]);

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
    setUserMenuOpen(false);

    startTransition(() => {
      clearStoredAccessToken();

      if (pathname.startsWith('/requests') || pathname.startsWith('/onboarding') || pathname.startsWith('/dashboard')) {
        router.replace('/');
      }

      router.refresh();
    });
  }

  async function handleSaveDisplayName() {
    const nextName = displayNameDraft.trim();

    if (nextName.length < 2) {
      setDisplayNameMessage('昵称至少需要 2 个字符。');
      return;
    }

    if (!SAFE_ACCOUNT_NAME_PATTERN.test(nextName)) {
      setDisplayNameMessage('昵称仅支持英文大小写、数字和下划线（_）。');
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
            <span className="text-xs text-muted-foreground md:text-sm">
              行业专家 × 程序员，细分应用一起玩
            </span>
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
                          }}
                        >
                          取消
                        </button>
                      </div>
                      {displayNameMessage ? <p className="text-xs text-destructive">{displayNameMessage}</p> : null}
                    </div>
                  ) : null}
                  <div className="overflow-hidden rounded-xl border border-border/70 bg-background/82">
                    <Link
                      className="inline-flex h-10 w-full items-center justify-center border-b border-border/70 text-sm font-medium text-foreground transition-colors hover:bg-accent/70"
                      href="/requests"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      进入后台
                    </Link>
                    <button
                      className="inline-flex h-10 w-full items-center justify-center text-sm font-medium text-foreground transition-colors hover:bg-accent/70"
                      onClick={handleLogout}
                      type="button"
                    >
                      {pending ? '退出中…' : '退出登录'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
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

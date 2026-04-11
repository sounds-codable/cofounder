import { cn } from '@/lib/utils';

function PoliceBadgeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.5 4 5.5v6.8c0 5.1 3.2 9.7 8 11.2 4.8-1.5 8-6.1 8-11.2V5.5l-8-3Z" fill="#2B6CB0" />
      <path d="M12 5.8 6.4 7.9v4.5c0 3.8 2.2 7.1 5.6 8.3 3.4-1.2 5.6-4.5 5.6-8.3V7.9L12 5.8Z" fill="#F6AD55" />
      <path d="M12 9.2 13 11.3l2.3.3-1.7 1.7.4 2.4L12 14.6l-2 1.1.4-2.4-1.7-1.7 2.3-.3L12 9.2Z" fill="#1A202C" />
    </svg>
  );
}

type SiteFooterProps = {
  className?: string;
  contentClassName?: string;
};

export function SiteFooter({ className, contentClassName }: SiteFooterProps) {
  return (
    <footer className={cn('border-t border-border/70 bg-background/60', className)}>
      <div className={cn('mx-auto grid w-[min(1180px,calc(100vw-48px))] justify-items-center gap-2 py-6 text-center text-xs text-muted-foreground md:text-sm', contentClassName)}>
        <p className="text-foreground">@2026 叩饭（Cofounder）｜行业专家 × 程序员，细分应用一起玩</p>
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:underline">浙ICP备2026009923号-2</a>
        <a href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=33010502012873" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center justify-center gap-1">
          <PoliceBadgeIcon />
          浙公网安备33010502012873号
        </a>
      </div>
    </footer>
  );
}

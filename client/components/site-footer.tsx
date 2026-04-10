import { cn } from '@/lib/utils';

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
          <img src="https://www.xixisys.com/img/beian.png" alt="公安备案" className="h-4 w-4" />
          浙公网安备33010502012873号
        </a>
      </div>
    </footer>
  );
}

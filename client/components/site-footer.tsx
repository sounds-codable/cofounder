import { cn } from '@/lib/utils';

type SiteFooterProps = {
  className?: string;
  contentClassName?: string;
};

export function SiteFooter({ className, contentClassName }: SiteFooterProps) {
  return (
    <footer className={cn('border-t border-border/70 bg-background/60', className)}>
      <div className={cn('mx-auto grid w-[min(1180px,calc(100vw-48px))] justify-items-center gap-2 py-6 text-center text-xs text-muted-foreground md:text-sm', contentClassName)}>
        <p className="text-foreground">@2026 叩饭（Cofounder）｜让真实项目与真实能力先被看见，再让真正匹配的合作自然发生。</p>
        <p>浙ICP备2026009923号-2</p>
        <p>浙公网安备 XXX号</p>
      </div>
    </footer>
  );
}

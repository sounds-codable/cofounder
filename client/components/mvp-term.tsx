'use client';

import type { ReactNode } from 'react';
import { SmartTooltip } from '@/components/smart-tooltip';
import { cn } from '@/lib/utils';

type MvpTermProps = {
  className?: string;
};

const MVP_TOOLTIP_BENEFITS = ['低成本快速上线，验证真伪需求。', '更早拿到真实用户反馈，及时修正方向。', '用更低成本试错，把时间和预算集中在真正有效的功能上。'];

function MvpTooltipContent() {
  return (
    <div className="grid gap-1 text-[13px] leading-6">
      <p className="text-sm font-semibold text-foreground">MVP = Minimum Viable Product（最小可行产品）</p>
      <p className="text-muted-foreground">先做一个能跑通核心价值的最小版本，用最短时间验证“这件事值不值得继续做”。</p>
      <p className="text-sm font-medium text-foreground">为什么要先做 MVP</p>
      <ul className="grid gap-1 text-muted-foreground">
        {MVP_TOOLTIP_BENEFITS.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

export function MvpTerm({ className }: MvpTermProps) {
  const tooltipContent: ReactNode = <MvpTooltipContent />;

  return (
    <SmartTooltip
      className="z-[85] max-w-[min(92vw,520px)] rounded-2xl p-4 text-left"
      content={tooltipContent}
      placement="bottom"
      prewarmOnInteract
      triggerMode="click"
    >
      <button
        aria-label="查看 MVP 说明"
        className={cn(
          'inline-flex items-center text-primary underline decoration-primary/70 underline-offset-4 transition-colors hover:text-primary/80',
          className
        )}
        type="button"
      >
        MVP
      </button>
    </SmartTooltip>
  );
}

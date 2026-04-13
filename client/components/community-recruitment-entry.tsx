'use client';

import { createPortal } from 'react-dom';
import { useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CommunityRecruitmentEntryProps = {
  className?: string;
};

export function CommunityRecruitmentEntry({ className }: CommunityRecruitmentEntryProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-label="打开社群招募弹框"
        title="社群招募"
        className={cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'rounded-full border-border/70 bg-background text-muted-foreground transition-colors hover:text-foreground',
          className
        )}
        onClick={() => setOpen(true)}
        type="button"
      >
        <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
          <circle cx="8" cy="9" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="16" cy="8" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4.5 18c.7-2.2 2.3-3.4 4.8-3.4s4.1 1.2 4.8 3.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M13.2 16.8c.5-1.6 1.6-2.5 3.2-2.5 1.7 0 2.8.9 3.3 2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      </button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-[140] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="社群志愿者招募信息">
              <button aria-label="关闭弹框" className="absolute inset-0 bg-foreground/35" onClick={() => setOpen(false)} type="button" />
              <section className="relative z-10 w-full max-w-xl rounded-2xl border border-border/70 bg-card/96 p-5 shadow-[0_18px_42px_rgba(79,108,163,0.24)] backdrop-blur-md md:p-6">
                <button
                  aria-label="关闭弹框"
                  className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'absolute right-3 top-3 rounded-full')}
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
                    <path d="M6 6l12 12M18 6l-12 12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                  </svg>
                </button>
                <div className="space-y-3 pr-8">
                  <h2 className="text-lg font-semibold text-foreground">叩饭社群，想找一起干活的你</h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    叩饭（Cofounder）是一个公益社群，我们在认真做一件小事：让行业专家和程序员更容易遇见，一起把想法做成真实的产品。
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    现在想招募运营志愿者，主要帮忙运营一个微信群、组织线下活动、在社媒上帮我们多说几句。没有报酬，但每一份投入都会被认真对待。
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    如果你愿意一起把这件事做久一点，欢迎发邮件到{' '}
                    <a className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4" href="mailto:x@cofounder.icu">
                      x@cofounder.icu
                    </a>{' '}
                    ，附上几句简要介绍就好。很期待认识你。
                  </p>
                </div>
                <div className="mt-5 flex justify-end">
                  <button className={cn(buttonVariants({ size: 'sm' }), 'rounded-full px-4')} onClick={() => setOpen(false)} type="button">
                    我知道了
                  </button>
                </div>
              </section>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

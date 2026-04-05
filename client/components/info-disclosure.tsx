import type { ReactNode } from 'react';

type InfoDisclosureProps = {
  title: string;
  children: ReactNode;
  compact?: boolean;
  defaultOpen?: boolean;
};

export function InfoDisclosure({ title, children, compact = false, defaultOpen = false }: InfoDisclosureProps) {
  return (
    <details
      className={`group rounded-xl border border-border/70 bg-card/70 ${compact ? 'p-2' : 'p-3'} text-sm text-muted-foreground`}
      open={defaultOpen}
    >
      <summary className="list-none cursor-pointer">
        <span className="inline-flex items-center gap-2 text-foreground">
          <span className="inline-flex size-5 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold">i</span>
          <span>{title}</span>
        </span>
      </summary>
      <div className="pt-2 leading-relaxed">{children}</div>
    </details>
  );
}

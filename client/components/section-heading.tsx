import type { ReactNode } from 'react';

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function SectionHeading({ eyebrow, title, description, children }: SectionHeadingProps) {
  return (
    <div className="space-y-3 text-left">
      <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-wide text-secondary-foreground">{eyebrow}</span>
      <h2 className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">{title}</h2>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">{description}</p>
      {children ? <div className="pt-1">{children}</div> : null}
    </div>
  );
}

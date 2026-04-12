import type { ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SeoLandingSection = {
  title: string;
  content: ReactNode;
};

type SeoLandingPageProps = {
  badge: string;
  title: string;
  lead: ReactNode;
  sections: SeoLandingSection[];
  ctaLinks?: Array<{
    href: string;
    label: string;
  }>;
};

export function SeoLandingPage({ badge, title, lead, sections, ctaLinks = [] }: SeoLandingPageProps) {
  return (
    <div className="relative mx-auto w-full max-w-5xl space-y-5 overflow-hidden px-4 py-6 md:px-6 md:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_10%_0%,rgba(19,191,168,0.18),transparent_48%),radial-gradient(circle_at_100%_12%,rgba(76,200,255,0.16),transparent_50%)]" />
      <section className="relative space-y-3 rounded-2xl border border-border/70 bg-card/84 p-5 shadow-[0_18px_44px_rgba(73,101,163,0.14)] backdrop-blur-sm md:p-6">
        <span className="inline-flex w-fit rounded-full bg-secondary/80 px-3 py-1 text-xs text-secondary-foreground">{badge}</span>
        <h1 className="text-3xl font-semibold leading-tight md:text-4xl">{title}</h1>
        <div className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">{lead}</div>
      </section>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Card className="border-border/70 bg-card/85 shadow-[0_14px_36px_rgba(73,101,163,0.14)]" key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">{section.content}</CardContent>
          </Card>
        ))}
      </div>

      {ctaLinks.length > 0 ? (
        <Card className="border-border/70 bg-card/85 shadow-[0_14px_36px_rgba(73,101,163,0.14)]">
          <CardHeader>
            <CardTitle>继续查看</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {ctaLinks.map((link) => (
              <Link className="text-primary underline underline-offset-4" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

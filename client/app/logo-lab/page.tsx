'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { fetchOverview, type LogoVariant } from '@/lib/platform-api';

const logoVariants: Array<{ key: LogoVariant; title: string; description: string }> = [
  { key: 'overlap', title: 'Overlap', description: '重叠方块，稳健且通用。' },
  { key: 'spark', title: 'Spark', description: '火花感，更活跃与轻快。' },
  { key: 'bridge', title: 'Bridge', description: '桥接意象，强调连接合作。' },
  { key: 'orbit', title: 'Orbit', description: '轨道意象，更科技与前沿。' },
];

export default function LogoLabPage() {
  const [activeVariant, setActiveVariant] = useState<LogoVariant>('overlap');

  useEffect(() => {
    let cancelled = false;

    async function loadVariant() {
      const overview = await fetchOverview();

      if (!cancelled && overview?.logoVariant) {
        setActiveVariant(overview.logoVariant);
      }
    }

    void loadVariant();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-3">
        <span className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">Logo Lab</span>
        <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Logo 主题预览</h1>
        <p>
          当前生效主题：<strong>{activeVariant}</strong>。在 <code>server/.env</code> 修改 <code>LOGO_VARIANT</code> 并重启后端，即可全站切换。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {logoVariants.map((variant) => (
          <Card className={cn('border-border/70 bg-card/88', activeVariant === variant.key ? 'border-primary/60 ring-1 ring-primary/40' : '')} key={variant.key}>
            <CardHeader className="items-center text-center">
              <span aria-hidden="true" className={`brand-mark brand-mark-${variant.key}`}>
                <span className="brand-mark-core" />
                <span className="brand-mark-core brand-mark-core-alt" />
                <span className="brand-mark-dot" />
              </span>
              <CardTitle>{variant.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-center text-sm text-muted-foreground">
              <p>{variant.description}</p>
              <code className="text-xs text-foreground">LOGO_VARIANT={variant.key}</code>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

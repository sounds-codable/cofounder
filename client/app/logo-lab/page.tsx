'use client';

import { useEffect, useState } from 'react';
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
    <section className="site-shell logo-lab">
      <div className="logo-lab-head">
        <span className="launch-kicker">Logo Lab</span>
        <h1>Logo 主题预览</h1>
        <p>
          当前生效主题：<strong>{activeVariant}</strong>。在 <code>server/.env</code> 修改 <code>LOGO_VARIANT</code> 并重启后端，即可全站切换。
        </p>
      </div>

      <div className="logo-lab-grid">
        {logoVariants.map((variant) => (
          <article className={`logo-lab-card${activeVariant === variant.key ? ' is-active' : ''}`} key={variant.key}>
            <div className="logo-lab-mark-wrap">
              <span aria-hidden="true" className={`brand-mark brand-mark-${variant.key}`}>
                <span className="brand-mark-core" />
                <span className="brand-mark-core brand-mark-core-alt" />
                <span className="brand-mark-dot" />
              </span>
            </div>
            <h2>{variant.title}</h2>
            <p>{variant.description}</p>
            <code>LOGO_VARIANT={variant.key}</code>
          </article>
        ))}
      </div>
    </section>
  );
}

import type { ReactNode } from 'react';

type InfoDisclosureProps = {
  title: string;
  children: ReactNode;
  compact?: boolean;
  defaultOpen?: boolean;
};

export function InfoDisclosure({ title, children, compact = false, defaultOpen = false }: InfoDisclosureProps) {
  return (
    <details className={`info-disclosure${compact ? ' compact' : ''}`} open={defaultOpen}>
      <summary>
        <span className="info-disclosure-trigger">
          <span className="info-disclosure-icon">i</span>
          <span>{title}</span>
        </span>
      </summary>
      <div className="info-disclosure-body">{children}</div>
    </details>
  );
}

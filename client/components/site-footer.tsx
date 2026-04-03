type SiteFooterProps = {
  className?: string;
  contentClassName?: string;
};

export function SiteFooter({ className, contentClassName }: SiteFooterProps) {
  const footerClassName = className ? `site-footer ${className}` : 'site-footer';
  const innerClassName = contentClassName ? `footer-grid ${contentClassName}` : 'site-shell footer-grid';

  return (
    <footer className={footerClassName}>
      <div className={innerClassName}>
        <p className="footer-single-line">@2026 叩饭（Cofounder）｜让真实项目与真实能力先被看见，再让真正匹配的合作自然发生。</p>
        <p className="footer-meta-line">浙ICP XXX</p>
        <p className="footer-meta-line">浙公网安备 XXX号</p>
      </div>
    </footer>
  );
}

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
        <div className="footer-brand-block">
          <h3>叩饭 Cofounder</h3>
          <p>让真实项目与真实能力先被看见，再让真正匹配的合作自然发生。</p>
        </div>
        <div className="footer-meta-block">
          <h4> 2026 叩饭（Cofounder）</h4>
          <p>行业专家 × 程序员，公开基础信息、按需授权、再交换联系方式。</p>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="site-shell narrow-shell page-section page-stack">
      <section className="form-shell">
        <div className="section-heading left">
          <span>页面不存在</span>
          <h1>这个页面还没有被生成，或者已经被移动了。</h1>
          <p>你可以回到首页继续查看公开基础信息，或者进入资料录入与请求中心相关页面。</p>
        </div>
        <div className="hero-actions">
          <Link className="primary-button hero-primary" href="/">
            回到首页
          </Link>
          <Link className="ghost-button" href="/projects">
            查看项目方
          </Link>
        </div>
      </section>
    </div>
  );
}

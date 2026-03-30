'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="landing-page">
      <section className="landing-shell site-shell">
        <div className="landing-center">
          <div className="landing-logo">叩饭（Cofounder）</div>
          <h1 className="landing-tagline">
            行业专家 × 程序员
            <br />
            股权合伙，从想法到产品
          </h1>
          <div className="landing-status">
            <span className="landing-status-dot" />
            <span>即将上线</span>
          </div>
          <div className="landing-actions">
            <Link className="primary-button hero-primary" href="/projects">
              我是项目方
            </Link>
            <Link className="ghost-button hero-primary" href="/developers">
              我是程序员
            </Link>
          </div>
          <p className="landing-note">先看公开基础信息；进一步收藏、点赞、了解详情时再登录。</p>
        </div>
      </section>
    </div>
  );
}

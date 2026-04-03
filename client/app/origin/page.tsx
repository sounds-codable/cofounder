import Link from 'next/link';

export default function OriginPage() {
  return (
    <div className="site-shell page-section page-stack">
      <section className="section-heading left">
        <span>缘起</span>
        <h1>我们为什么要做这个站。</h1>
        <p>
          这件事说起来不复杂。2025 年开始，AI 在互联网行业的替代速度明显加快，而且看起来还会继续蔓延到更多行业。
          很多人焦虑，但又不知道该怎么动。
        </p>
      </section>

      <section className="detail-card">
        <h2>一边是经验，一边是技术</h2>
        <p>
          70、80、90 后在各行各业积累了很深的行业经验，知道什么问题是真需求、有人愿意付费。
          这些经验如果变成应用、软件、平台，不只是能创业，也能提升社会效率。
        </p>
        <p>
          另一边，程序员借助 AI，确实能比以前更快做出产品。但程序员最缺的，往往不是技术，而是细分行业理解和真实资源。
        </p>
      </section>

      <section className="detail-card">
        <h2>为什么要撮合这两边</h2>
        <p>
          对很多行业专家来说，现在再去系统学习 vibe coding，成本高、回报不一定划算。
          对很多程序员来说，技术越来越强，但找不到长期靠谱的业务场景。
        </p>
        <p>
          所以把这两边匹配起来，可能是更现实的路：一个人带来真实场景，一个人负责把东西做出来，先跑 MVP，再慢慢迭代。
        </p>
      </section>

      <section className="detail-card">
        <h2>这个社群不属于我们，属于大家</h2>
        <p>
          我们只是先抛砖引玉，把这个网站搭起来，尽量把规则做简单、做透明。
          希望它慢慢变成一个“我为人人、人人为我”的互助社区。
        </p>
        <p>
          如果你认可这个方向，欢迎去
          {' '}
          <Link href="/public-welfare">公益页</Link>
          {' '}
          留言，告诉我们你想一起怎么共建。
        </p>
      </section>
    </div>
  );
}

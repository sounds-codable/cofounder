'use client';

import Link from 'next/link';

const rolePanels = [
  {
    eyebrow: '给项目方 / 专业人士',
    title: '两件事会很快发生',
    items: ['AI 替代工作是必然，而且速度会超出多数人的预期。', '职场中年危机一直存在，年轻人会持续冲击传统岗位。'],
    note: '现在最稳妥的做法，不是观望，而是尽快把行业经验做成细分应用。',
  },
  {
    eyebrow: '给程序员',
    title: '现实已经很明确',
    items: ['大量程序员已经被优化，更多人正在路上。', '大多数人只有遇到通用需求，而通用需求会被大厂快速覆盖。'],
    note: '更容易成功的方向，是和垂直领域专家一起做小而深的应用。',
  },
];

const launchCards = [
  {
    eyebrow: 'WHY',
    title: '为什么必须是「程序员 × 专家」',
    description: '只有专家，想法落不了地；只有程序员，产品容易偏方向。两个人一起，才是最快且最稳的起点。',
  },
  {
    eyebrow: 'HOW',
    title: '我们怎么让双方真正合作',
    description: '专家发布场景与资源，程序员发布技术与节奏。双向匹配后先做 MVP，边做边验证，边合作边迭代。',
  },
  {
    eyebrow: 'WHAT',
    title: '你会得到什么',
    description: '专家拿到可落地产品，程序员拿到真实业务场景。一起把「点子」变成「可验证的产品」。',
  },
];

export default function HomePage() {
  return (
    <div className="launch-home">
      <div className="launch-grid-overlay" />
      <div className="launch-noise-overlay" />
      <div className="launch-glow launch-glow-1" />
      <div className="launch-glow launch-glow-2" />
      <div className="launch-glow launch-glow-3" />

      <section className="launch-hero site-shell">
        <div className="launch-hero-shell">
          <div className="launch-hero-copy launch-reveal">
            <span className="launch-kicker launch-kicker-primary">ICU · I SEE YOU</span>
            <h1 className="launch-headline">AI 时代，不做旁观者。</h1>
            <p className="launch-subline">先做一个 MVP，给自己留住主动权，而不是等被替代。</p>
            <div className="launch-primary-actions">
              <Link className="primary-button hero-primary" href="/login?next=/onboarding/basic%3Frole%3Dexpert">
                项目方发布项目
              </Link>
              <Link className="ghost-button hero-primary launch-ghost" href="/login?next=/onboarding/basic%3Frole%3Ddeveloper">
                程序员登记信息
              </Link>
            </div>
            <div className="launch-secondary-actions">
              <Link className="launch-text-link" href="/projects">
                瞧瞧项目库
              </Link>
              <Link className="launch-text-link" href="/developers">
                瞅瞅程序员
              </Link>
            </div>
          </div>
          <div className="launch-hero-orbit" aria-hidden="true">
            <span className="launch-orbit launch-orbit-1" />
            <span className="launch-orbit launch-orbit-2" />
            <span className="launch-orbit launch-orbit-3" />
            <span className="launch-orbit-dot launch-orbit-dot-1" />
            <span className="launch-orbit-dot launch-orbit-dot-2" />
            <span className="launch-orbit-dot launch-orbit-dot-3" />
            <div className="launch-orbit-chip launch-orbit-chip-1">专家场景</div>
            <div className="launch-orbit-chip launch-orbit-chip-2">程序员能力</div>
            <div className="launch-orbit-chip launch-orbit-chip-3">MVP 验证</div>
          </div>
        </div>
      </section>

      <section className="launch-role-grid site-shell">
        {rolePanels.map((panel) => (
          <article className="launch-panel launch-reveal" key={panel.eyebrow}>
            <span className="launch-kicker">{panel.eyebrow}</span>
            <h2>{panel.title}</h2>
            <div className="launch-panel-list">
              {panel.items.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
            <strong>{panel.note}</strong>
          </article>
        ))}
      </section>

      <section className="launch-card-grid site-shell">
        {launchCards.map((card) => (
          <article className="launch-card launch-reveal" key={card.eyebrow}>
            <span className="launch-kicker">{card.eyebrow}</span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      <section className="launch-flow site-shell launch-reveal">
        <div className="launch-flow-heading">
          <span className="launch-kicker">FLOW</span>
          <h2>建立联系，只走 3 步。</h2>
          <p>先看基础信息，再按阶段授权，让双方在更了解彼此后再决定是否联系。</p>
        </div>
        <div className="launch-flow-grid">
          <article className="launch-flow-card">
            <span className="launch-step">01</span>
            <h3>项目方先发项目简介</h3>
            <p>公开基础信息后，程序员先判断是否值得申请了解详情。</p>
          </article>
          <article className="launch-flow-card">
            <span className="launch-step">02</span>
            <h3>项目方先做决定</h3>
            <p>程序员申请后，项目方先看程序员详细信息，再决定是否开放项目详情。</p>
          </article>
          <article className="launch-flow-card">
            <span className="launch-step">03</span>
            <h3>程序员再做决定</h3>
            <p>程序员看到项目详情后，再决定是否交换联系方式并继续深入沟通。</p>
          </article>
        </div>
      </section>

      <section className="launch-cta site-shell launch-reveal">
        <div>
          <span className="launch-kicker">Now or Never</span>
          <h2>别再等风向，直接开始做。</h2>
          <br/>
          <p>让真实项目与真实能力先碰撞，再把点子变成结果。现在就进入你的第一步。</p>
        </div>
        <div className="launch-cta-actions">
          <Link className="primary-button hero-primary" href="/login?next=/onboarding/basic%3Frole%3Dexpert">
            项目方发布项目
          </Link>
          <Link className="ghost-button hero-primary launch-ghost" href="/login?next=/onboarding/basic%3Frole%3Ddeveloper">
            程序员登记信息
          </Link>
        </div>
      </section>
    </div>
  );
}

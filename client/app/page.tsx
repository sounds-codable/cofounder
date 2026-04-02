'use client';

import Link from 'next/link';

const rolePanels = [
   {
     eyebrow: '给项目方 / 行业专家',
     title: '把真实项目公开出来，先找到愿意一起做事的人',
     items: ['直接发布项目卡片，让程序员先看到你在解决什么问题。', '先公开必要信息，再在有意向后逐步开放更完整的背景和联系方式。'],
     note: '不是先找人聊，而是先让对的人找到你。',
   },
   {
     eyebrow: '给程序员',
     title: '先登记简要信息，让项目方更快判断你是否合适',
     items: ['先把技术栈、做过的项目、偏好方向和所在城市放到公开卡片里。', '当项目方主动来找你时，再进入后续授权与深入沟通。'],
     note: '先被看见，再决定是否继续深入合作。',
   },
 ];

const launchCards = [
   {
     eyebrow: 'WHY',
     title: '为什么不是继续等机会',
     description: 'AI 正在压缩大量通用岗位，单靠简历海投或熟人介绍，越来越难拿到真正合适的合作机会。',
   },
   {
     eyebrow: 'HOW',
     title: '我们怎么让合作更快发生',
     description: '项目方发项目，程序员登记能力与方向。双方先看公开基础信息，再在有意向后推进授权、了解详情和交换联系方式。',
   },
   {
     eyebrow: 'RESULT',
     title: '你会得到什么',
     description: '项目方更快找到愿意落地的人，程序员更快接触真实业务场景，而不是停留在模糊想法和泛泛社交。',
   },
 ];

const flowSteps = [
   {
     step: '01',
     title: '先发布公开卡片',
     description: '项目方发布项目，程序员登记简要信息，先建立可被搜索和判断的公开资料。',
   },
   {
     step: '02',
     title: '有意向再深入了解',
     description: '双方先从公开信息判断方向是否匹配，再进入后续授权流程。',
   },
   {
     step: '03',
     title: '确认合作后再交换联系方式',
     description: '把沟通成本放在真正有兴趣的人身上，减少无效打扰。',
   },
 ];

export default function HomePage() {
  return (
    <div className="launch-home">
      <div className="launch-glow launch-glow-1" />
      <div className="launch-glow launch-glow-2" />

      <section className="launch-hero site-shell">
        <div className="launch-brand-row">
          <span className="launch-brand">叩饭 · Cofounder</span>
          <span className="launch-status">产品已上线</span>
        </div>
        <h1 className="launch-headline">AI 时代，不要把项目和能力继续埋在简历里。</h1>
        <p className="launch-subline">项目方现在可以直接发布项目，程序员可以先登记简要信息，让真正匹配的人更快彼此找到。</p>
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
            先浏览项目方公开卡片
          </Link>
          <Link className="launch-text-link" href="/developers">
            先浏览程序员公开卡片
          </Link>
        </div>
      </section>

      <section className="launch-role-grid site-shell">
        {rolePanels.map((panel) => (
          <article className="launch-panel" key={panel.eyebrow}>
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
          <article className="launch-card" key={card.eyebrow}>
            <span className="launch-kicker">{card.eyebrow}</span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      <section className="launch-flow site-shell">
        <div className="launch-flow-heading">
          <span className="launch-kicker">FLOW</span>
          <h2>从公开信息开始，先匹配，再深入。</h2>
          <p>不再是 waitlist，也不是先加联系方式，而是让合作判断先发生。</p>
        </div>
        <div className="launch-flow-grid">
          {flowSteps.map((item) => (
            <article className="launch-flow-card" key={item.step}>
              <span className="launch-step">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="launch-cta site-shell">
        <div>
          <span className="launch-kicker">CTA</span>
          <h2>现在就把你的项目或能力放出来。</h2>
          <p>项目方先发项目，程序员先登记简要信息。越早进入真实匹配，越早拿到有效合作机会。</p>
        </div>
        <div className="launch-cta-actions">
          <Link className="primary-button hero-primary" href="/login?next=/onboarding/basic%3Frole%3Dexpert">
            立即开始
          </Link>
          <Link className="ghost-button hero-primary launch-ghost" href="/login?next=/requests">
            查看我的请求
          </Link>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getHowToJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '如何先验证需求再开发',
  description: '解释为什么要先验证真实需求，再开始开发，以及项目方与程序员如何围绕需求验证来推进 MVP。',
  path: '/validate-demand-before-building',
  keywords: ['先验证需求再开发', '需求验证', '如何验证真实需求', 'MVP 验证需求'],
});

export default function ValidateDemandBeforeBuildingPage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '如何先验证需求再开发', path: '/validate-demand-before-building' },
    ]),
    getHowToJsonLd({
      name: '如何先验证需求再开发',
      description: '先确认问题真实存在、再选择最小切口并快速验证，避免在错误方向上投入开发成本。',
      totalTime: 'P7D',
      steps: [
        { name: '确认问题真实存在', text: '确认问题不是想象中的，而是用户真的在被困扰。' },
        { name: '定义最小验证目标', text: '选择一个最小但关键的验证切口。' },
        { name: '做最小可运行版本', text: '只为验证目标构建必要部分。' },
        { name: '根据反馈决定是否继续投入', text: '把真实反馈作为下一步投入依据。' },
      ],
    }),
    getFAQPageJsonLd([
      { question: '为什么不能先做出来再说？', answer: '因为开发成本虽然下降了，但错误方向的成本依然很高。先验证需求能减少在错误方向上的浪费。' },
      { question: '需求验证最重要看什么？', answer: '最重要看问题是否真实、用户是否真的在意、以及他们是否会用行动反馈你的解决方案。' },
      { question: '项目方和程序员如何一起做需求验证？', answer: '项目方提供真实场景与用户理解，程序员负责把验证目标转成最小可运行版本，双方共同根据反馈迭代。' },
    ]),
    getItemListJsonLd({
      title: '需求验证步骤',
      path: '/validate-demand-before-building',
      items: [
        { name: '确认问题', url: '/validate-demand-before-building', description: '先确认问题真实存在。' },
        { name: '定义最小目标', url: '/validate-demand-before-building', description: '控制范围。' },
        { name: '快速验证', url: '/validate-demand-before-building', description: '用最小版本获取反馈。' },
        { name: '再决定投入', url: '/validate-demand-before-building', description: '用反馈决定下一步。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="Demand Validation"
        title="为什么要先验证需求，再开始开发"
        lead={<>AI 让开发变快了，但并没有让错误方向变便宜。真正高效的创业方式，不是更快地开发错误产品，而是更快地验证你是否正在解决一个真实问题。</>}
        sections={[
          { title: '开发变快，不等于方向更容易对', content: <><p>很多团队的问题不在于做得太慢，而在于做得很快但方向错了。</p><p>因此，需求验证的重要性在 AI 时代反而更高。</p></> },
          { title: '需求验证的核心是用户行为，不是口头认同', content: <><p>真正有效的验证，不只是听用户说“挺好”，而是看他们是否愿意尝试、使用、留下反馈，甚至付费。</p></> },
          { title: '为什么项目方和程序员要一起做这件事', content: <><p>项目方更接近用户和问题，程序员更擅长把验证目标变成可运行产品。</p><p>两者结合，才更容易形成有效验证闭环。</p></> },
          { title: 'MVP 是需求验证最现实的起点', content: <><p>MVP 的价值，不在于简单，而在于只保留验证最关键问题所必须的部分。</p></> },
        ]}
        ctaLinks={[
          { href: '/mvp-guide', label: '查看 MVP 指南' },
          { href: '/ai-era-startup', label: '查看 AI 时代创业说明' },
          { href: '/projects', label: '查看项目库' },
        ]}
      />
    </>
  );
}

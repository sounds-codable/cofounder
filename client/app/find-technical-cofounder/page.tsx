import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '如何找技术合伙人',
  description: '给项目方与行业专家的说明页：如何更高质量地寻找技术合伙人，而不是只找短期执行型程序员。',
  path: '/find-technical-cofounder',
  keywords: ['找技术合伙人', '如何找技术合伙人', '创业找程序员', '项目方找技术搭档'],
});

export default function FindTechnicalCofounderPage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '如何找技术合伙人', path: '/find-technical-cofounder' },
    ]),
    getFAQPageJsonLd([
      {
        question: '技术合伙人和普通外包程序员有什么区别？',
        answer: '技术合伙人更关注长期协作、产品验证和共同成长，而不是只完成一次性开发任务。',
      },
      {
        question: '找技术合伙人最重要看什么？',
        answer: '最重要的是看对方是否具备把真实需求拆成 MVP 的能力、是否愿意长期协作，以及是否能理解业务问题本身。',
      },
      {
        question: '为什么不建议一开始就谈很大的产品蓝图？',
        answer: '因为创业初期最关键的是验证方向，而不是堆功能。先围绕最小切口做出可验证版本，更容易吸引靠谱的技术合伙人。',
      },
    ]),
    getItemListJsonLd({
      title: '寻找技术合伙人的关键判断标准',
      path: '/find-technical-cofounder',
      items: [
        { name: '看是否能做 MVP', url: '/find-technical-cofounder', description: '能否把问题拆成可验证的最小版本。' },
        { name: '看是否适合长期协作', url: '/find-technical-cofounder', description: '是否愿意持续磨合而不是只做短期交付。' },
        { name: '看是否理解业务', url: '/find-technical-cofounder', description: '是否愿意理解行业场景与真实用户。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="Find Technical Cofounder"
        title="如何找到更靠谱的技术合伙人"
        lead={<>很多项目方以为自己要找的是“会开发的人”，但真正适合一起创业的人，往往不是纯执行角色，而是能一起判断问题、做 MVP、扛迭代的技术合伙人。</>}
        sections={[
          {
            title: '不要只按技术栈找人',
            content: (
              <>
                <p>技术栈重要，但在创业早期，能否把真实问题快速转成可验证产品，往往比会不会某个框架更关键。</p>
                <p>如果一个人技术很强，但只愿意等完整 PRD 再开始，未必适合和你一起从 0 到 1 做事。</p>
              </>
            ),
          },
          {
            title: '真正重要的是合作方式',
            content: (
              <>
                <p>技术合伙人不是你把需求丢过去、对方照着做的人，而是会和你一起讨论边界、优先级和验证策略的人。</p>
                <p>这种合作关系更像共同判断，而不是单向派单。</p>
              </>
            ),
          },
          {
            title: '先围绕 MVP 建立合作更现实',
            content: (
              <>
                <p>与其一开始谈一个很大的终局，不如先围绕一个小而真、能快速验证的 MVP 建立合作。</p>
                <p>这样既能降低双方风险，也更容易看出彼此是否真的适合长期一起做事。</p>
              </>
            ),
          },
          {
            title: '为什么双向授权流程更适合找技术合伙人',
            content: (
              <>
                <p>因为它让双方先判断基础匹配度，再逐步开放详细信息，减少信息不对称和低质量试探。</p>
                <p>这更适合需要长期磨合的合作关系，而不只是一次性接触。</p>
              </>
            ),
          },
        ]}
        ctaLinks={[
          { href: '/for-experts', label: '查看给项目方的说明' },
          { href: '/developers', label: '查看程序员库' },
          { href: '/how-it-works', label: '查看协作流程说明' },
        ]}
      />
    </>
  );
}

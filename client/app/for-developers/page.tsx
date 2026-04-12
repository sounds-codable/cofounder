import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '给程序员',
  description: '面向程序员的说明页：如何在叩饭 Cofounder 找到真实项目、行业专家与更适合长期合作的业务场景。',
  path: '/for-developers',
  keywords: ['程序员找项目', '程序员找创业项目', '程序员找技术合伙机会', '程序员做 MVP'],
});

export default function ForDevelopersPage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '给程序员', path: '/for-developers' },
    ]),
    getFAQPageJsonLd([
      {
        question: '程序员为什么要找真实业务场景而不是泛需求？',
        answer: '真实业务场景意味着更高概率存在付费意愿、明确约束和长期合作价值，比泛需求更适合做出真正能落地的 MVP。',
      },
      {
        question: '程序员怎样判断一个项目方是否值得合作？',
        answer: '可以优先判断对方是否拥有真实行业认知、是否清楚问题本身、是否能描述最小验证路径，以及是否愿意长期磨合。',
      },
      {
        question: '为什么平台要先让项目方看程序员详细资料？',
        answer: '因为项目方需要先判断程序员的经验背景和匹配度，再决定是否开放更多项目细节，这样能减少双方时间浪费。',
      },
    ]),
    getItemListJsonLd({
      title: '程序员在叩饭 Cofounder 的使用建议',
      path: '/for-developers',
      items: [
        { name: '优先找真实需求', url: '/for-developers', description: '比泛需求更容易做出有价值的 MVP。' },
        { name: '展示能做 MVP 的能力', url: '/for-developers', description: '强调拆解问题、快速验证和协作能力。' },
        { name: '先判断长期协作可能性', url: '/for-developers', description: '避免只看一时兴趣而忽略长期磨合。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="For Developers"
        title="给程序员：如何找到更值得投入的真实项目"
        lead={
          <>
            如果你不想再只做泛需求、一次性外包或难以沉淀价值的项目，而是希望找到真正有业务场景、有长期空间的合作机会，那么叩饭 Cofounder 更适合你作为公开协作入口。
          </>
        }
        sections={[
          {
            title: '程序员最稀缺的往往不是技术，而是真实场景',
            content: (
              <>
                <p>现在很多程序员已经有足够强的实现能力，但真正稀缺的是带着真实需求、真实客户资源和行业理解而来的合作对象。</p>
                <p>如果没有场景，代码能力再强，也很难形成真正有壁垒的产品。</p>
              </>
            ),
          },
          {
            title: '为什么展示“能做 MVP”比展示技术栈更重要',
            content: (
              <>
                <p>项目方关心的不只是你会不会某个框架，而是你能不能把含混的问题快速拆成能上线、能验证、能迭代的最小版本。</p>
                <p>因此，展示你的问题拆解能力、业务理解能力和快速验证能力，往往比只列一串技术名词更有效。</p>
              </>
            ),
          },
          {
            title: '如何判断一个项目值不值得做',
            content: (
              <>
                <p>优先看对方是否有真实行业理解、是否能讲清楚场景和用户、是否已经接触过真实付费或明确痛点。</p>
                <p>如果对方只会抽象地说“想做个平台”，却讲不清问题本身，那往往不是适合长期投入的合作对象。</p>
              </>
            ),
          },
          {
            title: '为什么双向授权流程更适合程序员',
            content: (
              <>
                <p>因为你不需要在一开始就暴露大量个人细节，也不会在完全不清楚项目前景时被迫进入深度沟通。</p>
                <p>先看基础信息、再逐步了解详情，让程序员能更理性地判断是否值得投入时间和精力。</p>
              </>
            ),
          },
        ]}
        ctaLinks={[
          { href: '/developers', label: '查看程序员库' },
          { href: '/projects', label: '查看项目库' },
          { href: '/how-it-works', label: '查看协作流程说明' },
        ]}
      />
    </>
  );
}

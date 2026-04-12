import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '程序员与行业专家如何协作',
  description: '解释程序员与行业专家如何围绕真实需求建立更高质量协作，并以 MVP 作为共同起点。',
  path: '/developer-and-expert-collaboration',
  keywords: ['程序员与行业专家协作', '程序员和项目方如何合作', '专家与程序员做 MVP', '创业协作方式'],
});

export default function DeveloperAndExpertCollaborationPage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '程序员与行业专家如何协作', path: '/developer-and-expert-collaboration' },
    ]),
    getFAQPageJsonLd([
      {
        question: '程序员和行业专家为什么容易沟通不顺？',
        answer: '因为双方关注点不同：行业专家更关注场景与结果，程序员更关注问题边界、优先级和实现约束。缺乏清晰流程时，很容易彼此误解。',
      },
      {
        question: '两类人怎样合作才更有效？',
        answer: '更有效的方式是围绕真实问题先达成一致，再用 MVP 验证，而不是一开始就追求做完整系统。',
      },
      {
        question: '为什么双向授权比直接加联系方式更适合长期合作？',
        answer: '双向授权让双方先基于信息质量和匹配度做判断，更利于建立信任与长期合作，而不是一开始陷入低质量沟通。',
      },
    ]),
    getItemListJsonLd({
      title: '程序员与行业专家协作的关键原则',
      path: '/developer-and-expert-collaboration',
      items: [
        { name: '先围绕真实问题对齐', url: '/developer-and-expert-collaboration', description: '先确认问题，而不是直接谈大方案。' },
        { name: '先做 MVP', url: '/developer-and-expert-collaboration', description: '先验证，再逐步扩大。' },
        { name: '通过双向授权逐步建立信任', url: '/developer-and-expert-collaboration', description: '让双方在更低风险下合作。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="Collaboration"
        title="程序员与行业专家，怎样合作才更容易做成事"
        lead={<>很多合作失败，不是因为某一方不努力，而是因为双方一开始就没有在同一个问题层面对齐。真正有效的合作，往往始于真实问题、明确边界和可验证的最小目标。</>}
        sections={[
          {
            title: '双方天然关注点不同',
            content: (
              <>
                <p>行业专家通常更关注业务结果、场景真实性和商业机会；程序员更关注问题边界、实现复杂度和迭代节奏。</p>
                <p>这不是矛盾，而是天然分工。关键在于用合适方式让两者对齐。</p>
              </>
            ),
          },
          {
            title: '为什么很多合作一开始就跑偏',
            content: (
              <>
                <p>常见问题是还没明确最小问题，就开始讨论完整系统；还没判断匹配度，就开始高频沟通。</p>
                <p>这样很容易让双方都觉得对方“说不清”或“太理想化”。</p>
              </>
            ),
          },
          {
            title: '更有效的方法是围绕 MVP 建立共识',
            content: (
              <>
                <p>先明确最小问题、最小用户、最小验证目标，再决定第一版做什么，不做什么。</p>
                <p>这样程序员和行业专家都能在同一个现实约束下合作，而不是各自想象产品应该长什么样。</p>
              </>
            ),
          },
          {
            title: '为什么平台流程能帮助双方协作',
            content: (
              <>
                <p>叩饭 Cofounder 用双向授权流程让双方先判断信息质量和匹配度，再逐步开放更多资料与联系方式。</p>
                <p>这让合作建立在更清晰的判断之上，而不是建立在冲动联系之上。</p>
              </>
            ),
          },
        ]}
        ctaLinks={[
          { href: '/how-it-works', label: '查看协作流程说明' },
          { href: '/for-experts', label: '查看给项目方的说明' },
          { href: '/for-developers', label: '查看给程序员的说明' },
        ]}
      />
    </>
  );
}

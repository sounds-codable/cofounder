import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '什么样的项目适合先做 MVP',
  description: '解释什么样的项目更适合先做 MVP，包括真实问题、清晰切口、可验证性与协作可执行性。',
  path: '/what-is-a-good-mvp-project',
  keywords: ['什么样的项目适合做 MVP', 'MVP 项目判断', '适合先做 MVP 的项目', '创业项目如何选切口'],
});

export default function WhatIsAGoodMvpProjectPage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '什么样的项目适合先做 MVP', path: '/what-is-a-good-mvp-project' },
    ]),
    getFAQPageJsonLd([
      { question: '什么样的项目最适合先做 MVP？', answer: '最适合的是有真实问题、有明确用户、有最小切口、能在短周期内得到反馈的项目。' },
      { question: '什么样的项目不适合一开始就做 MVP？', answer: '没有清晰用户、没有明确问题、没有最小验证目标、边界极度模糊的项目，不适合直接进入开发。' },
      { question: '为什么“问题真实”比“市场大”更重要？', answer: '因为 MVP 的目标是验证方向，真实问题更容易带来真实反馈，而宏大市场想象并不能替代早期验证。' },
    ]),
    getItemListJsonLd({
      title: '适合做 MVP 的项目特征',
      path: '/what-is-a-good-mvp-project',
      items: [
        { name: '有真实问题', url: '/what-is-a-good-mvp-project', description: '用户痛点足够明确。' },
        { name: '有最小切口', url: '/what-is-a-good-mvp-project', description: '能清楚定义第一版。' },
        { name: '能快速获得反馈', url: '/what-is-a-good-mvp-project', description: '能验证使用或付费意愿。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="Good MVP Project"
        title="什么样的项目，更适合先做一个 MVP"
        lead={<>并不是所有项目都适合一上来就开发。真正适合先做 MVP 的项目，通常不是“想象空间很大”的项目，而是“问题足够真实、切口足够清楚、反馈足够快”的项目。</>}
        sections={[
          {
            title: '第一，看问题是否真实且具体',
            content: (
              <>
                <p>如果一个问题连用户是谁、痛点在哪都说不清楚，那么再快做出产品也只是更快地试错在错误方向上。</p>
                <p>真实问题通常来自真实业务流程，而不是空泛灵感。</p>
              </>
            ),
          },
          {
            title: '第二，看是否存在最小切口',
            content: (
              <>
                <p>适合做 MVP 的项目，一定可以先切出一个小而关键的入口。</p>
                <p>如果第一版必须覆盖太多功能才能成立，通常说明还没找到合适切口。</p>
              </>
            ),
          },
          {
            title: '第三，看是否能快速得到反馈',
            content: (
              <>
                <p>MVP 的价值在于验证，所以一定要能尽快得到用户行为、使用反馈或付费信号。</p>
                <p>如果短期内什么都验证不到，就不适合作为第一优先级项目。</p>
              </>
            ),
          },
          {
            title: '第四，看协作是否能落地',
            content: (
              <>
                <p>项目再好，如果合作关系无法落地，也很难跑出来。</p>
                <p>适合做 MVP 的项目，往往也是适合项目方和程序员共同快速协作的项目。</p>
              </>
            ),
          },
        ]}
        ctaLinks={[
          { href: '/mvp-guide', label: '查看 MVP 指南' },
          { href: '/validate-demand-before-building', label: '查看如何先验证需求再开发' },
          { href: '/projects', label: '查看项目库' },
        ]}
      />
    </>
  );
}

import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '程序员如何找真实创业项目',
  description: '面向程序员的说明页：如何筛选更真实的创业项目，避免陷入空泛需求或低质量合作。',
  path: '/find-real-startup-projects',
  keywords: ['程序员找真实创业项目', '程序员找项目', '如何判断创业项目靠谱', '程序员找真实需求'],
});

export default function FindRealStartupProjectsPage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '程序员如何找真实创业项目', path: '/find-real-startup-projects' },
    ]),
    getFAQPageJsonLd([
      {
        question: '程序员如何判断一个创业项目是不是真实？',
        answer: '可以优先看对方是否讲得清真实场景、真实用户、明确痛点，以及是否已经接触过付费或线下验证。',
      },
      {
        question: '什么样的项目最不值得投入？',
        answer: '需求抽象、用户模糊、没有场景、没有验证目标、只谈大平台愿景却没有最小切口的项目，通常不值得优先投入。',
      },
      {
        question: '程序员在找项目时最该看什么？',
        answer: '最该看的是问题是否真实、合作对象是否靠谱、验证路径是否清楚，以及自己能否在其中积累长期价值。',
      },
    ]),
    getItemListJsonLd({
      title: '判断真实创业项目的线索',
      path: '/find-real-startup-projects',
      items: [
        { name: '看是否有真实场景', url: '/find-real-startup-projects', description: '有没有明确用户与场景。' },
        { name: '看是否有最小验证切口', url: '/find-real-startup-projects', description: '能否先做一个小而可验证的版本。' },
        { name: '看合作对象是否清醒', url: '/find-real-startup-projects', description: '是否能清楚描述问题和优先级。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="Find Real Startup Projects"
        title="程序员如何找到更真实的创业项目"
        lead={<>很多程序员并不缺开发能力，真正缺的是值得长期投入的真实项目。判断一个项目是否靠谱，关键不是听上去多宏大，而是它有没有真实问题、真实场景和真实验证路径。</>}
        sections={[
          {
            title: '先看问题是不是真的存在',
            content: (
              <>
                <p>如果一个项目连“谁在被这个问题困扰”都说不清楚，通常说明它还停留在想象阶段。</p>
                <p>真实项目往往能清楚讲出用户是谁、问题在哪、为什么现在值得解决。</p>
              </>
            ),
          },
          {
            title: '再看有没有最小验证路径',
            content: (
              <>
                <p>靠谱的项目方通常不会一上来就要求你做一个大而全的平台，而是会愿意先从最小切口验证。</p>
                <p>如果对方能说清楚第一版最小目标，通常更值得继续了解。</p>
              </>
            ),
          },
          {
            title: '最后看合作对象是否值得长期磨合',
            content: (
              <>
                <p>项目值不值得做，不只是看问题本身，也要看和你合作的人是否讲理、是否清楚、是否愿意共担不确定性。</p>
                <p>好的项目通常伴随好的合作对象，而不是只会不断追加想法的人。</p>
              </>
            ),
          },
          {
            title: '为什么在叩饭 Cofounder 更容易判断这些',
            content: (
              <>
                <p>因为平台先公开基础信息、再逐步看详细资料，让你能先做初步判断，再决定是否投入更多沟通成本。</p>
                <p>这比一开始就跳进深聊更节省时间，也更适合筛选真实合作机会。</p>
              </>
            ),
          },
        ]}
        ctaLinks={[
          { href: '/projects', label: '查看项目库' },
          { href: '/for-developers', label: '查看给程序员的说明' },
          { href: '/mvp-guide', label: '查看 MVP 指南' },
        ]}
      />
    </>
  );
}

import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getHowToJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'MVP 指南',
  description: '面向项目方与程序员的 MVP 指南：如何围绕真实需求做最小可验证产品，并更高效地推进协作。',
  path: '/mvp-guide',
  keywords: ['什么是 MVP', '如何做 MVP', 'MVP 指南', '最小可验证产品', '创业 MVP'],
});

export default function MvpGuidePage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: 'MVP 指南', path: '/mvp-guide' },
    ]),
    getHowToJsonLd({
      name: '如何围绕真实需求做 MVP',
      description: '从真实问题出发，选择最小切口、快速上线验证，并根据反馈持续迭代。',
      totalTime: 'P14D',
      steps: [
        {
          name: '确认真实问题',
          text: '先确认用户是否真的存在明确痛点，以及这个问题是否值得优先解决。',
        },
        {
          name: '选择最小切口',
          text: '不要一开始做大全，而是优先解决最小但最关键的问题。',
        },
        {
          name: '快速上线并收集反馈',
          text: '用可运行版本验证用户是否真的使用、反馈和付费。',
        },
        {
          name: '根据反馈继续迭代',
          text: '把真实反馈转化成下一轮产品优化，而不是凭空想象需求。',
        },
      ],
    }),
    getFAQPageJsonLd([
      {
        question: 'MVP 是什么？',
        answer: 'MVP 是最小可验证产品，重点不是做一个简陋版本，而是用最小成本验证最关键的用户问题与产品假设。',
      },
      {
        question: '为什么很多团队做不出有效的 MVP？',
        answer: '常见原因是一开始就试图做得太大、太全，或者没有围绕真实需求与验证目标来控制范围。',
      },
      {
        question: 'MVP 为什么适合项目方和程序员合作？',
        answer: '因为 MVP 强调快速验证和持续迭代，既适合项目方验证真实需求，也适合程序员用较低成本进入真实业务场景。',
      },
    ]),
    getItemListJsonLd({
      title: 'MVP 实践建议',
      path: '/mvp-guide',
      items: [
        { name: '先确认真实问题', url: '/mvp-guide', description: '优先验证问题是否真实存在。' },
        { name: '选择最小切口', url: '/mvp-guide', description: '控制范围，优先做最关键部分。' },
        { name: '快速上线并验证', url: '/mvp-guide', description: '让真实用户给出反馈。' },
        { name: '持续迭代', url: '/mvp-guide', description: '根据反馈而不是想象继续优化。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="MVP Guide"
        title="什么是 MVP，以及如何围绕真实需求做出来"
        lead={
          <>
            很多人把 MVP 理解成“先随便做个简陋版本”，但真正有效的 MVP，核心是以最小成本验证最关键的产品假设。对项目方和程序员来说，这是一种更务实也更高效的合作起点。
          </>
        }
        sections={[
          {
            title: 'MVP 的核心不是“粗糙”，而是“可验证”',
            content: (
              <>
                <p>真正的 MVP 不一定功能少得可怜，而是每一项功能都服务于一个明确的验证目标。</p>
                <p>如果一个功能不能帮助你判断用户是否真的有需求、会不会持续使用、是否愿意付费，那它很可能不属于第一版。</p>
              </>
            ),
          },
          {
            title: '为什么项目方容易把第一版做得过重',
            content: (
              <>
                <p>因为项目方通常对业务很熟，知道很多痛点，于是容易把所有想法都塞进第一版。</p>
                <p>但第一版最重要的不是覆盖全部逻辑，而是找到能最早证明方向成立的最小切口。</p>
              </>
            ),
          },
          {
            title: '为什么程序员适合成为 MVP 合作伙伴',
            content: (
              <>
                <p>一个优秀的程序员不只是执行需求，更能帮助项目方把问题拆解、约束范围、快速验证和高效迭代。</p>
                <p>这也是为什么真实业务方和具备 MVP 意识的程序员组合，往往比单纯外包更容易跑出结果。</p>
              </>
            ),
          },
          {
            title: '如何判断你的 MVP 是否有效',
            content: (
              <>
                <p>关键不在于功能数量，而在于是否拿到了真实反馈：用户是否使用、是否重复使用、是否愿意继续沟通或付费。</p>
                <p>如果产品上线后没有得到任何真实行为反馈，再复杂的系统也不算有效 MVP。</p>
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

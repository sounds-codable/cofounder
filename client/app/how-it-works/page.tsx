import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getHowToJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '协作流程说明',
  description: '了解叩饭 Cofounder 的双向授权协作流程：先公开基础信息，再逐步查看详细资料，最后再决定是否交换联系方式。',
  path: '/how-it-works',
  keywords: ['双向授权', '协作流程', '如何找技术合伙人', '如何找项目方', '叩饭使用流程'],
});

export default function HowItWorksPage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '协作流程说明', path: '/how-it-works' },
    ]),
    getHowToJsonLd({
      name: '叩饭 Cofounder 双向授权协作流程说明',
      description: '项目方与程序员先公开基础信息，再逐步开放详细资料与联系方式，减少无效沟通并提高匹配质量。',
      totalTime: 'P3D',
      steps: [
        {
          name: '先公开基础信息',
          text: '项目方或程序员先展示最少必要信息，让对方判断是否值得进一步了解。',
        },
        {
          name: '被申请方先看详细资料',
          text: '被申请方先查看申请者详细信息，再决定是否开放自己的更多详情。',
        },
        {
          name: '最后决定是否交换联系方式',
          text: '双方在看过更完整资料后，再决定是否交换联系方式并转到站外继续沟通。',
        },
      ],
    }),
    getFAQPageJsonLd([
      {
        question: '为什么要先看基础信息而不是直接联系？',
        answer: '因为先看基础信息可以快速过滤明显不匹配的对象，减少打扰、降低隐私暴露和无效沟通。',
      },
      {
        question: '为什么联系方式不一开始就公开？',
        answer: '平台希望让双方先基于业务、能力和匹配度做判断，而不是一开始就暴露联系方式造成骚扰或低质量触达。',
      },
      {
        question: '这个流程更适合什么类型的合作？',
        answer: '更适合围绕真实业务场景、行业资源和 MVP 验证展开的长期协作，而不是一次性外包撮合。',
      },
    ]),
    getItemListJsonLd({
      title: '叩饭 Cofounder 协作流程步骤',
      path: '/how-it-works',
      items: [
        { name: '先公开基础信息', url: '/how-it-works', description: '先展示最少必要信息。' },
        { name: '先看详细资料再决定', url: '/how-it-works', description: '被申请方先查看申请者详细资料。' },
        { name: '再决定是否交换联系方式', url: '/how-it-works', description: '双方在足够了解后再决定是否交换联系方式。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="How It Works"
        title="叩饭 Cofounder 的协作流程说明"
        lead={
          <>
            叩饭 Cofounder 不是传统的“看见联系方式就直接加”的平台，而是采用双向授权流程，帮助项目方与程序员在更低风险的前提下建立真实协作关系。
          </>
        }
        sections={[
          {
            title: '第一步：先公开基础信息',
            content: (
              <>
                <p>项目方先公开项目简介，程序员先公开技术能力与经验简介。这样双方都能快速建立第一层判断：这个方向值不值得继续了解。</p>
                <p>这一步的目的不是完全成交，而是让不匹配的人尽早止步，让真正可能合作的人进入下一步。</p>
              </>
            ),
          },
          {
            title: '第二步：先看详细资料再决定是否继续开放信息',
            content: (
              <>
                <p>当一方发起进一步了解请求后，被申请方先查看申请者的详细资料，再决定是否开放自己的更多信息。</p>
                <p>这个机制让双方都拥有判断权，避免还没判断匹配度就过早暴露大量隐私或敏感业务信息。</p>
              </>
            ),
          },
          {
            title: '第三步：最后才决定是否交换联系方式',
            content: (
              <>
                <p>只有在双方已经对彼此背景、能力和合作方向有了足够认知后，才进入联系方式交换阶段。</p>
                <p>这样能显著减少“先加了再说”“一上来就推销”这类低质量沟通，更适合真实创业协作。</p>
              </>
            ),
          },
          {
            title: '这个流程为什么适合做 MVP',
            content: (
              <>
                <p>做 MVP 需要的不是泛泛认识很多人，而是快速找到真实需求、真实能力和真实意愿都匹配的协作者。</p>
                <p>双向授权流程把注意力放在需求真实性、执行能力和合作判断上，因此更适合围绕 MVP 展开长期协作。</p>
              </>
            ),
          },
        ]}
        ctaLinks={[
          { href: '/projects', label: '查看项目库' },
          { href: '/developers', label: '查看程序员库' },
          { href: '/origin', label: '查看平台缘起' },
        ]}
      />
    </>
  );
}

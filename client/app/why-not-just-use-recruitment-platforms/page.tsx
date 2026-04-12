import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '为什么不只用招聘平台找人或找项目',
  description: '解释为什么招聘平台更适合标准岗位，而叩饭 Cofounder 更适合围绕真实场景、MVP 与长期协作来建立合作。',
  path: '/why-not-just-use-recruitment-platforms',
  keywords: ['为什么不用招聘平台', '招聘平台和协作平台区别', '找技术合伙人平台', '找真实项目平台'],
});

export default function WhyNotJustUseRecruitmentPlatformsPage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '为什么不只用招聘平台找人或找项目', path: '/why-not-just-use-recruitment-platforms' },
    ]),
    getFAQPageJsonLd([
      { question: '招聘平台为什么不完全适合找技术合伙人？', answer: '因为招聘平台更适合标准岗位匹配，而技术合伙关系更强调真实场景、共同判断、长期协作与不确定性共担。' },
      { question: '程序员为什么不只靠招聘平台找项目？', answer: '因为招聘平台上的很多机会更偏标准雇佣或短期外包，而不是围绕真实问题和 MVP 的长期合作。' },
      { question: '叩饭 Cofounder 和招聘平台最大的差别是什么？', answer: '叩饭 Cofounder 更强调双向授权、信息分层和真实协作判断，而不是简单交换简历和联系方式。' },
    ]),
    getItemListJsonLd({
      title: '招聘平台与协作平台的区别',
      path: '/why-not-just-use-recruitment-platforms',
      items: [
        { name: '招聘平台偏标准岗位', url: '/why-not-just-use-recruitment-platforms', description: '更适合雇佣匹配。' },
        { name: '协作平台偏真实问题共创', url: '/why-not-just-use-recruitment-platforms', description: '更适合做 MVP 与长期合作。' },
        { name: '双向授权降低无效沟通', url: '/why-not-just-use-recruitment-platforms', description: '更适合信息分层判断。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="Why Not Recruitment Platforms"
        title="为什么找技术合伙人或真实项目，不该只靠招聘平台"
        lead={<>招聘平台很重要，但它主要解决的是标准岗位与简历匹配问题。对于需要围绕真实问题做 MVP、建立长期协作的关系来说，只靠招聘平台往往不够。</>}
        sections={[
          {
            title: '招聘平台更适合标准岗位，不一定适合共创关系',
            content: (
              <>
                <p>招聘平台擅长解决的是“岗位职责明确、能力要求明确、雇佣关系明确”的匹配问题。</p>
                <p>但技术合伙、项目共创、MVP 协作，天然比标准岗位更复杂。</p>
              </>
            ),
          },
          {
            title: '共创关系更看重真实问题与长期磨合',
            content: (
              <>
                <p>项目方和程序员是否适合合作，往往不只看简历和 JD，而要看真实问题、合作方式、验证节奏和信任建立过程。</p>
              </>
            ),
          },
          {
            title: '为什么双向授权机制更合适',
            content: (
              <>
                <p>双向授权让双方先用基础信息建立判断，再逐步开放详细资料和联系方式。</p>
                <p>这种节奏比一开始直接加联系方式，更适合减少无效沟通。</p>
              </>
            ),
          },
          {
            title: '两类平台不是互斥，而是解决不同问题',
            content: (
              <>
                <p>招聘平台可以继续用于标准岗位，协作平台更适合围绕真实场景、MVP 与长期共创关系建立合作。</p>
              </>
            ),
          },
        ]}
        ctaLinks={[
          { href: '/for-experts', label: '查看给项目方的说明' },
          { href: '/for-developers', label: '查看给程序员的说明' },
          { href: '/how-it-works', label: '查看协作流程说明' },
        ]}
      />
    </>
  );
}

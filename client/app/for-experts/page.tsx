import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '给项目方与行业专家',
  description: '面向项目方与行业专家的说明页：如何在叩饭 Cofounder 找到程序员、技术合伙人，并以低风险方式推进 MVP 协作。',
  path: '/for-experts',
  keywords: ['项目方找程序员', '行业专家找技术合伙人', '找程序员做 MVP', '创业找程序员'],
});

export default function ForExpertsPage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '给项目方与行业专家', path: '/for-experts' },
    ]),
    getFAQPageJsonLd([
      {
        question: '项目方为什么不直接去招聘网站找程序员？',
        answer: '招聘网站更适合标准岗位匹配，而叩饭 Cofounder 更适合围绕真实场景、长期协作意愿和 MVP 验证来寻找技术合伙人或协作者。',
      },
      {
        question: '项目方发布信息时要公开多少内容？',
        answer: '只需先公开基础信息，足够让程序员理解问题方向与价值判断即可，不需要一开始就公开全部细节。',
      },
      {
        question: '项目方最适合找什么样的程序员？',
        answer: '最适合找能快速把真实需求拆成 MVP、愿意和业务方长期磨合、并能理解具体行业场景的程序员。',
      },
    ]),
    getItemListJsonLd({
      title: '项目方在叩饭 Cofounder 的使用建议',
      path: '/for-experts',
      items: [
        { name: '先明确真实场景', url: '/for-experts', description: '优先描述已验证的真实问题和业务场景。' },
        { name: '先公开基础信息', url: '/for-experts', description: '不要一开始就暴露全部敏感业务信息。' },
        { name: '优先找能做 MVP 的程序员', url: '/for-experts', description: '先做可验证的最小版本而不是一口气做大全。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="For Experts"
        title="给项目方 / 行业专家：如何更高质量地找到程序员"
        lead={
          <>
            如果你有真实业务场景、客户资源或明确问题意识，但还缺少能一起快速做 MVP 的程序员，那么叩饭 Cofounder 更适合你用来寻找长期协作者，而不是一次性外包执行者。
          </>
        }
        sections={[
          {
            title: '你真正需要的通常不是“会写代码的人”',
            content: (
              <>
                <p>很多项目方表面上是在找程序员，本质上是在找能把真实需求拆成可验证产品的人。</p>
                <p>如果对方只会接需求、报工时，却不能理解你所在行业的真实约束，那么很难一起把 MVP 做成。</p>
              </>
            ),
          },
          {
            title: '为什么先公开基础信息反而更安全',
            content: (
              <>
                <p>很多项目方担心“说多了被抄”，于是信息过少，导致真正合适的程序员也无法判断是否值得投入时间。</p>
                <p>更好的方式是公开足够建立判断的基础信息，但把真正敏感的细节放到授权后再逐步开放。</p>
              </>
            ),
          },
          {
            title: '如何提高找到合适程序员的概率',
            content: (
              <>
                <p>优先说清楚三个问题：你解决什么真实问题、谁已经为这个问题付费或会付费、第一版最小切口是什么。</p>
                <p>当程序员能清楚看到真实场景和最小验证路径时，更容易判断是否愿意长期协作。</p>
              </>
            ),
          },
          {
            title: '为什么要以 MVP 为合作起点',
            content: (
              <>
                <p>对大多数项目方来说，最危险的不是做得太小，而是一开始做得太大、太慢、太贵。</p>
                <p>先做 MVP，能让你更快验证需求真实性，也更容易找到愿意一起试错的程序员伙伴。</p>
              </>
            ),
          },
        ]}
        ctaLinks={[
          { href: '/projects', label: '查看项目库' },
          { href: '/how-it-works', label: '查看协作流程说明' },
          { href: '/developers', label: '查看程序员库' },
        ]}
      />
    </>
  );
}

import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getHowToJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '如何发布更容易吸引程序员的项目',
  description: '给项目方的说明页：怎样描述项目、场景与最小切口，才能更高质量地吸引适合做 MVP 的程序员。',
  path: '/how-to-post-a-project',
  keywords: ['如何发布项目', '项目方如何找程序员', '如何写项目简介', '吸引程序员的项目描述'],
});

export default function HowToPostAProjectPage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '如何发布更容易吸引程序员的项目', path: '/how-to-post-a-project' },
    ]),
    getHowToJsonLd({
      name: '如何发布更容易吸引程序员的项目',
      description: '围绕真实场景、真实问题和最小切口描述项目，提高项目对程序员的吸引力与匹配度。',
      totalTime: 'P1D',
      steps: [
        { name: '先说清真实问题', text: '描述清楚你要解决的真实用户问题，而不是只说想做一个平台。' },
        { name: '再说清场景与资源', text: '补充行业背景、已有验证、资源基础或客户线索。' },
        { name: '最后说清第一版最小目标', text: '让程序员看到 MVP 的边界和优先级，而不是无限扩张的需求清单。' },
      ],
    }),
    getFAQPageJsonLd([
      { question: '项目方发项目时最容易犯什么错误？', answer: '最常见的错误是描述过于抽象，只谈大方向，不谈真实问题、真实场景和最小验证目标。' },
      { question: '程序员更关心什么信息？', answer: '程序员更关心问题是否真实、项目边界是否清楚、第一版是否适合做 MVP，以及合作对象是否靠谱。' },
      { question: '为什么不建议一开始写很长的功能清单？', answer: '因为创业初期最重要的是验证方向，而不是一开始就堆满功能。太长的清单反而会降低判断效率。' },
    ]),
    getItemListJsonLd({
      title: '发布项目的关键要点',
      path: '/how-to-post-a-project',
      items: [
        { name: '说清真实问题', url: '/how-to-post-a-project', description: '让程序员知道你在解决什么。' },
        { name: '说明场景与资源', url: '/how-to-post-a-project', description: '体现项目不是空想。' },
        { name: '明确 MVP 边界', url: '/how-to-post-a-project', description: '让第一版目标足够清晰。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="Project Posting Guide"
        title="如何发布一个更容易吸引程序员的项目"
        lead={<>好的项目描述不是写得越多越好，而是越能帮助程序员快速判断“这个问题是不是真的、值不值得、能不能先做一个 MVP”越好。</>}
        sections={[
          { title: '先说问题，不要先说宏大愿景', content: <><p>程序员最怕看到的不是复杂，而是空泛。与其说“想做一个行业平台”，不如先说清楚正在发生的具体问题。</p><p>当问题足够真实，项目自然更有吸引力。</p></> },
          { title: '让人看到你有真实场景', content: <><p>如果你已经接触过客户、跑过线下流程、知道谁会使用或付费，这些信息非常重要。</p><p>它们会显著提高项目的可信度和合作意愿。</p></> },
          { title: '不要把第一版写成终局产品', content: <><p>真正让程序员愿意接触的，往往不是功能很多，而是边界清楚、能快速验证的第一版。</p><p>一个清晰的最小切口，比十页功能清单更有价值。</p></> },
          { title: '双向授权流程为什么有帮助', content: <><p>因为平台允许你先公开基础信息，再逐步开放更详细内容，这样既能吸引合适的人，又能保护过早暴露的敏感信息。</p></> },
        ]}
        ctaLinks={[
          { href: '/for-experts', label: '查看给项目方的说明' },
          { href: '/projects', label: '查看项目库' },
          { href: '/mvp-guide', label: '查看 MVP 指南' },
        ]}
      />
    </>
  );
}

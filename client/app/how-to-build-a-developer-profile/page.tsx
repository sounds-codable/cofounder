import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getHowToJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '程序员如何写更有效的公开卡片',
  description: '给程序员的说明页：如何写更有效的公开资料，让项目方更容易判断你是否适合一起做 MVP。',
  path: '/how-to-build-a-developer-profile',
  keywords: ['程序员资料怎么写', '程序员公开卡片', '程序员如何吸引项目方', '技术合伙人资料'],
});

export default function HowToBuildADeveloperProfilePage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '程序员如何写更有效的公开卡片', path: '/how-to-build-a-developer-profile' },
    ]),
    getHowToJsonLd({
      name: '程序员如何写更有效的公开卡片',
      description: '展示问题拆解能力、项目经验和协作方式，而不是只堆技术名词。',
      totalTime: 'P1D',
      steps: [
        { name: '先写你解决过什么问题', text: '不要只列技术栈，优先说你做过哪些类型的问题与产品。' },
        { name: '再写你适合做什么类型的 MVP', text: '让项目方理解你的协作风格与擅长方向。' },
        { name: '最后写你希望合作什么样的项目方', text: '反向筛选，提升双方匹配度。' },
      ],
    }),
    getFAQPageJsonLd([
      { question: '为什么只写技术栈不够？', answer: '因为项目方更关心你能否理解业务问题、拆解 MVP、快速验证，而不只是会不会某个框架。' },
      { question: '程序员公开资料最该突出什么？', answer: '最该突出的是你做过什么问题、如何推进上线、怎样和业务方协作，以及你适合什么类型的项目。' },
      { question: '为什么要写自己想合作的对象？', answer: '因为高质量匹配不是谁都可以合作，而是双方都要知道自己更适合什么样的协作关系。' },
    ]),
    getItemListJsonLd({
      title: '程序员公开卡片优化要点',
      path: '/how-to-build-a-developer-profile',
      items: [
        { name: '优先写解决过的问题', url: '/how-to-build-a-developer-profile', description: '比技术名词更重要。' },
        { name: '说明适合做的 MVP 类型', url: '/how-to-build-a-developer-profile', description: '让项目方快速判断。' },
        { name: '表达合作偏好', url: '/how-to-build-a-developer-profile', description: '帮助双向筛选。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="Developer Profile Guide"
        title="程序员如何写一张更有效的公开卡片"
        lead={<>一张好的程序员公开卡片，不是把所有技术栈都写满，而是让项目方快速看懂：你解决过什么问题、擅长做哪类 MVP、是否适合一起长期合作。</>}
        sections={[
          { title: '不要只展示“会什么”，更要展示“做成过什么”', content: <><p>项目方并不天然理解技术名词的价值，但很容易理解你是否做过增长工具、内容产品、数据系统、自动化工作流等真实产品。</p><p>因此，问题类型和结果比单纯技术名词更重要。</p></> },
          { title: '让项目方知道你适合什么合作方式', content: <><p>你是偏快速试错、偏全栈推进、偏后端系统、还是偏 AI 集成与工作流？这些信息会直接影响匹配效率。</p></> },
          { title: '公开资料也是反向筛选工具', content: <><p>你也应该写清楚自己更愿意和什么样的项目方合作，例如偏真实场景、偏长期协作、偏有验证意识。</p><p>这样能减少低质量接触。</p></> },
          { title: '为什么平台卡片适合做这种表达', content: <><p>因为卡片机制允许先公开基础能力与协作偏好，再在授权后逐步开放更多资料，既利于判断，也保护隐私。</p></> },
        ]}
        ctaLinks={[
          { href: '/for-developers', label: '查看给程序员的说明' },
          { href: '/developers', label: '查看程序员库' },
          { href: '/find-real-startup-projects', label: '查看如何找真实项目' },
        ]}
      />
    </>
  );
}

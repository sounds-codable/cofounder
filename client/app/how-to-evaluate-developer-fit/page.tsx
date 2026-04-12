import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getHowToJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '项目方如何判断程序员是否适合合作',
  description: '帮助项目方判断程序员是否适合长期合作，包括问题拆解能力、MVP 推进能力、协作方式与业务理解。',
  path: '/how-to-evaluate-developer-fit',
  keywords: ['项目方如何判断程序员', '如何判断程序员是否靠谱', '技术合伙人判断标准', '程序员匹配度'],
});

export default function HowToEvaluateDeveloperFitPage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '项目方如何判断程序员是否适合合作', path: '/how-to-evaluate-developer-fit' },
    ]),
    getHowToJsonLd({
      name: '项目方如何判断程序员是否适合合作',
      description: '优先判断程序员是否能理解问题、推进 MVP、接受协作磨合，并在真实业务约束下持续迭代。',
      totalTime: 'P1D',
      steps: [
        { name: '先看问题拆解能力', text: '判断对方能否把模糊需求拆成清晰的 MVP 路径。' },
        { name: '再看真实项目经验', text: '看对方是否做过类似场景或真实上线产品。' },
        { name: '最后看协作方式是否合适', text: '看对方是否愿意长期磨合并理解业务约束。' },
      ],
    }),
    getFAQPageJsonLd([
      { question: '项目方最容易误判程序员的地方是什么？', answer: '最容易只看技术栈，而忽略对方是否具备问题拆解、MVP 推进和长期协作能力。' },
      { question: '为什么做过真实产品比会很多技术名词更重要？', answer: '因为真实产品经验意味着对方更可能理解上线、迭代、反馈和业务约束，而不仅仅是写代码。' },
      { question: '什么样的程序员更适合早期合作？', answer: '更适合的是能快速试错、愿意和业务方反复沟通、并能在不确定中推进 MVP 的程序员。' },
    ]),
    getItemListJsonLd({
      title: '判断程序员是否适合合作的标准',
      path: '/how-to-evaluate-developer-fit',
      items: [
        { name: '能否拆解问题', url: '/how-to-evaluate-developer-fit', description: '是否有清晰的 MVP 视角。' },
        { name: '是否做过真实产品', url: '/how-to-evaluate-developer-fit', description: '是否有上线与迭代经验。' },
        { name: '协作方式是否匹配', url: '/how-to-evaluate-developer-fit', description: '是否适合长期磨合。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="Developer Fit"
        title="项目方如何判断一个程序员是否适合合作"
        lead={<>项目方真正需要判断的，通常不是“他会不会这个框架”，而是“他能不能和我一起把真实问题做成可验证的 MVP，并持续迭代下去”。</>}
        sections={[
          {
            title: '不要只按技术栈判断人',
            content: (
              <>
                <p>技术栈只是工具，真正重要的是对方能否把问题拆开、给出边界、快速推进第一版。</p>
                <p>如果只看会不会某个框架，往往会忽略更关键的协作质量。</p>
              </>
            ),
          },
          {
            title: '优先看是否做过真实产品',
            content: (
              <>
                <p>做过真实产品的人，通常更理解上线、迭代、反馈与取舍，也更容易面对不确定性。</p>
                <p>这比只会按清单开发更适合创业早期。</p>
              </>
            ),
          },
          {
            title: '看是否愿意理解业务与场景',
            content: (
              <>
                <p>好的合作不是业务方讲一句、程序员做一句，而是双方围绕真实问题共同判断。</p>
                <p>愿意理解业务的人，通常更适合长期共创。</p>
              </>
            ),
          },
          {
            title: '看是否适合长期磨合',
            content: (
              <>
                <p>创业合作不是一次性交付，更像持续磨合。适合合作的人，通常既能推进，也能沟通，还能接受边界变化。</p>
              </>
            ),
          },
        ]}
        ctaLinks={[
          { href: '/developers', label: '查看程序员库' },
          { href: '/find-technical-cofounder', label: '查看如何找技术合伙人' },
          { href: '/for-experts', label: '查看给项目方的说明' },
        ]}
      />
    </>
  );
}

import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getHowToJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '程序员如何判断项目是否值得合作',
  description: '帮助程序员判断一个项目是否值得投入时间合作，包括真实问题、验证路径、合作对象与长期价值。',
  path: '/how-to-evaluate-project-fit',
  keywords: ['程序员如何判断项目', '如何判断项目值不值得做', '程序员找项目判断标准', '项目匹配度'],
});

export default function HowToEvaluateProjectFitPage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '程序员如何判断项目是否值得合作', path: '/how-to-evaluate-project-fit' },
    ]),
    getHowToJsonLd({
      name: '程序员如何判断项目是否值得合作',
      description: '优先判断问题是否真实、验证路径是否清楚、合作对象是否靠谱，以及项目是否值得长期投入。',
      totalTime: 'P1D',
      steps: [
        { name: '先判断问题是否真实', text: '看项目是否能说清用户、场景和痛点。' },
        { name: '再判断是否适合做 MVP', text: '看是否存在清晰的最小切口与验证目标。' },
        { name: '最后判断合作对象是否值得磨合', text: '看对方是否理性、清楚并愿意长期协作。' },
      ],
    }),
    getFAQPageJsonLd([
      { question: '程序员最该先看项目的什么信息？', answer: '最该先看真实问题、真实场景、最小验证路径，以及项目方是否能清楚表达这些信息。' },
      { question: '什么样的项目最容易踩坑？', answer: '只谈宏大方向、没有明确用户、没有最小切口、没有验证意识的项目，通常最容易导致低质量投入。' },
      { question: '为什么合作对象也很重要？', answer: '因为长期价值不仅来自项目本身，还来自合作过程是否理性、透明和可持续。' },
    ]),
    getItemListJsonLd({
      title: '判断项目是否值得合作的标准',
      path: '/how-to-evaluate-project-fit',
      items: [
        { name: '问题是否真实', url: '/how-to-evaluate-project-fit', description: '有没有真实场景与用户。' },
        { name: '是否适合做 MVP', url: '/how-to-evaluate-project-fit', description: '有没有最小切口。' },
        { name: '合作对象是否靠谱', url: '/how-to-evaluate-project-fit', description: '是否值得长期磨合。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="Project Fit"
        title="程序员如何判断一个项目是否值得合作"
        lead={<>不是每个看起来像创业项目的东西都值得投入。真正值得合作的项目，通常同时满足四件事：问题真实、切口清楚、验证可行、合作对象靠谱。</>}
        sections={[
          {
            title: '第一层：先看问题是不是真的存在',
            content: (
              <>
                <p>如果项目方说不清用户是谁、痛点在哪、为什么这个问题值得优先解决，那么大概率还停留在想象阶段。</p>
                <p>真实问题通常能对应真实场景，而不是泛泛地说“未来很大”。</p>
              </>
            ),
          },
          {
            title: '第二层：看有没有最小验证路径',
            content: (
              <>
                <p>值得合作的项目通常能讲清楚第一版先验证什么，而不是一上来就要求做一个完整平台。</p>
                <p>程序员应优先寻找适合做 MVP 的项目，而不是一开始就边界失控的项目。</p>
              </>
            ),
          },
          {
            title: '第三层：看项目方是否适合长期协作',
            content: (
              <>
                <p>一个项目是否值得做，不只是看问题本身，也要看提出问题的人是否讲理、清楚、愿意共同面对不确定性。</p>
                <p>合作对象不靠谱，再好的方向也可能被拖垮。</p>
              </>
            ),
          },
          {
            title: '第四层：看你是否能从中积累长期价值',
            content: (
              <>
                <p>好的项目不仅让你完成交付，更让你积累场景理解、验证经验和长期协作关系。</p>
                <p>这类项目通常比短期外包更值得投入。</p>
              </>
            ),
          },
        ]}
        ctaLinks={[
          { href: '/projects', label: '查看项目库' },
          { href: '/find-real-startup-projects', label: '查看如何找真实创业项目' },
          { href: '/for-developers', label: '查看给程序员的说明' },
        ]}
      />
    </>
  );
}

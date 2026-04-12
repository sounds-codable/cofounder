import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'AI 时代创业',
  description: '围绕 AI 时代创业的说明页：为什么行业专家与程序员的协作，会成为更现实的产品起点与创业路径。',
  path: '/ai-era-startup',
  keywords: ['AI 时代创业', 'AI 创业方向', '行业专家创业', '程序员创业', 'AI 与 MVP'],
});

export default function AiEraStartupPage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: 'AI 时代创业', path: '/ai-era-startup' },
    ]),
    getFAQPageJsonLd([
      {
        question: '为什么 AI 时代更适合做小而快的创业尝试？',
        answer: '因为 AI 让开发与试错成本下降，做出可验证版本的速度更快，更适合围绕真实需求快速测试方向。',
      },
      {
        question: '为什么行业专家和程序员组合更有优势？',
        answer: '行业专家更接近真实问题和真实客户，程序员更擅长把问题转成系统与产品，两者结合更容易做出有真实价值的 MVP。',
      },
      {
        question: 'AI 会不会让程序员和行业专家都被替代？',
        answer: 'AI 会改变分工，但越是如此，越需要真实场景理解与快速落地能力的结合，而这正是专家与程序员协作的价值所在。',
      },
    ]),
    getItemListJsonLd({
      title: 'AI 时代创业的关键判断',
      path: '/ai-era-startup',
      items: [
        { name: '优先找真实问题', url: '/ai-era-startup', description: '比抽象趋势更重要的是具体问题。' },
        { name: '快速做 MVP', url: '/ai-era-startup', description: '先验证，再扩张。' },
        { name: '让专家与程序员协作', url: '/ai-era-startup', description: '把行业理解和技术实现结合起来。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="AI Era Startup"
        title="为什么 AI 时代更适合从真实场景做创业"
        lead={<>AI 让开发门槛下降，但真正稀缺的从来不是“能不能做”，而是“该做什么”“为什么有人会持续使用和付费”。因此，AI 时代更需要真实行业场景和快速实现能力的结合。</>}
        sections={[
          {
            title: 'AI 让实现更快，但不会自动给你真实需求',
            content: (
              <>
                <p>很多人以为有了 AI，最难的问题已经解决。其实 AI 主要降低的是实现成本，而不是需求判断成本。</p>
                <p>真正难的依然是：你到底在解决谁的问题，这个问题值不值得优先解决。</p>
              </>
            ),
          },
          {
            title: '为什么行业专家会变得更重要',
            content: (
              <>
                <p>行业专家知道哪些问题真的痛、哪些流程真的低效、哪些客户真的愿意付费。</p>
                <p>在 AI 时代，这些真实场景知识反而比“泛泛创意”更有价值。</p>
              </>
            ),
          },
          {
            title: '为什么程序员会变得更像产品合作者',
            content: (
              <>
                <p>程序员不再只是实现需求的人，而更像把真实问题快速转成可验证系统的产品合作者。</p>
                <p>尤其在创业早期，能快速做出 MVP 并不断迭代的程序员，会成为极强的协作资产。</p>
              </>
            ),
          },
          {
            title: '叩饭 Cofounder 为什么适合这类协作',
            content: (
              <>
                <p>因为平台鼓励从真实业务场景出发，让项目方与程序员先完成高质量判断，再逐步进入深入合作。</p>
                <p>这比纯流量式社交更适合 AI 时代的小团队创业与 MVP 验证。</p>
              </>
            ),
          },
        ]}
        ctaLinks={[
          { href: '/origin', label: '查看平台缘起' },
          { href: '/mvp-guide', label: '查看 MVP 指南' },
          { href: '/how-it-works', label: '查看协作流程说明' },
        ]}
      />
    </>
  );
}

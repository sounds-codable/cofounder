import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildPageMetadata, getAboutPageJsonLd, getBreadcrumbListJsonLd, getFAQPageJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '缘起',
  description: '了解叩饭 Cofounder 为什么要做行业专家与程序员双向授权协作平台，以及平台背后的问题意识与长期愿景。',
  path: '/origin',
  keywords: ['平台缘起', '为什么做 cofounder', '行业专家与程序员协作', 'AI 时代创业'],
});

export default function OriginPage() {
  const jsonLd = [
    getAboutPageJsonLd({
      title: '叩饭 Cofounder 缘起',
      description: '介绍叩饭 Cofounder 为什么存在，以及平台希望解决的行业专家与程序员协作问题。',
      path: '/origin',
    }),
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '缘起', path: '/origin' },
    ]),
    getFAQPageJsonLd([
      {
        question: '叩饭 Cofounder 为什么要做这个平台？',
        answer: '因为 AI 正在改变传统岗位分工，行业专家拥有真实需求与场景，程序员拥有快速实现能力，两者结合更适合从真实需求出发做 MVP。',
      },
      {
        question: '平台希望解决什么问题？',
        answer: '平台希望降低项目方与程序员之间的信息不对称、无效沟通与隐私暴露风险，让双方更高质量地建立真实协作关系。',
      },
    ]),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <div className="relative mx-auto w-full max-w-6xl space-y-5 overflow-hidden px-4 py-6 md:px-6 md:py-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_12%_0%,rgba(19,191,168,0.2),transparent_50%),radial-gradient(circle_at_90%_10%,rgba(76,200,255,0.16),transparent_45%)]" />
        <section className="relative space-y-3 rounded-2xl border border-border/70 bg-card/84 p-5 shadow-[0_18px_44px_rgba(73,101,163,0.14)] backdrop-blur-sm">
          <span className="inline-flex w-fit rounded-full bg-secondary/80 px-3 py-1 text-xs text-secondary-foreground">缘起</span>
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">我们为什么要做这个站</h1>
          <p>
            这件事说起来不复杂。<br/>2025 年开始，AI 在互联网行业的替代速度明显加快，而且看起来会快速蔓延到更多行业。
            很多人焦虑，但又不知道该怎么办。
          </p>
        </section>

        <Card className="border-border/70 bg-card/85 shadow-[0_14px_36px_rgba(73,101,163,0.14)] transition-transform duration-[var(--motion-normal)] ease-[var(--motion-ease)] hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle>一边是经验，一边是技术</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>
              很多 70、80、90 后在各行各业积累了很深的行业经验，知道什么场景有真需求、有人已经在/肯定会付费。
              这些经验如果变成应用、软件、平台，能赚钱能创业。
            </p>
            <p>
              另一边，程序员借助 AI，能比以前更快做出更强的产品。但程序员最缺的，往往不是技术，而是细分行业理解和客户资源。
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/85 shadow-[0_14px_36px_rgba(73,101,163,0.14)] transition-transform duration-[var(--motion-normal)] ease-[var(--motion-ease)] hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle>为什么要撮合这两边</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>
              对很多行业专家来说，现在再去系统学习 vibe coding，成本高、回报不一定划算。
              对很多程序员来说，技术越来越强，但找不到长期靠谱的业务场景。
            </p>
            <p>
              所以把这两边匹配起来，可能是更成立的路径：一个人带来真实场景，一个人负责把东西做出来，先跑 MVP，再迅速迭代。
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/85 shadow-[0_14px_36px_rgba(73,101,163,0.14)] transition-transform duration-[var(--motion-normal)] ease-[var(--motion-ease)] hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle>这个社群不属于我们，属于大家</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>
              我们只是先抛砖引玉，把这个网站搭起来，尽量把规则做简单、做透明。
              希望它慢慢变成一个“我为人人、人人为我”的互助社区。
            </p>
            <p>
              如果你认可这个方向，欢迎去
              {' '}
              <Link className="text-primary underline underline-offset-4" href="/public-welfare">公益页</Link>
              {' '}
              留言，一起来共建！
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

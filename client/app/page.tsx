'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Code2, Cpu, Handshake, Rocket, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type RolePanel = {
  eyebrow: string;
  title: string;
  items: string[];
  note: string;
  icon: LucideIcon;
};

type LaunchCard = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const rolePanels = [
  {
    eyebrow: '给项目方 / 专业人士',
    title: '两件事会很快发生',
    items: ['AI 替代工作是必然，而且速度会超出多数人的预期。', '职场中年危机一直存在，年轻人会持续冲击传统岗位。'],
    note: '现在最稳妥的做法，不是观望，而是尽快把行业经验做成细分应用。',
    icon: BriefcaseBusiness,
  },
  {
    eyebrow: '给程序员',
    title: '现实已经很明确',
    items: ['大量程序员已经被优化，更多人正在路上。', '大多数人只有遇到通用需求，而通用需求会被大厂快速覆盖。'],
    note: '更容易成功的方向，是和垂直领域专家一起做小而深的应用。',
    icon: Code2,
  },
] satisfies RolePanel[];

const launchCards = [
  {
    eyebrow: 'WHY',
    title: '为什么必须是「程序员 × 专家」',
    description: '只有专家，想法落不了地；只有程序员，产品容易偏方向。两个人一起，才是最快且最稳的起点。',
    icon: Handshake,
  },
  {
    eyebrow: 'HOW',
    title: '我们怎么让双方真正合作',
    description: '专家发布场景与资源，程序员发布技术与节奏。双向匹配后先做 MVP，边做边验证，边合作边迭代。',
    icon: Workflow,
  },
  {
    eyebrow: 'WHAT',
    title: '你会得到什么',
    description: '专家拿到可落地产品，程序员拿到真实业务场景。一起把「点子」变成「可验证的产品」。',
    icon: Rocket,
  },
] satisfies LaunchCard[];

const flowSteps = [
  {
    id: '01',
    title: '项目方先发项目简介',
    description: '公开基础信息后，程序员先判断是否值得申请了解详情。',
    icon: Sparkles,
  },
  {
    id: '02',
    title: '项目方先做决定',
    description: '程序员申请后，项目方先看程序员详细信息，再决定是否开放项目详情。',
    icon: ShieldCheck,
  },
  {
    id: '03',
    title: '程序员再做决定',
    description: '程序员看到项目详情后，再决定是否交换联系方式并继续深入沟通。',
    icon: CheckCircle2,
  },
];

const deferredSectionStyle: CSSProperties = {
  contentVisibility: 'auto',
  contain: 'layout style paint',
  containIntrinsicSize: '1px 1100px',
};

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-95">
        <div className="home-fx-orb home-fx-orb--wide absolute -left-[28vw] top-[-10vh] h-[56vh] w-[56vh] rounded-full bg-[radial-gradient(circle,rgba(120,144,255,0.4)_0%,rgba(120,144,255,0)_72%)] [animation:driftOrbit_22s_ease-in-out_infinite] motion-reduce:[animation:none]" />
        <div className="home-fx-orb absolute -right-[20vw] top-[18vh] h-[52vh] w-[52vh] rounded-full bg-[radial-gradient(circle,rgba(86,223,201,0.34)_0%,rgba(86,223,201,0)_72%)] [animation:driftOrbit_18s_ease-in-out_infinite_reverse] motion-reduce:[animation:none]" />
        <div className="home-fx-orb home-fx-orb--wide absolute bottom-[-28vh] left-1/2 h-[64vh] w-[64vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(162,120,255,0.26)_0%,rgba(162,120,255,0)_75%)] [animation:floatY_15s_ease-in-out_infinite] motion-reduce:[animation:none]" />
      </div>

      <section className="relative flex min-h-[calc(100vh-84px)] items-center">
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-10 md:grid-cols-[1.05fr_0.95fr] md:gap-7 md:px-6 md:py-14">
          <div className="rounded-[30px] border border-white/70 bg-white/72 p-1.5 shadow-[0_30px_80px_rgba(73,101,163,0.17)] backdrop-blur-[3px] max-md:backdrop-blur-0 [animation:fadeRise_var(--motion-slow)_var(--motion-ease)_both]">
            <Card className="h-full border-border/60 bg-gradient-to-br from-card/96 via-card/92 to-background/86 shadow-none">
              <CardHeader className="space-y-5 md:space-y-6">
                <span className="inline-flex w-fit rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-medium tracking-wide text-secondary-foreground">ICU · I SEE YOU</span>
                <CardTitle className="text-4xl leading-[1.04] md:text-6xl">AI 时代，<br />不做旁观者。</CardTitle>
                <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg">先做一个 MVP，给自己留住主动权，而不是等被替代。</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2.5">
                  <Link className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')} href="/login?next=/onboarding/basic%3Frole%3Dexpert">
                    项目方发布项目
                  </Link>
                  <Link className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full sm:w-auto')} href="/login?next=/onboarding/basic%3Frole%3Ddeveloper">
                    程序员登记信息
                  </Link>
                </div>
                <div className="flex flex-wrap gap-5 text-sm">
                  <Link className="font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80" href="/projects">
                    瞧瞧项目库
                  </Link>
                  <Link className="font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80" href="/developers">
                    瞅瞅程序员
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="relative overflow-hidden border-border/70 bg-white/88 [animation:fadeRise_var(--motion-slow)_var(--motion-ease)_both] [animation-delay:0.12s]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(150deg,rgba(124,141,255,0.13)_0%,transparent_50%,rgba(87,217,197,0.18)_100%)]" />
            <div className="home-fx-orb absolute -left-24 top-12 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(91,210,255,0.26)_0%,rgba(91,210,255,0)_72%)] [animation:driftOrbit_20s_ease-in-out_infinite] motion-reduce:[animation:none]" />
            <CardHeader className="relative pb-2">
              <CardTitle className="text-xl">协作焦点</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4 text-sm">
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-slate-50/95 p-4 shadow-[0_16px_38px_rgba(79,108,163,0.14)] md:p-5">
                <div className="home-fx-sweep absolute -left-20 top-1/2 h-32 w-56 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/40 via-cyan-300/25 to-transparent blur-2xl [animation:sweepX_6.5s_linear_infinite] motion-reduce:[animation:none]" />
                <div className="relative grid gap-3">
                  <div className="rounded-xl border border-border/60 bg-white/86 p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <BriefcaseBusiness className="size-4 text-primary" />
                      专家提供行业场景
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="size-5 text-primary/80" />
                  </div>
                  <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/16 via-white/96 to-cyan-200/26 p-3 shadow-[0_12px_30px_rgba(110,132,221,0.18)]">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Cpu className="size-4 text-primary" />
                      联合做 MVP 验证
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="size-5 text-primary/80" />
                  </div>
                  <div className="rounded-xl border border-border/60 bg-white/86 p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Code2 className="size-4 text-primary" />
                      程序员持续迭代落地
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs leading-6 text-muted-foreground">先把“行业场景”和“技术能力”连接，再落到可验证的 MVP，这张图就是你接下来要走的主线。</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="relative flex min-h-[92vh] items-center py-8 md:py-12" style={deferredSectionStyle}>
        <div className="pointer-events-none absolute inset-0 opacity-90">
          <div className="home-fx-orb home-fx-orb--wide absolute -right-24 top-12 h-[42vh] w-[42vh] rounded-full bg-[radial-gradient(circle,rgba(72,137,255,0.25)_0%,rgba(72,137,255,0)_72%)] [animation:driftOrbit_24s_ease-in-out_infinite_reverse] motion-reduce:[animation:none]" />
          <div className="home-fx-orb absolute left-[-14vw] bottom-[-16vh] h-[44vh] w-[44vh] rounded-full bg-[radial-gradient(circle,rgba(75,214,190,0.23)_0%,rgba(75,214,190,0)_72%)] [animation:floatY_13s_ease-in-out_infinite] motion-reduce:[animation:none]" />
        </div>
        <div className="relative mx-auto grid w-full max-w-6xl gap-4 px-4 md:grid-cols-2 md:px-6">
          {rolePanels.map((panel, index) => {
            const Icon = panel.icon;
            return (
              <Card
                className="border-border/70 bg-white/88 transition-all duration-[var(--motion-normal)] ease-[var(--motion-ease)] hover:-translate-y-1.5 hover:shadow-[0_22px_52px_rgba(73,101,163,0.19)] [animation:fadeRise_var(--motion-slow)_var(--motion-ease)_both]"
                key={panel.eyebrow}
                style={{ animationDelay: `${0.12 + index * 0.13}s` }}
              >
                <CardHeader className="space-y-3">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/65 bg-white/85 px-3 py-1 text-xs text-secondary-foreground">
                    <Icon className="size-3.5 text-primary" />
                    {panel.eyebrow}
                  </span>
                  <CardTitle className="text-2xl leading-tight">{panel.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
                  {panel.items.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                  <p className="font-medium text-foreground">{panel.note}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="relative flex min-h-[92vh] items-center py-8 md:py-12" style={deferredSectionStyle}>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(196,230,255,0.2)_40%,rgba(203,214,255,0.15)_100%)]" />
        <div className="home-fx-sweep home-fx-sweep--wide absolute -left-[18vw] top-[18vh] h-[34vh] w-[60vw] rotate-[-12deg] bg-[linear-gradient(90deg,transparent_0%,rgba(124,141,255,0.2)_48%,transparent_100%)] [animation:sweepX_8s_linear_infinite] motion-reduce:[animation:none]" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-4 px-4 md:grid-cols-3 md:px-6">
          {launchCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card
                className="border-border/70 bg-white/90 transition-all duration-[var(--motion-normal)] ease-[var(--motion-ease)] hover:-translate-y-1.5 hover:shadow-[0_22px_52px_rgba(73,101,163,0.19)] [animation:fadeRise_var(--motion-slow)_var(--motion-ease)_both]"
                key={card.eyebrow}
                style={{ animationDelay: `${0.18 + index * 0.12}s` }}
              >
                <CardHeader className="space-y-3">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/65 bg-white/90 px-3 py-1 text-xs text-secondary-foreground">
                    <Icon className="size-3.5 text-primary" />
                    {card.eyebrow}
                  </span>
                  <CardTitle className="text-xl leading-tight">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="relative flex min-h-[90vh] items-center py-8 md:py-12" style={deferredSectionStyle}>
        <div className="pointer-events-none absolute inset-0">
          <div className="home-fx-orb absolute left-[8vw] top-[12vh] h-[32vh] w-[32vh] rounded-full border border-white/70 bg-white/32 [animation:floatY_12s_ease-in-out_infinite] motion-reduce:[animation:none]" />
          <div className="home-fx-orb absolute right-[6vw] bottom-[10vh] h-[26vh] w-[26vh] rounded-full border border-cyan-200/55 bg-cyan-200/20 [animation:driftOrbit_19s_ease-in-out_infinite_reverse] motion-reduce:[animation:none]" />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-4 md:px-6 [animation:fadeRise_var(--motion-slow)_var(--motion-ease)_both]">
          <Card className="border-border/65 bg-white/90">
            <CardHeader className="space-y-3">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/65 bg-white/88 px-3 py-1 text-xs text-secondary-foreground">
                <Workflow className="size-3.5 text-primary" />
                FLOW
              </span>
              <CardTitle className="text-2xl leading-tight md:text-3xl">建立联系，只走 3 步。</CardTitle>
              <p className="text-sm text-muted-foreground md:text-base">先看基础信息，再按阶段授权，让双方在更了解彼此后再决定是否联系。</p>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {flowSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <article className="rounded-xl border border-border/65 bg-background/90 p-4 transition-transform duration-[var(--motion-normal)] ease-[var(--motion-ease)] hover:-translate-y-1" key={step.id}>
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Icon className="size-3.5 text-primary" />
                      {step.id}
                    </span>
                    <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                  </article>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="relative flex min-h-[76vh] items-center pb-14 pt-8 md:pt-12" style={deferredSectionStyle}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(124,141,255,0.22),transparent_55%),radial-gradient(circle_at_90%_90%,rgba(87,217,197,0.26),transparent_48%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 md:px-6 [animation:fadeRise_var(--motion-slow)_var(--motion-ease)_both]">
          <Card className="border-border/70 bg-gradient-to-r from-white/90 via-card/95 to-white/92 shadow-[0_20px_54px_rgba(73,101,163,0.15)]">
            <CardHeader className="space-y-3">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/65 bg-white/86 px-3 py-1 text-xs text-secondary-foreground">
                <Rocket className="size-3.5 text-primary" />
                Now or Never
              </span>
              <CardTitle className="text-2xl leading-tight md:text-3xl">别再等风向，直接开始做。</CardTitle>
              <p className="text-sm text-muted-foreground md:text-base">让真实项目与真实能力先碰撞，再把点子变成结果。现在就进入你的第一步。</p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link className={buttonVariants({ size: 'lg' })} href="/login?next=/onboarding/basic%3Frole%3Dexpert">
                项目方发布项目
              </Link>
              <Link className={buttonVariants({ variant: 'outline', size: 'lg' })} href="/login?next=/onboarding/basic%3Frole%3Ddeveloper">
                程序员登记信息
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

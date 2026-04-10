'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Code2, Cpu, Handshake, Rocket, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { MvpTerm } from '@/components/mvp-term';
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

type FlowStep = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

type FlowScenario = {
  key: 'developer_to_expert' | 'expert_to_developer';
  label: string;
  steps: FlowStep[];
};

const rolePanels = [
  {
    eyebrow: '给项目方 / 专业人士',
    title: '两件事会很快发生',
    items: ['AI 替代工作是必然，而且速度会超出多数人的预期。', '职场中年危机一直存在，年轻人会持续冲击传统岗位。'],
    note: '最明智的做法，不是观望，而是（比别人先）把行业经验做成细分应用。',
    icon: BriefcaseBusiness,
  },
  {
    eyebrow: '给程序员',
    title: '现实已经很明确',
    items: ['大量程序员已经被优化，更多人正在路上。', '大多数程序员只了解通用需求，而通用需求会被大厂快速覆盖。'],
    note: '更容易成功的方向，是和垂直领域专家一起做小而深的细分应用。',
    icon: Code2,
  },
] satisfies RolePanel[];

const launchCards = [
  {
    eyebrow: 'WHY',
    title: '为什么必须是「程序员 × 专家」',
    description: '只有专家，想法落不了地；只有程序员，做不出细分应用。两个人一起，才是最快且最稳的起点。',
    icon: Handshake,
  },
  {
    eyebrow: 'HOW',
    title: '如何让双方真正合作',
    description: '专家提供真需求并营销产品，程序员负责技术实现。双向匹配后先做 MVP，边合作边验证。',
    icon: Workflow,
  },
  {
    eyebrow: 'WHAT',
    title: '你们会得到什么',
    description: '专家快速得到 MVP 验证需求，程序员深入了解细分行业真实场景。开始行动，就有收获！',
    icon: Rocket,
  },
] satisfies LaunchCard[];

const flowScenarios = [
  {
    key: 'developer_to_expert',
    label: '程序员联系项目方',
    steps: [
      {
        id: '01',
        title: '抛砖 —— 项目方：示意',
        description: '项目方公开项目简介。程序员判断价值，决定是否申请。',
        icon: Sparkles,
      },
      {
        id: '02',
        title: '引玉 —— 项目方：遴选',
        description: '程序员申请时提交个人简介。项目方查阅后，决定是否提供项目详情。',
        icon: ShieldCheck,
      },
      {
        id: '03',
        title: '连线 —— 程序员：拍板',
        description: '程序员看到完整信息后，决定是否交换联系方式。双方用微信等自行联络，不受平台限制。',
        icon: CheckCircle2,
      },
    ],
  },
  {
    key: 'expert_to_developer',
    label: '项目方联系程序员',
    steps: [
      {
        id: '01',
        title: '抛砖 —— 程序员：示意',
        description: '程序员公开个人简介。项目方判断价值，决定是否申请。',
        icon: Sparkles,
      },
      {
        id: '02',
        title: '引玉 —— 程序员：甄选',
        description: '项目方申请时提交个人及项目详请。程序员查阅后，决定是否提供详细个人资料。',
        icon: ShieldCheck,
      },
      {
        id: '03',
        title: '连线 —— 项目方：定夺',
        description: '项目方看到完整信息后，决定是否交换联系方式。双方用微信等自行联络，不受平台限制。',
        icon: CheckCircle2,
      },
    ],
  },
] satisfies FlowScenario[];

const deferredSectionStyle: CSSProperties = {
  contentVisibility: 'auto',
  contain: 'layout style paint',
  containIntrinsicSize: '1px 1100px',
};

function renderTextWithMvp(text: string) {
  const parts = text.split('MVP');

  if (parts.length <= 1) {
    return text;
  }

  return parts.map((part, index) => (
    <span key={`${part}-${index}`}>
      {part}
      {index < parts.length - 1 ? <MvpTerm className="text-sm leading-7" /> : null}
    </span>
  ));
}

export default function HomePage() {
  const [activeFlowScenario, setActiveFlowScenario] = useState<FlowScenario['key']>('developer_to_expert');
  const currentFlowScenario = flowScenarios.find((scenario) => scenario.key === activeFlowScenario) ?? flowScenarios[0];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-95 max-md:hidden">
        <div className="home-fx-orb home-fx-orb--wide absolute -left-[28vw] top-[-10vh] h-[56vh] w-[56vh] rounded-full bg-[radial-gradient(circle,rgba(19,191,168,0.34)_0%,rgba(19,191,168,0)_72%)] [animation:driftOrbit_22s_ease-in-out_infinite] motion-reduce:[animation:none]" />
        <div className="home-fx-orb absolute -right-[20vw] top-[18vh] h-[52vh] w-[52vh] rounded-full bg-[radial-gradient(circle,rgba(86,223,201,0.34)_0%,rgba(86,223,201,0)_72%)] [animation:driftOrbit_18s_ease-in-out_infinite_reverse] motion-reduce:[animation:none]" />
        <div className="home-fx-orb home-fx-orb--wide absolute bottom-[-28vh] left-1/2 h-[64vh] w-[64vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(76,200,255,0.26)_0%,rgba(76,200,255,0)_75%)] [animation:floatY_15s_ease-in-out_infinite] motion-reduce:[animation:none]" />
      </div>

      <section className="relative flex min-h-[calc(100vh-84px)] items-center">
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-10 md:grid-cols-[1.05fr_0.95fr] md:gap-7 md:px-6 md:py-14">
          <div className="rounded-[30px] border border-white/70 bg-white/72 p-1.5 shadow-[0_30px_80px_rgba(73,101,163,0.17)] max-md:shadow-[0_12px_28px_rgba(73,101,163,0.12)] backdrop-blur-[3px] max-md:backdrop-blur-0 [animation:fadeRise_var(--motion-slow)_var(--motion-ease)_both] max-md:[animation:none]">
            <Card className="h-full border-border/60 bg-gradient-to-br from-card/96 via-card/92 to-background/86 shadow-none">
              <CardHeader className="space-y-5 md:space-y-6">
                <span className="inline-flex w-fit rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-medium tracking-wide text-secondary-foreground">ICU · I SEE YOU</span>
                <CardTitle className="text-4xl leading-[1.04] md:text-6xl">AI 时代，<br />不做旁观者</CardTitle>
                <div className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
                  先做一个 <MvpTerm className="text-base md:text-lg" />，给自己留住主动权，而不是等被替代。
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2.5">
                  <Link className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')} href="/login?next=/onboarding/profile">
                    项目方发布项目
                  </Link>
                  <Link className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full sm:w-auto')} href="/login?next=/onboarding/profile">
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
                <div className="rounded-xl border border-border/60 bg-white/88 p-2.5 md:hidden">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <BriefcaseBusiness className="size-3.5 text-primary" />
                      场景
                    </span>
                    <ArrowRight className="size-3.5 text-primary/70" />
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <Cpu className="size-3.5 text-primary" />
                      <MvpTerm className="text-xs" />
                    </span>
                    <ArrowRight className="size-3.5 text-primary/70" />
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <Code2 className="size-3.5 text-primary" />
                      迭代
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="relative overflow-hidden border-border/70 bg-white/88 max-md:hidden [animation:fadeRise_var(--motion-slow)_var(--motion-ease)_both] [animation-delay:0.12s]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(150deg,rgba(19,191,168,0.13)_0%,transparent_50%,rgba(76,200,255,0.18)_100%)]" />
            <div className="home-fx-orb absolute -left-24 top-12 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(91,210,255,0.26)_0%,rgba(91,210,255,0)_72%)] [animation:driftOrbit_20s_ease-in-out_infinite] motion-reduce:[animation:none]" />
            <CardHeader className="relative pb-2">
              <CardTitle className="text-xl">双方协作</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4 text-sm">
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-slate-50/95 p-4 shadow-[0_16px_38px_rgba(79,108,163,0.14)] md:p-5">
                <div className="home-fx-sweep absolute -left-20 top-1/2 h-32 w-56 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/40 via-cyan-300/25 to-transparent blur-2xl [animation:sweepX_6.5s_linear_infinite] motion-reduce:[animation:none]" />
                <div className="relative grid gap-3">
                  <div className="rounded-xl border border-border/60 bg-white/86 p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <BriefcaseBusiness className="size-4 text-primary" />
                      专家提供行业场景和需求
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="size-5 text-primary/80" />
                  </div>
                  <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/16 via-white/96 to-cyan-200/26 p-3 shadow-[0_12px_30px_rgba(55,152,255,0.18)]">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Cpu className="size-4 text-primary" />
                      联合做 <MvpTerm className="text-sm font-semibold" /> 验证
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="size-5 text-primary/80" />
                  </div>
                  <div className="rounded-xl border border-border/60 bg-white/86 p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Code2 className="size-4 text-primary" />
                      程序员技术实现并持续迭代
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="relative flex min-h-[92vh] items-center py-8 md:py-12" style={deferredSectionStyle}>
        <div className="pointer-events-none absolute inset-0 opacity-90">
          <div className="home-fx-orb home-fx-orb--wide absolute -right-24 top-12 h-[42vh] w-[42vh] rounded-full bg-[radial-gradient(circle,rgba(72,137,255,0.25)_0%,rgba(72,137,255,0)_72%)] [animation:driftOrbit_24s_ease-in-out_infinite_reverse] motion-reduce:[animation:none]" />
          <div className="home-fx-orb absolute left-[-14vw] bottom-[-16vh] h-[44vh] w-[44vh] rounded-full bg-[radial-gradient(circle,rgba(75,214,190,0.23)_0%,rgba(75,214,190,0)_72%)] [animation:floatY_13s_ease-in-out_infinite] motion-reduce:[animation:none]" />
        </div>
        <div className="relative mx-auto w-full max-w-6xl space-y-4 px-4 md:space-y-5 md:px-6">
          <div className="space-y-3 rounded-2xl border border-border/65 bg-white/90 p-5 shadow-[0_12px_30px_rgba(73,101,163,0.1)] md:p-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/65 bg-white/88 px-3 py-1 text-xs text-secondary-foreground">
              <BriefcaseBusiness className="size-3.5 text-primary" />
              CROSSROADS
            </span>
            <h2 className="text-2xl font-semibold leading-tight md:text-3xl">AI时代，大有可为</h2>
            <p className="text-sm text-muted-foreground md:text-base">是被AI替代，还是驾驭AI?</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
        </div>
      </section>

      <section className="relative flex min-h-[92vh] items-center py-8 md:py-12" style={deferredSectionStyle}>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(196,230,255,0.2)_40%,rgba(203,214,255,0.15)_100%)]" />
        <div className="home-fx-sweep home-fx-sweep--wide absolute -left-[18vw] top-[18vh] h-[34vh] w-[60vw] rotate-[-12deg] bg-[linear-gradient(90deg,transparent_0%,rgba(19,191,168,0.2)_48%,transparent_100%)] [animation:sweepX_8s_linear_infinite] motion-reduce:[animation:none]" />
        <div className="relative mx-auto w-full max-w-6xl space-y-4 px-4 md:space-y-5 md:px-6">
          <div className="space-y-3 rounded-2xl border border-border/65 bg-white/90 p-5 shadow-[0_12px_30px_rgba(73,101,163,0.1)] md:p-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/65 bg-white/88 px-3 py-1 text-xs text-secondary-foreground">
              <Rocket className="size-3.5 text-primary" />
              ENDURANCE
            </span>
            <h2 className="text-2xl font-semibold leading-tight md:text-3xl">OPC? Cofounder!</h2>
            <p className="text-sm text-muted-foreground md:text-base">万事开头难，合伙行更远。</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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
                    <div className="text-sm leading-7 text-muted-foreground">{renderTextWithMvp(card.description)}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
                PROTOCOL
              </span>
              <CardTitle className="text-2xl leading-tight md:text-3xl">先背调，再联系</CardTitle>
              <p className="text-sm text-muted-foreground md:text-base">先互相了解对方背景（教育、工作、项目经验、和项目详请等），再决定是否联系，减少无效沟通，增加匹配质量。</p>
              <div className="inline-flex w-full flex-wrap gap-2 rounded-xl border border-border/65 bg-background/80 p-1 md:w-fit md:flex-nowrap">
                {flowScenarios.map((scenario) => {
                  const isActive = scenario.key === activeFlowScenario;

                  return (
                    <button
                      className={cn(
                        'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors md:px-4',
                        isActive
                          ? 'bg-white text-foreground shadow-[0_6px_16px_rgba(73,101,163,0.14)]'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                      key={scenario.key}
                      onClick={() => setActiveFlowScenario(scenario.key)}
                      type="button"
                    >
                      {scenario.label}
                    </button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {currentFlowScenario.steps.map((step) => {
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(19,191,168,0.22),transparent_55%),radial-gradient(circle_at_90%_90%,rgba(76,200,255,0.26),transparent_48%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 md:px-6 [animation:fadeRise_var(--motion-slow)_var(--motion-ease)_both]">
          <Card className="border-border/70 bg-gradient-to-r from-white/90 via-card/95 to-white/92 shadow-[0_20px_54px_rgba(73,101,163,0.15)]">
            <CardHeader className="space-y-3">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/65 bg-white/86 px-3 py-1 text-xs text-secondary-foreground">
                <Rocket className="size-3.5 text-primary" />
                Now or Never
              </span>
              <CardTitle className="text-2xl leading-tight md:text-3xl">风起于青萍，止于瞬息</CardTitle>
              <p className="text-sm text-muted-foreground md:text-base">AI 让 coding 不再是门槛。千行百业的细分应用窗口，转眼即逝。你不下手，别人就收网了。</p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link className={buttonVariants({ size: 'lg' })} href="/login?next=/onboarding/profile">
                项目方发布项目
              </Link>
              <Link className={buttonVariants({ variant: 'outline', size: 'lg' })} href="/login?next=/onboarding/profile">
                程序员登记信息
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from 'next';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { buildPageMetadata, getBreadcrumbListJsonLd, getFAQPageJsonLd, getItemListJsonLd, stringifyJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '如何减少无效沟通',
  description: '解释项目方与程序员如何通过信息分层、授权流程与明确边界来减少无效沟通。',
  path: '/reduce-ineffective-communication',
  keywords: ['减少无效沟通', '项目方和程序员如何沟通', '双向授权沟通', '高质量协作'],
});

export default function ReduceIneffectiveCommunicationPage() {
  const jsonLd = [
    getBreadcrumbListJsonLd([
      { name: '首页', path: '/' },
      { name: '如何减少无效沟通', path: '/reduce-ineffective-communication' },
    ]),
    getFAQPageJsonLd([
      { question: '为什么项目方和程序员经常会无效沟通？', answer: '因为双方掌握的信息不同、关注点不同，而且常常在还没建立基本判断时就过早进入深度沟通。' },
      { question: '减少无效沟通最有效的方法是什么？', answer: '最有效的方法是分层公开信息、先建立基础判断、再逐步开放详细资料，并围绕 MVP 边界进行沟通。' },
      { question: '联系方式晚一些交换有什么好处？', answer: '可以避免在尚未判断匹配度时就进入高成本沟通，减少骚扰和时间浪费。' },
    ]),
    getItemListJsonLd({
      title: '减少无效沟通的方法',
      path: '/reduce-ineffective-communication',
      items: [
        { name: '先公开基础信息', url: '/reduce-ineffective-communication', description: '先做第一轮筛选。' },
        { name: '再逐步开放详细资料', url: '/reduce-ineffective-communication', description: '让信息交换更有节奏。' },
        { name: '围绕 MVP 边界沟通', url: '/reduce-ineffective-communication', description: '避免讨论无限扩张。' },
      ],
    }),
  ];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(item) }} />
      ))}
      <SeoLandingPage
        badge="Communication"
        title="如何减少项目方与程序员之间的无效沟通"
        lead={<>很多低质量沟通，并不是因为某一方态度有问题，而是因为双方在还没有建立最基本判断时，就被迫进入了高成本的深入交流。更好的方式，是让沟通随着判断质量逐步升级。</>}
        sections={[
          { title: '先做判断，再做深入沟通', content: <><p>如果一开始就要求双方长时间沟通、交换大量信息，很容易让双方都觉得成本过高。</p><p>先公开基础信息，让彼此建立第一层判断，会更高效。</p></> },
          { title: '信息分层能显著提高效率', content: <><p>基础信息用于筛选，详细资料用于判断，联系方式用于最终连接。每一层信息的作用都不同。</p><p>把它们混在一起，反而会导致判断混乱。</p></> },
          { title: '围绕 MVP 边界沟通更容易达成一致', content: <><p>双方最容易沟通失真时，通常是在还没明确第一版边界时就开始讨论完整系统。</p><p>先围绕 MVP 边界对齐，通常更容易达成共识。</p></> },
          { title: '双向授权为什么能减少无效沟通', content: <><p>因为双方都不需要在一开始暴露全部细节，而是随着判断质量提升，逐步进入更深层的交流。</p></> },
        ]}
        ctaLinks={[
          { href: '/how-it-works', label: '查看协作流程说明' },
          { href: '/developer-and-expert-collaboration', label: '查看专家与程序员协作说明' },
          { href: '/mvp-guide', label: '查看 MVP 指南' },
        ]}
      />
    </>
  );
}

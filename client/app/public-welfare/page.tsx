'use client';

import { FormEvent, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { extractErrorMessage, extractRiskReview, submitPublicWelfareMessage } from '@/lib/platform-api';

export default function PublicWelfarePage() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setResultMessage(null);

    try {
      await submitPublicWelfareMessage({
        name: name.trim() || undefined,
        contact,
        message,
      });
      setResultMessage('留言已收到，感谢你愿意一起共建。');
      setName('');
      setContact('');
      setMessage('');
    } catch (error) {
      const riskReview = extractRiskReview(error);

      if (riskReview) {
        const confirmed = window.confirm(
          `系统检测到潜在风险内容。\n风险等级：${riskReview.riskLevel}\n命中类别：${riskReview.categories.join('、') || '未知'}\n命中词：${riskReview.matchedTerms.join('、') || '未知'}\n\n是否仍继续发布？`,
        );

        if (confirmed) {
          try {
            await submitPublicWelfareMessage({
              name: name.trim() || undefined,
              contact,
              message,
              riskConfirmed: true,
            });
            setResultMessage('留言已按你的确认继续发布，管理员会优先审核风险内容。');
            setName('');
            setContact('');
            setMessage('');
            return;
          } catch (retryError) {
            setResultMessage(extractErrorMessage(retryError));
            return;
          }
        }

        setResultMessage('你已取消本次留言发布。');
        return;
      }

      setResultMessage(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-6xl space-y-5 overflow-hidden px-4 py-6 md:px-6 md:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_0%_0%,rgba(19,191,168,0.18),transparent_48%),radial-gradient(circle_at_100%_20%,rgba(76,200,255,0.16),transparent_50%)]" />
      <section className="relative space-y-3 rounded-2xl border border-border/70 bg-card/84 p-5 shadow-[0_18px_44px_rgba(73,101,163,0.14)] backdrop-blur-sm">
        <span className="inline-flex w-fit rounded-full bg-secondary/80 px-3 py-1 text-xs text-secondary-foreground">公益</span>
        <h1 className="text-3xl font-semibold leading-tight md:text-4xl">这是一个纯公益的协作社区</h1>
        <p>
          我们不做收费门槛，不做中间抽成。这是创业者的乌托邦。
        </p>
        <p>
          失业的程序员，中年危机的行业专家，在AI替代传统岗位的时代浪潮时，转换思路，危机中创造机遇。
        </p>
        <p>
          得益于 vibe coding，本站是由 Tanjieyu 和 Peter 业余时间共同搭建的。希望能够给需要的人带来一些阳光，利他即是利已。
        </p>
      </section>

      <Card className="border-border/70 bg-card/85 shadow-[0_14px_36px_rgba(73,101,163,0.14)]">
        <CardHeader>
          <CardTitle>我们在招募志愿者 / 共建者 / 赞助者</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>
            如果你愿意一起参与，就太欢迎了！现在只有两个程序员在业余打理，急需更多伙伴共建！<br/>如果你是律师、投资人、财务、运营、产品、设计、销售，或者对这个创业社群有热情，欢迎一起做公益。
          </p>
          <p>当前，我们最缺的是社区的运营者，快来！一起组织线下活动，维护社区群/氛围，在社媒上宣传本站。
            <br/>你可以直接留言，也可以写信到
            {' '}
            <a className="text-primary underline underline-offset-4" href="mailto:cofounder@cofounder.icu">cofounder@cofounder.icu</a>
            。
          </p>
          <p>
            如果你的项目因为这个社区得到帮助、并且真的跑起来了，也欢迎你在能力范围内赞助我们，让这个社区能被更长期地维护下去。
          </p>
        </CardContent>
      </Card>

      <Card className="w-full border-border/70 bg-card/88 shadow-[0_16px_40px_rgba(73,101,163,0.16)]">
        <CardHeader className="space-y-3">
          <span className="inline-flex w-fit rounded-full bg-secondary/80 px-3 py-1 text-xs text-secondary-foreground">留言</span>
          <CardTitle>给我们留个言</CardTitle>
          <p className="text-sm text-muted-foreground">留一个联系方式，再说说你能提供什么帮助，或者你现在最需要什么支持。</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            <label className="grid gap-1.5 text-sm text-foreground">
              你的称呼
              <Input maxLength={120} onChange={(event) => setName(event.target.value)} placeholder="例如：老王 / 杭州做供应链的刘老师" value={name} />
            </label>
            <label className="grid gap-1.5 text-sm text-foreground">
              联系方式
              <Input
                maxLength={200}
                onChange={(event) => setContact(event.target.value)}
                placeholder="例如：微信 / 邮箱 / 电话"
                required
                value={contact}
              />
            </label>
            <label className="grid gap-1.5 text-sm text-foreground">
              留言内容
              <Textarea
                maxLength={3000}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="例如：我能提供的帮助、对平台的建议……"
                required
                rows={8}
                value={message}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button className={buttonVariants()} disabled={submitting} type="submit">
                {submitting ? '提交中…' : '提交留言'}
              </button>
            </div>
          </form>

          {resultMessage ? <p className="text-sm text-muted-foreground">{resultMessage}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

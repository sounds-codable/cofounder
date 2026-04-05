'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { InfoDisclosure } from '@/components/info-disclosure';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { extractErrorMessage, saveDetailProfile } from '@/lib/platform-api';
import { useAuthState } from '@/lib/use-auth';

export function DetailProfileForm() {
  const router = useRouter();
  const { authenticated, loading, profile, refresh } = useAuthState();
  const [mounted, setMounted] = useState(false);
  const [intro, setIntro] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [projectDetail, setProjectDetail] = useState('');
  const [phone, setPhone] = useState('');
  const [wechat, setWechat] = useState('');
  const [qq, setQq] = useState('');
  const [email, setEmail] = useState('');
  const [other, setOther] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setIntro(profile.user.detailedProfile?.intro || '');
    setEducation(profile.user.detailedProfile?.education || '');
    setExperience(profile.user.detailedProfile?.experience || '');
    setProjectDetail(profile.user.detailedProfile?.projectDetail || '');
    setPhone(profile.contactMethods.find((item) => item.type === 'phone')?.value || '');
    setWechat(profile.contactMethods.find((item) => item.type === 'wechat')?.value || '');
    setQq(profile.contactMethods.find((item) => item.type === 'qq')?.value || '');
    setEmail(profile.contactMethods.find((item) => item.type === 'email')?.value || profile.user.email || '');
    setOther(profile.contactMethods.find((item) => item.type === 'other')?.value || '');
  }, [profile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await saveDetailProfile({ intro, education, experience, projectDetail, phone, wechat, qq, email, other });
      await refresh();
      setMessage('详细信息已保存，你现在可以发起了解详情请求。');
      router.push('/requests');
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && !authenticated) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-3">
            <p className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-wide text-secondary-foreground">需要登录</p>
            <CardTitle className="text-2xl">请先登录，再填写详细信息。</CardTitle>
            <p className="text-sm text-muted-foreground">详细信息会用于后续授权流程和联系方式交换。</p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login?next=/onboarding/detail')} type="button">
          去登录
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!mounted) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-3">
          <p className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-wide text-secondary-foreground">详细信息</p>
          <CardTitle className="text-2xl leading-tight">把更完整的背景补充好，后续需要时就可以直接复用。</CardTitle>
          <p className="text-sm text-muted-foreground">这部分不是默认公开内容，会在后续步骤里按需开放。</p>
          <div>
          <InfoDisclosure title="填写说明" compact>
            <p>详细信息只需要填写一次。</p>
            <p>联系方式可以先填着，但只有在后续交换联系方式时才会真正展示给对方。</p>
          </InfoDisclosure>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-foreground">
          个人简介
          <Textarea name="intro" onChange={(event) => setIntro(event.target.value)} rows={4} placeholder="介绍你自己、你的判断力、你的协作方式" value={intro} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
          教育背景
          <Textarea name="education" onChange={(event) => setEducation(event.target.value)} rows={3} placeholder="学校、专业" value={education} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
          工作背景
          <Textarea name="experience" onChange={(event) => setExperience(event.target.value)} rows={4} placeholder="做过哪些公司，负责过哪些事" value={experience} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
          项目详情 / 做过的产品介绍
          <Textarea name="projectDetail" onChange={(event) => setProjectDetail(event.target.value)} rows={5} placeholder="更详细介绍你的项目、产品或代表作品" value={projectDetail} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-foreground">
            电话
            <Input name="phone" onChange={(event) => setPhone(event.target.value)} placeholder="选填" type="text" value={phone} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
            微信
            <Input name="wechat" onChange={(event) => setWechat(event.target.value)} placeholder="选填" type="text" value={wechat} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
            QQ
            <Input name="qq" onChange={(event) => setQq(event.target.value)} placeholder="选填" type="text" value={qq} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
            邮箱
            <Input name="email" onChange={(event) => setEmail(event.target.value)} placeholder="选填" type="email" value={email} />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-foreground">
          其他联系方式
          <Input name="other" onChange={(event) => setOther(event.target.value)} placeholder="选填，例如 Telegram / 飞书" type="text" value={other} />
            </label>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <Button className="w-full sm:w-auto" disabled={submitting} type="submit">
          {submitting ? '保存中…' : '保存详细信息'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

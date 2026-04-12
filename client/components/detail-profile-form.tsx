'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { InfoDisclosure } from '@/components/info-disclosure';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { extractErrorMessage, extractRiskReview, saveDetailProfile } from '@/lib/platform-api';
import { useAuthState } from '@/lib/use-auth';

export function DetailProfileForm() {
  const router = useRouter();
  const { authenticated, loading, profile, refresh } = useAuthState();
  const [mounted, setMounted] = useState(false);
  const [intro, setIntro] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [projectDetail, setProjectDetail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentUserRole = profile?.card?.role;
  const projectFieldLabel = currentUserRole === 'developer' ? '做过的项目/产品' : '项目详情';
  const projectFieldPlaceholder = currentUserRole === 'developer' ? '更详细介绍你做过的项目、产品或代表作品' : '更详细介绍你的项目细节、成果或能力证明';

  useEffect(() => {
    if (!profile) {
      return;
    }

    setIntro(profile.user.detailedProfile?.intro || '');
    setEducation(profile.user.detailedProfile?.education || '');
    setExperience(profile.user.detailedProfile?.experience || '');
    setProjectDetail(
      profile.card?.role === 'developer'
        ? profile.user.detailedProfile?.developerProjectExperience || profile.user.detailedProfile?.projectDetail || ''
        : profile.user.detailedProfile?.expertProjectDetail || profile.user.detailedProfile?.projectDetail || '',
    );
  }, [profile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await saveDetailProfile(
        currentUserRole === 'developer'
          ? { intro, education, experience, developerProjectExperience: projectDetail }
          : { intro, education, experience, expertProjectDetail: projectDetail },
      );
      await refresh();
      setMessage('详细信息已保存，你现在可以发起了解详情请求。');
      router.push('/requests');
    } catch (error) {
      const riskReview = extractRiskReview(error);

      if (riskReview) {
        const confirmed = window.confirm(
          `系统检测到潜在风险内容。\n风险等级：${riskReview.riskLevel}\n命中类别：${riskReview.categories.join('、') || '未知'}\n命中词：${riskReview.matchedTerms.join('、') || '未知'}\n\n是否仍继续发布？`,
        );

        if (confirmed) {
          try {
            await saveDetailProfile(
              currentUserRole === 'developer'
                ? { intro, education, experience, developerProjectExperience: projectDetail, riskConfirmed: true }
                : { intro, education, experience, expertProjectDetail: projectDetail, riskConfirmed: true },
            );
            await refresh();
            setMessage('内容已按你的确认继续发布，建议留意后续管理员审核。');
            router.push('/requests');
            return;
          } catch (retryError) {
            setMessage(extractErrorMessage(retryError));
            return;
          }
        }

        setMessage('你已取消本次发布。');
        return;
      }

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
            <Button onClick={() => router.push('/login?next=/onboarding/profile')} type="button">
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
          <CardTitle className="text-2xl leading-tight">详细信息</CardTitle>
          <p className="text-sm text-muted-foreground">此处的信息不会公开显示，仅用于</p>
          <div>
          <InfoDisclosure title="填写说明" compact>
            <p>详细信息只需要填写一次。</p>
            <p>联系方式会在第 03 步“交换联系方式”时再填写并交换。</p>
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
          {projectFieldLabel}
          <Textarea name="projectDetail" onChange={(event) => setProjectDetail(event.target.value)} rows={5} placeholder={projectFieldPlaceholder} value={projectDetail} />
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

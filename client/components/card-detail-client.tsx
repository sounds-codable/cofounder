'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CardEngagementActions } from '@/components/card-engagement-actions';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  createDetailRequest,
  extractErrorMessage,
  fetchCardById,
  saveDetailProfile,
  type ContactMethod,
  type PlatformCardDetail,
} from '@/lib/platform-api';
import { fallbackPublicCards, roleLabels } from '@/lib/site-data';
import { useAuthState } from '@/lib/use-auth';

type CardDetailClientProps = {
  id: string;
};

type DetailField = 'intro' | 'education' | 'experience' | 'projectDetail';

const detailFieldMeta: Record<DetailField, { label: string; minLength: number }> = {
  intro: { label: '个人简介', minLength: 6 },
  education: { label: '教育背景', minLength: 4 },
  experience: { label: '工作背景', minLength: 6 },
  projectDetail: { label: '项目详情', minLength: 6 },
};

const viewerStatusLabels: Record<string, string> = {
  approved_detail_visible: '已开放详细信息',
  contact_exchanged: '已交换联系方式',
  pending_request: '待对方处理',
  publisher_viewed_detail: '对方处理中',
  rejected: '已拒绝',
};

function formatPublishedAt(updatedAt?: string) {
  if (!updatedAt) {
    return '发布时间未知';
  }

  const date = new Date(updatedAt);

  if (Number.isNaN(date.getTime())) {
    return '发布时间未知';
  }

  return `发布于 ${date.toLocaleDateString('zh-CN')}`;
}

function truncateText(value: string, maxLength = 60) {
  const text = value.trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}…`;
}

function getDetailFieldError(field: DetailField, value: string) {
  const trimmed = value.trim();
  const { label, minLength } = detailFieldMeta[field];

  if (!trimmed) {
    return `请填写${label}`;
  }

  if (trimmed.length < minLength) {
    return `${label}至少需要 ${minLength} 个字符`;
  }

  return '';
}

function validateDetailFields(values: Record<DetailField, string>) {
  return (Object.keys(values) as DetailField[]).reduce<Partial<Record<DetailField, string>>>((acc, field) => {
    const nextError = getDetailFieldError(field, values[field]);

    if (nextError) {
      acc[field] = nextError;
    }

    return acc;
  }, {});
}

function parseDetailFieldErrorsFromMessage(message: string) {
  const text = message.toLowerCase();
  const nextErrors: Partial<Record<DetailField, string>> = {};

  const matchers: Array<[DetailField, RegExp[]]> = [
    ['intro', [/intro/, /个人简介/]],
    ['education', [/education/, /教育背景/]],
    ['experience', [/experience/, /工作背景/]],
    ['projectDetail', [/projectdetail/, /project detail/, /项目详情/, /项目介绍/]],
  ];

  matchers.forEach(([field, patterns]) => {
    if (patterns.some((pattern) => pattern.test(text))) {
      nextErrors[field] = detailFieldMeta[field].label + `至少需要 ${detailFieldMeta[field].minLength} 个字符`;
    }
  });

  return nextErrors;
}

export function CardDetailClient({ id }: CardDetailClientProps) {
  const { authenticated, profile, refresh } = useAuthState();
  const fallbackCard = useMemo(() => fallbackPublicCards.find((item) => item.id === id) ?? null, [id]);
  const [card, setCard] = useState<PlatformCardDetail | null>(
    fallbackCard
      ? {
          ...fallbackCard,
          viewerState: null,
        }
      : null,
  );
  const [loading, setLoading] = useState(!fallbackCard);
  const [message, setMessage] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [showAllDetail, setShowAllDetail] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [savingDetail, setSavingDetail] = useState(false);
  const [intro, setIntro] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [projectDetail, setProjectDetail] = useState('');
  const [phone, setPhone] = useState('');
  const [wechat, setWechat] = useState('');
  const [qq, setQq] = useState('');
  const [email, setEmail] = useState('');
  const [other, setOther] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<DetailField, string>>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadCard() {
      setLoading(!fallbackCard);

      const nextCard = await fetchCardById(id);

      if (cancelled) {
        return;
      }

      setCard(nextCard);
      setLoading(false);
    }

    void loadCard();

    return () => {
      cancelled = true;
    };
  }, [fallbackCard, id]);

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

  async function createRequestAndRefreshCard() {
    await createDetailRequest(id);
    const nextCard = await fetchCardById(id);
    setCard(nextCard);
  }

  async function handleCreateRequest() {
    setSubmittingRequest(true);
    setModalMessage(null);
    setMessage(null);

    try {
      await createRequestAndRefreshCard();
      setRequestModalOpen(false);
      setMessage('已成功发起了解详情请求，接下来等待对方先查看并处理。');
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      setModalMessage(errorMessage);
      setMessage(errorMessage);
    } finally {
      setSubmittingRequest(false);
    }
  }

  async function handleSaveDetailAndCreateRequest() {
    const localErrors = validateDetailFields({
      intro,
      education,
      experience,
      projectDetail,
    });

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setModalMessage('请先修正标红字段后再提交。');
      return;
    }

    setSavingDetail(true);
    setSubmittingRequest(true);
    setFieldErrors({});
    setModalMessage(null);
    setMessage(null);

    try {
      await saveDetailProfile({ intro, education, experience, projectDetail, phone, wechat, qq, email, other });
      await refresh();
      await createRequestAndRefreshCard();
      setRequestModalOpen(false);
      setMessage('详细信息已提交并成功发起申请，接下来等待对方处理。');
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      const backendFieldErrors = parseDetailFieldErrorsFromMessage(errorMessage);

      if (Object.keys(backendFieldErrors).length > 0) {
        setFieldErrors((previous) => ({
          ...previous,
          ...backendFieldErrors,
        }));
        setModalMessage('请先修正标红字段后再提交。');
      } else {
        setModalMessage(errorMessage);
      }

      setMessage(errorMessage);
    } finally {
      setSavingDetail(false);
      setSubmittingRequest(false);
    }
  }

  function openRequestModal() {
    setShowAllDetail(false);
    setFieldErrors({});
    setModalMessage(null);
    setRequestModalOpen(true);
  }

  if (loading && !card) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle>正在加载资料…</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">请稍候。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle>未找到该卡片</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">这张公开卡片暂时不可查看。</p>
            <Link className={buttonVariants()} href="/projects">
            返回公开列表
          </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusLabel = card.viewerState ? viewerStatusLabels[card.viewerState.status] || card.viewerState.status : null;
  const backToListHref = card.role === 'expert' ? '/projects' : '/developers';
  const backToListLabel = card.role === 'expert' ? '返回项目列表' : '返回程序员列表';
  const targetRoleLabel = card.role === 'expert' ? '项目方' : '程序员';
  const hasDetailProfile = Boolean(profile?.completion.hasDetailProfile && profile.user.detailedProfile);
  const previewRows = [
    ['个人简介', profile?.user.detailedProfile?.intro || '未填写'],
    ['教育背景', profile?.user.detailedProfile?.education || '未填写'],
    ['工作背景', profile?.user.detailedProfile?.experience || '未填写'],
    ['项目详情', profile?.user.detailedProfile?.projectDetail || '未填写'],
  ] as const;
  const collapsedPreviewRows = previewRows.slice(0, 2);

  return (
    <div className="relative mx-auto w-full max-w-6xl space-y-6 overflow-hidden px-4 py-6 md:px-6 md:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_10%_0%,rgba(124,141,255,0.16),transparent_48%),radial-gradient(circle_at_90%_18%,rgba(87,217,197,0.14),transparent_46%)]" />
      {message ? <p className="rounded-lg border border-border/70 bg-background/76 px-3 py-2 text-sm text-muted-foreground backdrop-blur-sm">{message}</p> : null}

      <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 backdrop-blur-sm">
        <Link className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'px-0')} href={backToListHref}>
          ← {backToListLabel}
        </Link>
      </div>

      <section className="relative space-y-4 rounded-2xl border border-border/70 bg-card/84 p-6 shadow-[0_16px_38px_rgba(79,108,163,0.14)] backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{roleLabels[card.role]}</span>
          <span className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">{card.city}</span>
        </div>
        <h1 className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">{card.headline}</h1>
        <p className="text-xs text-muted-foreground">{formatPublishedAt(card.updatedAt)}</p>
        <p className="text-xs text-muted-foreground">编号：{card.id}</p>
        <p className="text-sm leading-7 text-muted-foreground">{card.basicSummary}</p>
        <div className="flex flex-wrap gap-2">
          {card.strengths.map((strength) => (
            <span className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground" key={strength}>
              {strength}
            </span>
          ))}
        </div>
        <div className="rounded-xl border border-border/60 bg-background/74 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <CardEngagementActions cardId={id} />
            </div>
            {!authenticated ? (
              <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'ml-auto')} href={`/login?next=/cards/${id}`}>
                询问更多信息
              </Link>
            ) : card.viewerState ? (
              <span className="ml-auto inline-flex rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">当前状态：{statusLabel}</span>
            ) : (
              <button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'ml-auto')} disabled={submittingRequest || savingDetail} type="button" onClick={openRequestModal}>
                {submittingRequest ? '发送中…' : '询问更多信息'}
              </button>
            )}
          </div>
        </div>
      </section>

      {requestModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="询问更多信息">
          <button className="absolute inset-0 bg-foreground/30" onClick={() => setRequestModalOpen(false)} type="button" aria-label="关闭弹框" />
          <section className="relative z-10 w-full max-w-2xl space-y-4 rounded-2xl border border-border/70 bg-card/96 p-5 shadow-[0_18px_42px_rgba(79,108,163,0.24)] backdrop-blur-md">
            <h2 className="text-xl font-semibold text-foreground">询问更多信息</h2>
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
              <p className="rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                提示：向对方询问更多信息，需要先提供详细信息给对方。<br />
                对方看过你的详细信息后，会决定是否提供更多信息。
              </p>
              <details className="request-modal-help">
                <summary aria-label="为什么要先提供详细信息" title="为什么要先提供详细信息">
                  ?
                </summary>
                <div className="request-modal-help-popover">
                  <p>
                    说实话，{targetRoleLabel}的详细信息里，常常会有业务细节、项目进度，或者一些不太方便公开的内容。你先把自己的背景和合作方式讲清楚，对方才能判断你们是不是一路人。
                  </p>
                  <p>先给诚意，再谈深入，彼此都更安心，合作也更容易走下去。</p>
                </div>
              </details>
            </div>

            {hasDetailProfile ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">以下信息将会被提交给对方：</p>
                <div className="grid gap-2">
                  {(showAllDetail ? previewRows : collapsedPreviewRows).map(([label, value]) => (
                    <div className="rounded-lg border border-border/60 bg-background/70 p-3" key={label}>
                      <strong className="text-sm text-foreground">{label}</strong>
                      <p className="mt-1 text-sm text-muted-foreground">{showAllDetail ? value : truncateText(value)}</p>
                    </div>
                  ))}
                </div>
                {!showAllDetail ? (
                  <button className={buttonVariants({ variant: 'outline' })} type="button" onClick={() => setShowAllDetail(true)}>
                    展开查看全部信息
                  </button>
                ) : null}
                {modalMessage ? <p className="text-sm text-destructive">{modalMessage}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <button className={buttonVariants()} disabled={submittingRequest} type="button" onClick={() => void handleCreateRequest()}>
                    {submittingRequest ? '发送中…' : '确认发送'}
                  </button>
                  <button className={buttonVariants({ variant: 'outline' })} disabled={submittingRequest} type="button" onClick={() => setRequestModalOpen(false)}>
                    取消申请
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">还没有录入详细信息，请先录入详细信息。</p>
                <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
                  <label className="grid gap-1 text-sm text-foreground">
                    个人简介
                    <Textarea
                      className={cn(fieldErrors.intro ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                      name="intro"
                      onChange={(event) => {
                        setIntro(event.target.value);
                        setFieldErrors((previous) => ({ ...previous, intro: getDetailFieldError('intro', event.target.value) }));
                      }}
                      rows={3}
                      placeholder="介绍你的背景和协作方式"
                      value={intro}
                    />
                    {fieldErrors.intro ? <span className="text-xs text-destructive">{fieldErrors.intro}</span> : null}
                  </label>
                  <label className="grid gap-1 text-sm text-foreground">
                    教育背景
                    <Textarea
                      className={cn(fieldErrors.education ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                      name="education"
                      onChange={(event) => {
                        setEducation(event.target.value);
                        setFieldErrors((previous) => ({ ...previous, education: getDetailFieldError('education', event.target.value) }));
                      }}
                      rows={2}
                      placeholder="学校、专业"
                      value={education}
                    />
                    {fieldErrors.education ? <span className="text-xs text-destructive">{fieldErrors.education}</span> : null}
                  </label>
                  <label className="grid gap-1 text-sm text-foreground">
                    工作背景
                    <Textarea
                      className={cn(fieldErrors.experience ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                      name="experience"
                      onChange={(event) => {
                        setExperience(event.target.value);
                        setFieldErrors((previous) => ({ ...previous, experience: getDetailFieldError('experience', event.target.value) }));
                      }}
                      rows={3}
                      placeholder="做过哪些业务和职责"
                      value={experience}
                    />
                    {fieldErrors.experience ? <span className="text-xs text-destructive">{fieldErrors.experience}</span> : null}
                  </label>
                  <label className="grid gap-1 text-sm text-foreground">
                    项目详情 / 做过的产品介绍
                    <Textarea
                      className={cn(fieldErrors.projectDetail ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                      name="projectDetail"
                      onChange={(event) => {
                        setProjectDetail(event.target.value);
                        setFieldErrors((previous) => ({ ...previous, projectDetail: getDetailFieldError('projectDetail', event.target.value) }));
                      }}
                      rows={4}
                      placeholder="补充项目细节、成果或能力证明"
                      value={projectDetail}
                    />
                    {fieldErrors.projectDetail ? <span className="text-xs text-destructive">{fieldErrors.projectDetail}</span> : null}
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-sm text-foreground">
                      电话
                      <Input name="phone" onChange={(event) => setPhone(event.target.value)} placeholder="选填" type="text" value={phone} />
                    </label>
                    <label className="grid gap-1 text-sm text-foreground">
                      微信
                      <Input name="wechat" onChange={(event) => setWechat(event.target.value)} placeholder="选填" type="text" value={wechat} />
                    </label>
                    <label className="grid gap-1 text-sm text-foreground">
                      QQ
                      <Input name="qq" onChange={(event) => setQq(event.target.value)} placeholder="选填" type="text" value={qq} />
                    </label>
                    <label className="grid gap-1 text-sm text-foreground">
                      邮箱
                      <Input name="email" onChange={(event) => setEmail(event.target.value)} placeholder="选填" type="email" value={email} />
                    </label>
                  </div>
                  <label className="grid gap-1 text-sm text-foreground">
                    其他联系方式
                    <Input name="other" onChange={(event) => setOther(event.target.value)} placeholder="选填，例如 Telegram / 飞书" type="text" value={other} />
                  </label>
                </form>
                {modalMessage ? <p className="text-sm text-destructive">{modalMessage}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <button className={buttonVariants()} disabled={savingDetail || submittingRequest} type="button" onClick={() => void handleSaveDetailAndCreateRequest()}>
                    {savingDetail || submittingRequest ? '提交中…' : '保存并确认发送'}
                  </button>
                  <button className={buttonVariants({ variant: 'outline' })} disabled={savingDetail || submittingRequest} type="button" onClick={() => setRequestModalOpen(false)}>
                    取消申请
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {card.viewerState?.contactVisible && card.viewerState.contactMethods.length > 0 ? (
        <section className="space-y-3 rounded-2xl border border-border/70 bg-card/84 p-5 shadow-[0_14px_34px_rgba(79,108,163,0.12)]">
          <h2 className="text-xl font-semibold text-foreground">已可见联系方式</h2>
          <div className="grid gap-2">
            {card.viewerState.contactMethods.map((contact: ContactMethod) => (
              <div className="rounded-lg border border-border/60 bg-background/74 px-3 py-2" key={contact.id}>
                <strong className="text-sm text-foreground">{contact.type}</strong>
                <p className="text-sm text-muted-foreground">{contact.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

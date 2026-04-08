'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { extractErrorMessage, fetchTagSuggestions, saveBasicProfile, type TagSuggestion } from '@/lib/platform-api';
import type { UserRole } from '@/lib/site-data';
import { useAuthState } from '@/lib/use-auth';

type CardPublishFormProps = {
  role: UserRole;
  loginNext: string;
  successRedirect: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  presentation?: 'page' | 'modal';
};

type ActiveTagToken = {
  start: number;
  end: number;
  query: string;
};

const MAX_TAG_COUNT = 5;

const roleCopy: Record<UserRole, { badge: string; title: string; description: string; submitText: string; headlineLabel: string; summaryLabel: string; summaryPlaceholder: string }> = {
  expert: {
    badge: '发布项目',
    title: '填写项目信息',
    description: '以下填写的信息将公开展示哦，建议先大致介绍项目方向，太多细节就等匹配上了合适的小伙伴再聊。',
    submitText: '发布项目',
    headlineLabel: '项目名称',
    summaryLabel: '项目描述',
    summaryPlaceholder: '用最少的话说明最重要的价值。输入 # 可以添加标签，例如 #MVP #医疗SaaS',
  },
  developer: {
    badge: '发布程序员卡片',
    title: '填写程序员卡片信息',
    description: '仅填写会显示在程序员卡片里的公开信息，不需要先填基础信息页。',
    submitText: '发布程序员卡片',
    headlineLabel: '标题',
    summaryLabel: '能力描述',
    summaryPlaceholder: '用最少的话说明最重要的价值。输入 # 可以添加标签，例如 #Next.js #AI工具',
  },
};

function normalizeTag(value: string) {
  return value.replace(/^#+/, '').trim();
}

function uniqueTags(tags: string[]) {
  const unique: string[] = [];
  const seen = new Set<string>();

  tags.forEach((item) => {
    const normalized = normalizeTag(item);
    const lowered = normalized.toLowerCase();

    if (!normalized || seen.has(lowered)) {
      return;
    }

    seen.add(lowered);
    unique.push(normalized);
  });

  return unique;
}

function extractTagsFromText(text: string) {
  const matches = text.match(/#[\p{L}\p{N}_-]+/gu) || [];
  return uniqueTags(matches);
}

function findActiveTagToken(content: string, caret: number): ActiveTagToken | null {
  if (caret < 0 || caret > content.length) {
    return null;
  }

  const prefix = content.slice(0, caret);
  const matched = prefix.match(/(?:^|\s)#([\p{L}\p{N}_-]*)$/u);

  if (!matched) {
    return null;
  }

  const query = matched[1] ?? '';
  const start = caret - query.length - 1;

  return {
    start,
    end: caret,
    query,
  };
}

export function CardPublishForm({ role, loginNext, successRedirect, onCancel, onSuccess, presentation = 'page' }: CardPublishFormProps) {
  const router = useRouter();
  const { authenticated, loading, profile, refresh } = useAuthState();
  const summaryTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [headline, setHeadline] = useState('');
  const [basicSummary, setBasicSummary] = useState('');
  const [city, setCity] = useState('');
  const [activeTagToken, setActiveTagToken] = useState<ActiveTagToken | null>(null);
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [tagPanelOpen, setTagPanelOpen] = useState(false);
  const [loadingTagSuggestions, setLoadingTagSuggestions] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'headline' | 'summary' | 'city', string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const selectedTags = useMemo(() => extractTagsFromText(basicSummary), [basicSummary]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setHeadline(profile.card?.headline || '');
    const summaryFromProfile = profile.card?.basicSummary || '';
    const profileTags = profile.card?.strengths || [];
    const summaryTags = extractTagsFromText(summaryFromProfile);
    const missingTags = uniqueTags(profileTags).filter((tag) => !summaryTags.some((summaryTag) => summaryTag.toLowerCase() === tag.toLowerCase()));
    const appendableTags = missingTags.slice(0, Math.max(0, MAX_TAG_COUNT - summaryTags.length));
    const tagsSuffix = appendableTags.length > 0 ? `\n\n${appendableTags.map((tag) => `#${tag}`).join(' ')}` : '';
    setBasicSummary(`${summaryFromProfile}${tagsSuffix}`.trim());
    setCity(profile.card?.city || '');
  }, [profile, role]);

  useEffect(() => {
    if (!activeTagToken) {
      setTagSuggestions([]);
      setLoadingTagSuggestions(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoadingTagSuggestions(true);
      const suggestions = await fetchTagSuggestions(activeTagToken.query, 8);

      if (!cancelled) {
        setTagSuggestions(suggestions);
        setLoadingTagSuggestions(false);
      }
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeTagToken]);

  function syncActiveTagToken(content: string, caret: number) {
    const token = findActiveTagToken(content, caret);
    setActiveTagToken(token);
    setTagPanelOpen(Boolean(token));
  }

  function handleSummaryCaretChanged() {
    const textarea = summaryTextareaRef.current;

    if (!textarea) {
      return;
    }

    syncActiveTagToken(textarea.value, textarea.selectionStart ?? textarea.value.length);
  }

  function applySelectedTag(tagName: string) {
    const textarea = summaryTextareaRef.current;

    if (!textarea || !activeTagToken) {
      return;
    }

    const normalizedTag = normalizeTag(tagName);

    if (!normalizedTag) {
      return;
    }

    const hasTagAlready = selectedTags.some((item) => item.toLowerCase() === normalizedTag.toLowerCase());

    if (!hasTagAlready && selectedTags.length >= MAX_TAG_COUNT) {
      setMessage(`最多选择 ${MAX_TAG_COUNT} 个 #标签。`);
      setTagPanelOpen(false);
      setActiveTagToken(null);
      return;
    }

    const before = basicSummary.slice(0, activeTagToken.start);
    const after = basicSummary.slice(activeTagToken.end);
    const needSpaceAfter = after.length > 0 && !/^\s/.test(after);
    const nextSummary = `${before}#${normalizedTag}${needSpaceAfter ? ' ' : ''}${after}`;
    const nextCursorPosition = before.length + normalizedTag.length + 1 + (needSpaceAfter ? 1 : 0);

    setBasicSummary(nextSummary);
    setMessage(null);
    setTagPanelOpen(false);
    setActiveTagToken(null);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  }

  function removeSelectedTag(tagName: string) {
    const normalized = normalizeTag(tagName);

    if (!normalized) {
      return;
    }

    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tagPattern = new RegExp(`(^|[^\\p{L}\\p{N}_-])#${escaped}(?![\\p{L}\\p{N}_-])`, 'gu');
    const nextSummary = basicSummary
      .replace(tagPattern, '$1')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    setBasicSummary(nextSummary);
    setMessage(null);
    setTagPanelOpen(false);
    setActiveTagToken(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedHeadline = headline.trim();
    const normalizedBasicSummary = basicSummary.trim();
    const normalizedCity = city.trim();
    const normalizedStrengths = uniqueTags(selectedTags).slice(0, MAX_TAG_COUNT);

    if (!normalizedHeadline || !normalizedBasicSummary || !normalizedCity) {
      setFieldErrors({
        headline: normalizedHeadline ? '' : `${copy.headlineLabel}不能为空`,
        summary: normalizedBasicSummary ? '' : `${copy.summaryLabel}不能为空`,
        city: normalizedCity ? '' : '城市不能为空',
      });
      setMessage('请先填写标题、描述和城市后再发布。');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setFieldErrors({});

    try {
      if (!profile) {
        await refresh();
      }

      await saveBasicProfile({
        role,
        headline: normalizedHeadline,
        basicSummary: normalizedBasicSummary,
        city: normalizedCity,
        strengths: normalizedStrengths,
      });

      await refresh();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(successRedirect);
      }
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && !authenticated) {
    return (
      <section className={cn('mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8', presentation === 'modal' ? 'px-0 py-0 md:px-0 md:py-0' : undefined)}>
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-3">
            <p className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-wide text-secondary-foreground">需要登录</p>
            <CardTitle className="text-2xl">请先登录，再发布卡片。</CardTitle>
            <p className="text-sm text-muted-foreground">发布卡片会绑定你的登录账号。</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => router.push(`/login?next=${encodeURIComponent(loginNext)}`)} type="button">
                去登录
              </Button>
              {onCancel ? (
                <Button onClick={onCancel} type="button" variant="outline">
                  关闭
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const copy = roleCopy[role];

  return (
    <section className={cn('mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8', presentation === 'modal' ? 'px-0 py-0 md:px-0 md:py-0' : undefined)}>
      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-wide text-secondary-foreground">{copy.badge}</p>
            {onCancel ? (
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-lg leading-none text-muted-foreground hover:bg-accent" type="button" onClick={onCancel} aria-label="关闭表单">
                ×
              </button>
            ) : null}
          </div>
          <CardTitle className="text-2xl leading-tight">{copy.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{copy.description}</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              {copy.headlineLabel}
              <Textarea
                className={cn('min-h-0 h-14', fieldErrors.headline ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                name="headline"
                onChange={(event) => {
                  setHeadline(event.target.value);
                  if (fieldErrors.headline) {
                    setFieldErrors((previous) => ({ ...previous, headline: '' }));
                  }
                }}
                placeholder="一句话介绍项目"
                rows={2}
                value={headline}
              />
              {fieldErrors.headline ? <p className="text-xs text-destructive">{fieldErrors.headline}</p> : null}
            </label>
            <label className="relative grid gap-2 text-sm font-medium text-foreground">
              {copy.summaryLabel}
              <Textarea
                className={cn('min-h-0 h-40', fieldErrors.summary ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                ref={summaryTextareaRef}
                name="summary"
                onBlur={() => {
                  window.setTimeout(() => setTagPanelOpen(false), 120);
                }}
                onChange={(event) => {
                  const value = event.target.value;
                  const tags = extractTagsFromText(value);

                  if (tags.length > MAX_TAG_COUNT) {
                    setMessage(`最多选择 ${MAX_TAG_COUNT} 个 #标签。`);
                    return;
                  }

                  setMessage(null);
                  setBasicSummary(value);
                  if (fieldErrors.summary) {
                    setFieldErrors((previous) => ({ ...previous, summary: '' }));
                  }
                  syncActiveTagToken(value, event.target.selectionStart ?? value.length);
                }}
                onClick={handleSummaryCaretChanged}
                onFocus={handleSummaryCaretChanged}
                onKeyUp={handleSummaryCaretChanged}
                placeholder={copy.summaryPlaceholder}
                rows={12}
                value={basicSummary}
              />
              {fieldErrors.summary ? <p className="text-xs text-destructive">{fieldErrors.summary}</p> : null}
              <p className="text-xs font-normal text-muted-foreground">提示：输入 `#` 即可搜索已有标签，也可以直接新增。</p>
              {selectedTags.length > 0 ? (
                <div className="grid gap-2">
                  <p className="text-xs font-medium text-muted-foreground">已选标签</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground" key={tag}>
                        <span>#{tag}</span>
                        <button
                          aria-label={`删除标签 ${tag}`}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[12px] leading-none text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          type="button"
                          onClick={() => removeSelectedTag(tag)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {tagPanelOpen && activeTagToken ? (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-xl border border-border bg-card p-2 shadow-[0_12px_30px_rgba(79,108,163,0.2)]">
                  <p className="px-2 pb-2 text-xs text-muted-foreground">标签建议</p>
                  <div className="grid max-h-52 gap-1 overflow-auto">
                    {loadingTagSuggestions ? <p className="px-2 py-1 text-sm text-muted-foreground">搜索中…</p> : null}
                    {!loadingTagSuggestions && tagSuggestions.length === 0 && !activeTagToken.query ? <p className="px-2 py-1 text-sm text-muted-foreground">输入关键字开始搜索标签</p> : null}
                    {tagSuggestions.map((item) => (
                      <button
                        className="flex items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-foreground hover:bg-accent"
                        key={item.name}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          applySelectedTag(item.name);
                        }}
                      >
                        <span>#{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.usageCount}</span>
                      </button>
                    ))}
                    {!loadingTagSuggestions && activeTagToken.query && !tagSuggestions.some((item) => item.name.toLowerCase() === activeTagToken.query.toLowerCase()) ? (
                      <button
                        className="rounded-lg px-2 py-2 text-left text-sm text-foreground hover:bg-accent"
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          applySelectedTag(activeTagToken.query);
                        }}
                      >
                        添加新标签 #{activeTagToken.query}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              城市
              <Textarea
                className={cn('min-h-0 h-11', fieldErrors.city ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                name="city"
                onChange={(event) => {
                  setCity(event.target.value);
                  if (fieldErrors.city) {
                    setFieldErrors((previous) => ({ ...previous, city: '' }));
                  }
                }}
                placeholder="例如：杭州"
                rows={1}
                value={city}
              />
              {fieldErrors.city ? <p className="text-xs text-destructive">{fieldErrors.city}</p> : null}
            </label>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button className="w-full sm:w-auto" disabled={submitting} type="submit">
                {submitting ? '发布中…' : copy.submitText}
              </Button>
              {onCancel ? (
                <Button className="w-full sm:w-auto" disabled={submitting} onClick={onCancel} type="button" variant="outline">
                  取消
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

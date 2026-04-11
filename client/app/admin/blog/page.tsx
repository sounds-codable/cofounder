'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { AdminPageShell, formatAdminDate } from '@/components/admin/admin-page-shell';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createAdminBlogPost,
  deleteAdminBlogPost,
  extractErrorMessage,
  fetchAdminBlogComments,
  fetchAdminBlogPosts,
  reviewAdminBlogComment,
  updateAdminBlogPost,
  type AdminBlogComments,
  type AdminBlogPosts,
} from '@/lib/platform-api';
import { cn } from '@/lib/utils';

type EditState = {
  id: string | null;
  title: string;
  summary: string;
  contentMarkdown: string;
  published: boolean;
};

type FormErrors = {
  title?: string;
  summary?: string;
  contentMarkdown?: string;
};

type CommentStatusFilter = 'pending' | 'approved' | 'rejected' | '';

const initialEditState: EditState = {
  id: null,
  title: '',
  summary: '',
  contentMarkdown: '',
  published: true,
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<AdminBlogPosts | null>(null);
  const [comments, setComments] = useState<AdminBlogComments | null>(null);
  const [commentStatusFilter, setCommentStatusFilter] = useState<CommentStatusFilter>('pending');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editState, setEditState] = useState<EditState>(initialEditState);

  const title = useMemo(() => (editState.id ? '编辑博客' : '发布博客'), [editState.id]);

  const loadAll = useCallback(async (nextCommentStatus: CommentStatusFilter) => {
    setLoading(true);

    try {
      const [postsResult, commentsResult] = await Promise.all([
        fetchAdminBlogPosts(),
        fetchAdminBlogComments((nextCommentStatus || undefined) as 'pending' | 'approved' | 'rejected' | undefined),
      ]);
      setPosts(postsResult);
      setComments(commentsResult);
      setMessage(null);
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll('pending');
  }, [loadAll]);

  async function handleSavePost() {
    const payload = {
      title: editState.title.trim(),
      summary: editState.summary.trim(),
      contentMarkdown: editState.contentMarkdown.trim(),
      published: editState.published,
    };

    const nextErrors: FormErrors = {};

    if (!payload.title) {
      nextErrors.title = '标题不能为空。';
    } else if (payload.title.length < 2) {
      nextErrors.title = '标题至少 2 个字符。';
    }

    if (!payload.summary) {
      nextErrors.summary = '摘要不能为空。';
    } else if (payload.summary.length < 2) {
      nextErrors.summary = '摘要至少 2 个字符。';
    }

    if (!payload.contentMarkdown) {
      nextErrors.contentMarkdown = '正文不能为空。';
    } else if (payload.contentMarkdown.length < 10) {
      nextErrors.contentMarkdown = '正文至少 10 个字符。';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      setFormMessage('请先修正表单中的错误后再保存。');
      return;
    }

    setFormErrors({});
    setFormMessage(null);

    setSaving(true);

    try {
      if (editState.id) {
        await updateAdminBlogPost(editState.id, payload);
      } else {
        await createAdminBlogPost(payload);
      }

      setEditState(initialEditState);
      await loadAll(commentStatusFilter);
      setMessage('博客已保存。');
      setFormMessage('博客已保存。');
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      setMessage(errorMessage);
      setFormMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!window.confirm('确认删除这篇博客吗？')) {
      return;
    }

    try {
      await deleteAdminBlogPost(postId);
      if (editState.id === postId) {
        setEditState(initialEditState);
      }
      await loadAll(commentStatusFilter);
      setMessage('博客已删除。');
    } catch (error) {
      setMessage(extractErrorMessage(error));
    }
  }

  async function handleReviewComment(commentId: string, status: 'approved' | 'rejected') {
    try {
      await reviewAdminBlogComment(commentId, { status });
      await loadAll(commentStatusFilter);
      setMessage(`评论已${status === 'approved' ? '通过' : '拒绝'}。`);
    } catch (error) {
      setMessage(extractErrorMessage(error));
    }
  }

  return (
    <AdminPageShell title="博客管理" description="管理员发布项目进展/通知；普通用户只能阅读、点赞、评论，且评论需审核后公开。">
      <Card className="border-border/70 bg-card/88">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            className={cn(
              'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
              formErrors.title ? 'border-destructive focus-visible:ring-destructive/30' : 'border-input',
            )}
            maxLength={220}
            onChange={(event) => {
              const value = event.target.value;
              setEditState((current) => ({ ...current, title: value }));

              if (formErrors.title) {
                setFormErrors((current) => ({ ...current, title: undefined }));
              }
            }}
            placeholder="博客标题"
            value={editState.title}
          />
          {formErrors.title ? <p className="text-xs text-destructive">{formErrors.title}</p> : null}
          <input
            className={cn(
              'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
              formErrors.summary ? 'border-destructive focus-visible:ring-destructive/30' : 'border-input',
            )}
            maxLength={400}
            onChange={(event) => {
              const value = event.target.value;
              setEditState((current) => ({ ...current, summary: value }));

              if (formErrors.summary) {
                setFormErrors((current) => ({ ...current, summary: undefined }));
              }
            }}
            placeholder="博客摘要"
            value={editState.summary}
          />
          {formErrors.summary ? <p className="text-xs text-destructive">{formErrors.summary}</p> : null}
          <div className="space-y-2" data-color-mode="light">
            <p className="text-xs text-muted-foreground">Markdown 在线编辑器（所见即所得预览）</p>
            <MDEditor
              height={360}
              onChange={(value: string | undefined) => {
                setEditState((current) => ({ ...current, contentMarkdown: value || '' }));

                if (formErrors.contentMarkdown) {
                  setFormErrors((current) => ({ ...current, contentMarkdown: undefined }));
                }
              }}
              preview="edit"
              value={editState.contentMarkdown}
            />
          </div>
          {formErrors.contentMarkdown ? <p className="text-xs text-destructive">{formErrors.contentMarkdown}</p> : null}
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              checked={editState.published}
              onChange={(event) => setEditState((current) => ({ ...current, published: event.target.checked }))}
              type="checkbox"
            />
            发布后对外可见
          </label>
          <div className="flex flex-wrap gap-2">
            <button className={buttonVariants()} disabled={saving} onClick={() => void handleSavePost()} type="button">
              {saving ? '保存中…' : '保存博客'}
            </button>
            {editState.id ? (
              <button
                className={buttonVariants({ variant: 'outline' })}
                onClick={() => setEditState(initialEditState)}
                type="button"
              >
                取消编辑
              </button>
            ) : null}
          </div>
          {formMessage ? <p className="text-sm text-muted-foreground">{formMessage}</p> : null}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/88">
        <CardHeader>
          <CardTitle>博客列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? <p className="text-sm text-muted-foreground">加载中…</p> : null}
          {!loading && !posts?.items.length ? <p className="text-sm text-muted-foreground">暂无博客。</p> : null}
          {posts?.items.map((post) => (
            <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2" key={post.id}>
              <p className="text-sm font-semibold">{post.title}</p>
              <p className="text-xs text-muted-foreground">
                更新时间：{formatAdminDate(post.updatedAt)} · 状态：{post.published ? '已发布' : '未发布'}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{post.summary}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8')}
                  onClick={() =>
                    setEditState({
                      id: post.id,
                      title: post.title,
                      summary: post.summary,
                      contentMarkdown: post.contentMarkdown,
                      published: post.published,
                    })
                  }
                  type="button"
                >
                  编辑
                </button>
                <button
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 border-destructive/40 text-destructive hover:bg-destructive/10')}
                  onClick={() => void handleDeletePost(post.id)}
                  type="button"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/88">
        <CardHeader>
          <CardTitle>评论审核</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { label: '待审核', value: 'pending' },
              { label: '已通过', value: 'approved' },
              { label: '已拒绝', value: 'rejected' },
              { label: '全部', value: '' },
            ].map((item) => (
              <button
                className={buttonVariants({ variant: commentStatusFilter === item.value ? 'default' : 'outline', size: 'sm' })}
                key={item.label}
                onClick={() => {
                  const next = item.value as CommentStatusFilter;
                  setCommentStatusFilter(next);
                  void loadAll(next);
                }}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
          {!comments?.items.length ? <p className="text-sm text-muted-foreground">暂无评论。</p> : null}
          {comments?.items.map((comment) => (
            <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2" key={comment.id}>
              <p className="text-sm font-semibold">{comment.postTitle}</p>
              <p className="text-xs text-muted-foreground">
                {comment.authorDisplayName} · {formatAdminDate(comment.createdAt)} · 状态：{comment.status}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm">{comment.content}</p>
              {comment.riskLevel && comment.riskLevel !== 'none' ? (
                <p className="mt-1 text-xs text-destructive">
                  风险：{comment.riskLevel} · 分类：{comment.riskCategories.join('、') || '未知'} · 命中词：
                  {comment.riskMatchedTerms.join('、') || '未知'}
                </p>
              ) : null}
              {comment.status === 'pending' ? (
                <div className="mt-2 flex gap-2">
                  <button
                    className={cn(buttonVariants({ size: 'sm' }), 'h-8')}
                    onClick={() => void handleReviewComment(comment.id, 'approved')}
                    type="button"
                  >
                    通过
                  </button>
                  <button
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8')}
                    onClick={() => void handleReviewComment(comment.id, 'rejected')}
                    type="button"
                  >
                    拒绝
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </AdminPageShell>
  );
}

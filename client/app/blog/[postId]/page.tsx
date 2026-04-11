'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createBlogComment,
  deleteBlogComment,
  extractErrorMessage,
  fetchBlogPostById,
  isUnauthorizedError,
  toggleBlogLike,
  type BlogPostDetail,
} from '@/lib/platform-api';
import { useAuthState } from '@/lib/use-auth';
import { cn } from '@/lib/utils';

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN');
}

export default function BlogDetailPage() {
  const params = useParams<{ postId: string }>();
  const postIdentifier = useMemo(() => (typeof params?.postId === 'string' ? params.postId : ''), [params]);
  const { authenticated, loading } = useAuthState();
  const [detail, setDetail] = useState<BlogPostDetail | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [replyDraftByCommentId, setReplyDraftByCommentId] = useState<Record<string, string>>({});
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [submittingReplyCommentId, setSubmittingReplyCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [togglingLike, setTogglingLike] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const commentTree = useMemo(() => {
    if (!detail?.comments.length) {
      return [] as Array<BlogPostDetail['comments'][number] & { replies: BlogPostDetail['comments'][number][] }>;
    }

    const commentMap = new Map(
      detail.comments.map((comment) => [
        comment.id,
        {
          ...comment,
          replies: [] as BlogPostDetail['comments'],
        },
      ]),
    );

    const roots: Array<BlogPostDetail['comments'][number] & { replies: BlogPostDetail['comments'][number][] }> = [];

    detail.comments.forEach((comment) => {
      const node = commentMap.get(comment.id);

      if (!node) {
        return;
      }

      if (comment.parentCommentId) {
        const parentNode = commentMap.get(comment.parentCommentId);

        if (parentNode) {
          parentNode.replies.push(node);
          return;
        }
      }

      roots.push(node);
    });

    return roots;
  }, [detail?.comments]);

  async function loadDetail(targetPostId: string) {
    const result = await fetchBlogPostById(targetPostId);
    setDetail(result);
  }

  useEffect(() => {
    if (!postIdentifier) {
      setLoadingDetail(false);
      setMessage('博客不存在。');
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingDetail(true);

      try {
        const result = await fetchBlogPostById(postIdentifier);

        if (!cancelled) {
          setDetail(result);
          setMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(extractErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postIdentifier]);

  async function handleToggleLike() {
    if (!detail) {
      return;
    }

    if (!authenticated) {
      setMessage('请先登录后点赞。');
      return;
    }

    setTogglingLike(true);

    try {
      await toggleBlogLike(detail.id);
      await loadDetail(detail.id);
      setMessage(null);
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setTogglingLike(false);
    }
  }

  async function handleSubmitComment() {
    if (!detail) {
      return;
    }

    if (!authenticated) {
      setMessage('请先登录后评论。');
      return;
    }

    const content = commentDraft.trim();

    if (!content) {
      setMessage('评论内容不能为空。');
      return;
    }

    setSubmittingComment(true);

    try {
      await createBlogComment(detail.id, { content });
      setCommentDraft('');
      await loadDetail(detail.id);
      setMessage('评论已提交，等待管理员审核后公开。');
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setSubmittingComment(false);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-6xl space-y-5 overflow-hidden px-4 py-6 md:px-6 md:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_10%_0%,rgba(19,191,168,0.2),transparent_50%),radial-gradient(circle_at_88%_12%,rgba(76,200,255,0.16),transparent_45%)]" />

      <section className="relative space-y-3 rounded-2xl border border-border/70 bg-card/84 p-5 shadow-[0_18px_44px_rgba(73,101,163,0.14)] backdrop-blur-sm">
        <span className="inline-flex w-fit rounded-full bg-secondary/80 px-3 py-1 text-xs text-secondary-foreground">Blog</span>
        <h1 className="text-3xl font-semibold leading-tight md:text-4xl">叩饭（Cofound）的故事</h1>
        <p className="text-sm leading-7 text-muted-foreground md:text-base">每一篇内容都来自社区真实实践、产品进展和成员反馈。</p>
        <div>
          <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8')} href="/blog">
            返回列表
          </Link>
        </div>
      </section>

      <Card className="border-border/70 bg-card/85 shadow-[0_14px_36px_rgba(73,101,163,0.14)]">
        <CardHeader>
          <CardTitle>{detail?.title || '正在加载...'}</CardTitle>
          {detail ? (
            <p className="text-sm text-muted-foreground">
              作者：{detail.authorDisplayName} · 更新时间：{formatDate(detail.updatedAt)}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingDetail ? <p className="text-sm text-muted-foreground">正在加载内容…</p> : null}
          {!loadingDetail && !detail ? <p className="text-sm text-muted-foreground">未找到该博客。</p> : null}
          {detail ? (
            <div className="space-y-4" data-color-mode="light">
              <p className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground">{detail.summary}</p>
              <div className="overflow-hidden rounded-lg border border-border/60 bg-white p-4">
                <MDEditor.Markdown source={detail.contentMarkdown} style={{ backgroundColor: 'transparent' }} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className={buttonVariants({ variant: 'outline' })} disabled={togglingLike || loading} onClick={() => void handleToggleLike()} type="button">
                  {detail.likedByMe ? '已点赞' : '点赞'}（{detail.likeCount}）
                </button>
                {!authenticated ? (
                  <Link className={buttonVariants()} href={`/login?next=${encodeURIComponent(`/blog/${detail.pathSegment}`)}`}>
                    登录后评论
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/85 shadow-[0_14px_36px_rgba(73,101,163,0.14)]">
        <CardHeader>
          <CardTitle>评论</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {authenticated ? (
            <div className="space-y-2">
              <textarea
                className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                maxLength={3000}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder="写下你的评论（支持纯文本）"
                value={commentDraft}
              />
              <button className={buttonVariants()} disabled={submittingComment || !detail} onClick={() => void handleSubmitComment()} type="button">
                {submittingComment ? '提交中…' : '发布评论'}
              </button>
            </div>
          ) : (
            <Link className={buttonVariants()} href={`/login?next=${encodeURIComponent(postIdentifier ? `/blog/${postIdentifier}` : '/blog')}`}>
              登录后评论
            </Link>
          )}

          {!detail?.comments.length ? <p className="text-sm text-muted-foreground">暂无评论</p> : null}
          {commentTree.map((comment) => {
            const replyDraft = replyDraftByCommentId[comment.id] || '';

            async function handleDeleteComment(commentId: string) {
              if (!detail || deletingCommentId) {
                return;
              }

              const confirmed = window.confirm('确认删除这条评论吗？删除后其回复也会一并删除。');

              if (!confirmed) {
                return;
              }

              setDeletingCommentId(commentId);

              try {
                await deleteBlogComment(detail.id, commentId);
                await loadDetail(detail.pathSegment || detail.id);
                setMessage('评论已删除。');
              } catch (error) {
                setMessage(extractErrorMessage(error));
              } finally {
                setDeletingCommentId(null);
              }
            }

            async function handleReplySubmit(parentCommentId: string) {
              if (!detail || submittingReplyCommentId) {
                return;
              }

              if (!authenticated) {
                setMessage('请先登录后回复评论。');
                return;
              }

              const content = (replyDraftByCommentId[parentCommentId] || '').trim();

              if (!content) {
                setMessage('回复内容不能为空。');
                return;
              }

              setSubmittingReplyCommentId(parentCommentId);

              try {
                await createBlogComment(detail.id, {
                  content,
                  parentCommentId,
                });
                setReplyDraftByCommentId((current) => ({ ...current, [parentCommentId]: '' }));
                setReplyingCommentId(null);
                await loadDetail(detail.pathSegment || detail.id);
                setMessage('回复已提交，等待管理员审核后公开。');
              } catch (error) {
                setMessage(extractErrorMessage(error));
              } finally {
                setSubmittingReplyCommentId(null);
              }
            }

            return (
              <article className="rounded-lg border border-border/60 bg-background/70 px-3 py-2" key={comment.id}>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{comment.authorDisplayName}</span>
                  <span>·</span>
                  <span>{formatDate(comment.createdAt)}</span>
                  {comment.status !== 'approved' ? <span className="text-amber-700">待审核（仅你可见）</span> : null}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">{comment.content}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {authenticated ? (
                    <button
                      className="text-xs text-primary underline-offset-4 hover:underline"
                      onClick={() => setReplyingCommentId((current) => (current === comment.id ? null : comment.id))}
                      type="button"
                    >
                      {replyingCommentId === comment.id ? '取消回复' : '回复'}
                    </button>
                  ) : null}
                  {comment.canDeleteByMe ? (
                    <button
                      className="text-xs text-destructive underline-offset-4 hover:underline"
                      disabled={deletingCommentId === comment.id}
                      onClick={() => void handleDeleteComment(comment.id)}
                      type="button"
                    >
                      {deletingCommentId === comment.id ? '删除中…' : '删除'}
                    </button>
                  ) : null}
                </div>

                {replyingCommentId === comment.id ? (
                  <div className="mt-3 space-y-2 rounded-md border border-border/60 bg-background/70 p-2">
                    <textarea
                      className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      maxLength={3000}
                      onChange={(event) =>
                        setReplyDraftByCommentId((current) => ({
                          ...current,
                          [comment.id]: event.target.value,
                        }))
                      }
                      placeholder={`回复 ${comment.authorDisplayName}...`}
                      value={replyDraft}
                    />
                    <button
                      className={buttonVariants({ size: 'sm' })}
                      disabled={submittingReplyCommentId === comment.id}
                      onClick={() => void handleReplySubmit(comment.id)}
                      type="button"
                    >
                      {submittingReplyCommentId === comment.id ? '提交中…' : '发布回复'}
                    </button>
                  </div>
                ) : null}

                {comment.replies.length > 0 ? (
                  <div className="mt-3 space-y-2 border-l border-border/60 pl-3">
                    {comment.replies.map((reply) => (
                      <div className="rounded-md border border-border/60 bg-background/65 px-2.5 py-2" key={reply.id}>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{reply.authorDisplayName}</span>
                          <span>·</span>
                          <span>{formatDate(reply.createdAt)}</span>
                          {reply.status !== 'approved' ? <span className="text-amber-700">待审核（仅你可见）</span> : null}
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm">{reply.content}</p>
                        {reply.canDeleteByMe ? (
                          <div className="mt-1">
                            <button
                              className="text-xs text-destructive underline-offset-4 hover:underline"
                              disabled={deletingCommentId === reply.id}
                              onClick={() => void handleDeleteComment(reply.id)}
                              type="button"
                            >
                              {deletingCommentId === reply.id ? '删除中…' : '删除'}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </CardContent>
      </Card>

      {message ? <p className={cn('text-sm', isUnauthorizedError(new Error(message)) ? 'text-amber-700' : 'text-destructive')}>{message}</p> : null}
    </div>
  );
}

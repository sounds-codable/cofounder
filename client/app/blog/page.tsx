'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  extractErrorMessage,
  fetchBlogPosts,
  type BlogPostListResult,
} from '@/lib/platform-api';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN');
}

export default function BlogPage() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<BlogPostListResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await fetchBlogPosts();

        if (cancelled) {
          return;
        }

        setList(result);
        setMessage(null);
      } catch (error) {
        if (!cancelled) {
          setMessage(extractErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative mx-auto w-full space-y-5 overflow-hidden px-4 py-6 md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_10%_0%,rgba(19,191,168,0.2),transparent_50%),radial-gradient(circle_at_88%_12%,rgba(76,200,255,0.16),transparent_45%)]" />

      <section className="relative space-y-3 rounded-2xl border border-border/70 bg-card/84 p-5 shadow-[0_18px_44px_rgba(73,101,163,0.14)] backdrop-blur-sm">
        <span className="inline-flex w-fit rounded-full bg-secondary/80 px-3 py-1 text-xs text-secondary-foreground">Blog</span>
        <h1 className="text-3xl font-semibold leading-tight md:text-4xl">叩饭（Cofounder）的故事</h1>
        <p className="text-sm leading-7 text-muted-foreground md:text-base">
          我们会在这里持续更新产品迭代、社区活动、真实协作案例与阶段总结，欢迎围观。
        </p>
      </section>

      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/86 shadow-[0_14px_36px_rgba(73,101,163,0.14)]">
        {loading ? <p className="text-sm text-muted-foreground">加载中…</p> : null}
        {!loading && !list?.items.length ? <p className="px-5 py-6 text-sm text-muted-foreground">我们正在整理第一批故事与活动记录，稍后再来看看。</p> : null}
        {list?.items.map((post, index) => (
          <article className="border-b border-border/60 px-5 py-5 last:border-b-0" key={post.id}>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>第 {list.items.length - index} 条</span>
              <span>·</span>
              <span>{post.authorDisplayName}</span>
              <span>·</span>
              <span>{formatDate(post.updatedAt)}</span>
            </div>
            <h2 className="text-xl font-semibold leading-8 text-foreground">{post.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{post.summary}</p>
            <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
                <span>👍 {post.likeCount}</span>
                <span>💬 {post.commentCount}</span>
              </div>
              <Link className="justify-self-end text-sm font-medium text-primary underline-offset-4 hover:underline" href={`/blog/${post.pathSegment}`}>
                继续阅读
              </Link>
            </div>
          </article>
        ))}
      </div>

      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </div>
  );
}

'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { extractErrorMessage, submitPublicWelfareMessage } from '@/lib/platform-api';

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
      setResultMessage(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="site-shell page-section page-stack">
      <section className="section-heading left">
        <span>公益</span>
        <h1>这是一个纯公益的协作社区。</h1>
        <p>
          我们不做收费门槛，不做中间抽成。希望大家在这里互相帮一把：项目方把真实需求拿出来，程序员把真实能力拿出来，
          一起把想法做成能跑起来的东西。
        </p>
        <p>
          这也是一种面对 AI 替代焦虑的自救方式：别空想，先合作，先做出一个小而真的 MVP。
        </p>
      </section>

      <section className="detail-card">
        <h2>我们在招募志愿者 / 共建者</h2>
        <p>
          如果你愿意一起参与，欢迎律师、投资人、财务、运营、产品、设计、销售等朋友加入。
          你可以直接留言，也可以写信到
          {' '}
          <a href="mailto:cofounder@cofounder.icu">cofounder@cofounder.icu</a>
          。
        </p>
        <p>
          如果你的项目因为这个社区得到帮助、并且真的跑起来了，也欢迎你在能力范围内赞助我们，让这个社区能被更长期地维护下去。
        </p>
      </section>

      <section className="form-shell narrow-shell">
        <div className="section-heading left">
          <span>留言</span>
          <h2>给我们留个言</h2>
          <p>留一个联系方式，再说说你能提供什么帮助，或者你现在最需要什么支持。</p>
        </div>

        <form className="stack-form" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            你的称呼（选填）
            <input maxLength={120} onChange={(event) => setName(event.target.value)} placeholder="例如：老王 / 杭州做供应链的刘老师" value={name} />
          </label>
          <label>
            联系方式（必填）
            <input
              maxLength={200}
              onChange={(event) => setContact(event.target.value)}
              placeholder="例如：微信 / 邮箱 / 电话"
              required
              value={contact}
            />
          </label>
          <label>
            留言内容（必填）
            <textarea
              maxLength={3000}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="例如：我能提供的帮助、我想找什么资源、我目前卡在哪一步……"
              required
              rows={8}
              value={message}
            />
          </label>
          <div className="card-action-row left-aligned">
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? '提交中…' : '提交留言'}
            </button>
            <Link className="ghost-button" href="/projects">
              先看项目库
            </Link>
          </div>
        </form>

        {resultMessage ? <p className="status-text">{resultMessage}</p> : null}
      </section>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { InfoDisclosure } from '@/components/info-disclosure';
import { extractErrorMessage, saveBasicProfile } from '@/lib/platform-api';
import { useAuthState } from '@/lib/use-auth';

export function BasicProfileForm() {
  const router = useRouter();
  const { authenticated, loading, profile, refresh } = useAuthState();
  const [role, setRole] = useState<'expert' | 'developer'>('expert');
  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [basicSummary, setBasicSummary] = useState('');
  const [city, setCity] = useState('');
  const [desiredDirection, setDesiredDirection] = useState('');
  const [strengths, setStrengths] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setRole(profile.user.role);
    setDisplayName(profile.user.displayName === '新用户' ? '' : profile.user.displayName);
    setHeadline(profile.card?.headline || '');
    setBasicSummary(profile.card?.basicSummary || (profile.user.basicSummary === '待补充基础信息' ? '' : profile.user.basicSummary));
    setCity(profile.user.city === '待填写' ? '' : profile.user.city);
    setDesiredDirection(profile.user.desiredDirection || profile.card?.optionalDirection || '');
    setStrengths(profile.card?.strengths.join('，') || '');
  }, [profile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await saveBasicProfile({
        role,
        displayName,
        headline,
        basicSummary,
        city,
        desiredDirection,
        strengths: strengths
          .split(/[,，\n]/)
          .map((item) => item.trim())
          .filter(Boolean),
      });
      await refresh();
      setMessage('基础信息已保存。接下来建议继续填写详细信息。');
      router.push('/onboarding/detail');
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && !authenticated) {
    return (
      <section className="form-shell">
        <div className="section-heading left">
          <span>需要登录</span>
          <h1>请先登录，再录入基础信息。</h1>
          <p>登录后你的资料和请求记录才能被稳定保存。</p>
        </div>
        <button className="primary-button" onClick={() => router.push('/login?next=/onboarding/basic')} type="button">
          去登录
        </button>
      </section>
    );
  }

  return (
    <section className="form-shell">
      <div className="section-heading left">
        <span>基础信息</span>
        <h1>先补公开信息，让别人先快速了解你在做什么。</h1>
        <p>这一页保存的是会出现在公开卡片里的内容。</p>
        <div className="section-heading-extra">
          <InfoDisclosure title="这一步会公开什么" compact>
            {role === 'expert' ? (
              <>
                <p>项目方侧重点是项目描述和所在城市。</p>
                <p>更完整的个人背景与项目细节，后续再补充。</p>
              </>
            ) : (
              <>
                <p>程序员侧重点是技能、做过的项目、偏好方向和所在城市。</p>
                <p>更完整的履历和联系方式，不会在这一步直接显示。</p>
              </>
            )}
          </InfoDisclosure>
        </div>
      </div>
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          你的角色
          <select name="role" onChange={(event) => setRole(event.target.value as 'expert' | 'developer')} value={role}>
            <option value="expert">项目方 / 行业专家</option>
            <option value="developer">程序员</option>
          </select>
        </label>
        <label>
          对外显示名称
          <input name="displayName" onChange={(event) => setDisplayName(event.target.value)} placeholder="例如：陈医生 / 林工" type="text" value={displayName} />
        </label>
        <label>
          卡片标题
          <textarea name="headline" onChange={(event) => setHeadline(event.target.value)} placeholder="一句话说明你的项目或能力亮点" rows={3} value={headline} />
        </label>
        <label>
          基础信息主描述
          <textarea name="summary" onChange={(event) => setBasicSummary(event.target.value)} placeholder="用最少的话说明你的项目或能力情况" rows={5} value={basicSummary} />
        </label>
        <label>
          所在城市
          <input name="city" onChange={(event) => setCity(event.target.value)} placeholder="例如：杭州" type="text" value={city} />
        </label>
        <label>
          想做什么方向 / 类型的项目（程序员可选）
          <input name="direction" onChange={(event) => setDesiredDirection(event.target.value)} placeholder="例如：AI 工具、效率平台、产业互联网" type="text" value={desiredDirection} />
        </label>
        <label>
          标签 / 技能（逗号分隔）
          <input name="strengths" onChange={(event) => setStrengths(event.target.value)} placeholder="例如：Next.js，NestJS，增长实验" type="text" value={strengths} />
        </label>
        {message ? <p className="status-text">{message}</p> : null}
        <button className="primary-button hero-primary" disabled={submitting} type="submit">
          {submitting ? '保存中…' : '保存基础信息'}
        </button>
      </form>
    </section>
  );
}

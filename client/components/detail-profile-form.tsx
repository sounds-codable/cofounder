'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { InfoDisclosure } from '@/components/info-disclosure';
import { extractErrorMessage, saveDetailProfile } from '@/lib/platform-api';
import { useAuthState } from '@/lib/use-auth';

export function DetailProfileForm() {
  const router = useRouter();
  const { authenticated, loading, profile, refresh } = useAuthState();
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
      <section className="form-shell">
        <div className="section-heading left">
          <span>需要登录</span>
          <h1>请先登录，再填写详细信息。</h1>
          <p>详细信息会用于后续授权流程和联系方式交换。</p>
        </div>
        <button className="primary-button" onClick={() => router.push('/login?next=/onboarding/detail')} type="button">
          去登录
        </button>
      </section>
    );
  }

  return (
    <section className="form-shell">
      <div className="section-heading left">
        <span>详细信息</span>
        <h1>把更完整的背景补充好，后续需要时就可以直接复用。</h1>
        <p>这部分不是默认公开内容，会在后续步骤里按需开放。</p>
        <div className="section-heading-extra">
          <InfoDisclosure title="填写说明" compact>
            <p>详细信息只需要填写一次。</p>
            <p>联系方式可以先填着，但只有在后续交换联系方式时才会真正展示给对方。</p>
          </InfoDisclosure>
        </div>
      </div>
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          个人简介
          <textarea name="intro" onChange={(event) => setIntro(event.target.value)} rows={4} placeholder="介绍你自己、你的判断力、你的协作方式" value={intro} />
        </label>
        <label>
          教育背景
          <textarea name="education" onChange={(event) => setEducation(event.target.value)} rows={3} placeholder="学校、专业" value={education} />
        </label>
        <label>
          工作背景
          <textarea name="experience" onChange={(event) => setExperience(event.target.value)} rows={4} placeholder="做过哪些公司，负责过哪些事" value={experience} />
        </label>
        <label>
          项目详情 / 做过的产品介绍
          <textarea name="projectDetail" onChange={(event) => setProjectDetail(event.target.value)} rows={5} placeholder="更详细介绍你的项目、产品或代表作品" value={projectDetail} />
        </label>
        <div className="role-columns contact-grid">
          <label>
            电话
            <input name="phone" onChange={(event) => setPhone(event.target.value)} placeholder="选填" type="text" value={phone} />
          </label>
          <label>
            微信
            <input name="wechat" onChange={(event) => setWechat(event.target.value)} placeholder="选填" type="text" value={wechat} />
          </label>
          <label>
            QQ
            <input name="qq" onChange={(event) => setQq(event.target.value)} placeholder="选填" type="text" value={qq} />
          </label>
          <label>
            邮箱
            <input name="email" onChange={(event) => setEmail(event.target.value)} placeholder="选填" type="email" value={email} />
          </label>
        </div>
        <label>
          其他联系方式
          <input name="other" onChange={(event) => setOther(event.target.value)} placeholder="选填，例如 Telegram / 飞书" type="text" value={other} />
        </label>
        {message ? <p className="status-text">{message}</p> : null}
        <button className="primary-button hero-primary" disabled={submitting} type="submit">
          {submitting ? '保存中…' : '保存详细信息'}
        </button>
      </form>
    </section>
  );
}

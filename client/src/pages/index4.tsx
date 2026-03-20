import { View, Text, Input } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { waitlistApi } from '@/services/api'
import './index4.scss'

type SubmitState = 'idle' | 'loading' | 'done' | 'error'

export default function Index4() {
  const [topEmail, setTopEmail] = useState('')
  const [bottomEmail, setBottomEmail] = useState('')
  const [status, setStatus] = useState<SubmitState>('idle')
  const [message, setMessage] = useState('')

  const submitWaitlist = async (email: string) => {
    if (!email || !email.includes('@')) {
      Taro.showToast({ title: '请输入有效邮箱', icon: 'none' })
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const res = await waitlistApi.subscribe(email)
      if (res.success) {
        setStatus('done')
        setMessage(res.message || '订阅成功')
        setTopEmail(email)
        setBottomEmail(email)
        return
      }
      setStatus('error')
      setMessage(res.message || '订阅失败，请稍后重试')
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || '网络异常，请稍后重试')
    }
  }

  return (
    <View className='index4'>
      <View className='hero'>
        <Text className='eyebrow'>ICU · I SEE YOU</Text>
        <Text className='title'>程序员 × 专家，马上开始协作。</Text>
        <Text className='subtitle'>ICU = I See You。我们看见你，也看见你们可以互补。</Text>

        <View className='waitlist-box top-box'>
          <Text className='waitlist-title'>上线第一时间通知你</Text>
          <View className='input-row'>
            <Input
              className='email-input'
              type='text'
              value={topEmail}
              onInput={(e) => setTopEmail(e.detail.value)}
              placeholder='your@email.com'
              placeholderStyle='color: #64748b;'
              disabled={status === 'loading'}
            />
            <View
              className={`submit-btn ${status === 'loading' ? 'disabled' : ''}`}
              onClick={status === 'loading' ? undefined : () => submitWaitlist(topEmail)}
            >
              <Text className='submit-btn-text'>
                {status === 'loading' ? '提交中...' : '通知我'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className='content'>
        <View className='block-card'>
          <Text className='block-kicker'>WHY</Text>
          <Text className='block-title'>为什么必须是「程序员 × 专家」</Text>
          <Text className='block-desc'>
            只有专家，想法落不了地；只有程序员，产品容易偏方向。
            两个人一起，才是最快且最稳的起点。
          </Text>
        </View>

        <View className='block-card'>
          <Text className='block-kicker'>HOW</Text>
          <Text className='block-title'>我们怎么让双方真正合作</Text>
          <Text className='block-desc'>
            专家发布场景与资源，程序员发布技术与节奏。
            双向匹配后先做 MVP，边做边验证，边合作边迭代。
          </Text>
        </View>

        <View className='block-card'>
          <Text className='block-kicker'>WHAT</Text>
          <Text className='block-title'>你会得到什么结果</Text>
          <Text className='block-desc'>
            专家拿到可落地产品，程序员拿到真实业务场景。
            一起把「点子」变成「可验证的产品」。
          </Text>
        </View>
      </View>

      <View className='bottom-cta'>
        <Text className='bottom-title'>别让好想法静悄悄消失。</Text>
        <Text className='bottom-sub'>留一个邮箱，我们上线就叫你。</Text>

        <View className='waitlist-box'>
          <View className='input-row'>
            <Input
              className='email-input'
              type='text'
              value={bottomEmail}
              onInput={(e) => setBottomEmail(e.detail.value)}
              placeholder='your@email.com'
              placeholderStyle='color: #64748b;'
              disabled={status === 'loading'}
            />
            <View
              className={`submit-btn ${status === 'loading' ? 'disabled' : ''}`}
              onClick={status === 'loading' ? undefined : () => submitWaitlist(bottomEmail)}
            >
              <Text className='submit-btn-text'>
                {status === 'loading' ? '提交中...' : '加入等待名单'}
              </Text>
            </View>
          </View>
        </View>

        {status === 'done' && <Text className='success-msg'>✓ 已加入 waitlist，感谢你。</Text>}
        {status === 'error' && <Text className='error-msg'>{message}</Text>}
        <Text className='foot-note'>免费 · 不会发垃圾邮件 · 随时退订</Text>
      </View>
    </View>
  )
}

import { View, Text, Input } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { waitlistApi } from '@/services/api'
import './index7.scss'

type SubmitState = 'idle' | 'loading' | 'done' | 'error'

export default function Index7() {
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
        setMessage(res.message || '已加入 waitlist')
        setTopEmail(email)
        setBottomEmail(email)
      } else {
        setStatus('error')
        setMessage(res.message || '订阅失败，请稍后重试')
      }
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || '网络异常，请稍后重试')
    }
  }

  return (
    <View className='index7'>
      <View className='hero'>
        <View className='breathe breathe-one' />
        <View className='breathe breathe-two' />

        <View className='hero-inner'>
          <Text className='hero-eyebrow'>I SEE YOU</Text>
          <Text className='hero-title'>
            你有洞察，{'\n'}
            也值得遇到一个能一起做出来的人。
          </Text>
          <Text className='hero-desc'>
            叩饭（Cofounder），连接程序员与专家。不是外包，不是雇佣，是并肩把产品做出来。
          </Text>

          <View className='waitlist-box top-waitlist'>
            <Text className='waitlist-label'>上线第一时间通知你</Text>
            <View className='waitlist-row'>
              <Input
                className='waitlist-input'
                type='text'
                value={topEmail}
                onInput={(e) => setTopEmail(e.detail.value)}
                placeholder='your@email.com'
                placeholderStyle='color: #94a3b8;'
                disabled={status === 'loading'}
              />
              <View
                className={`waitlist-btn ${status === 'loading' ? 'disabled' : ''}`}
                onClick={status === 'loading' ? undefined : () => submitWaitlist(topEmail)}
              >
                <Text className='waitlist-btn-text'>
                  {status === 'loading' ? '提交中...' : '通知我'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className='section section-why'>
        <View className='section-inner'>
          <Text className='section-kicker'>WHY</Text>
          <Text className='section-title'>为什么做这个网站</Text>
          <Text className='section-copy'>
            专家常常有真实场景，却缺少技术搭档；程序员有实现能力，却缺少高质量问题。
            我们想解决的，就是这条最关键的连接。
          </Text>
        </View>
      </View>

      <View className='section section-how'>
        <View className='section-inner'>
          <Text className='section-kicker'>HOW</Text>
          <Text className='section-title'>我们的 solution</Text>
          <View className='how-grid'>
            <View className='how-card'>
              <Text className='how-num'>1</Text>
              <Text className='how-text'>专家发布场景与资源</Text>
            </View>
            <View className='how-card'>
              <Text className='how-num'>2</Text>
              <Text className='how-text'>程序员发布能力与兴趣</Text>
            </View>
            <View className='how-card'>
              <Text className='how-num'>3</Text>
              <Text className='how-text'>双向匹配后先做 MVP</Text>
            </View>
          </View>
        </View>
      </View>

      <View className='section section-what'>
        <View className='section-inner'>
          <Text className='section-kicker'>WHAT</Text>
          <Text className='section-title'>从我们这里得到什么</Text>
          <View className='what-grid'>
            <View className='what-card'>
              <Text className='what-title'>更快启动</Text>
              <Text className='what-text'>少一点空转，多一点真协作。</Text>
            </View>
            <View className='what-card'>
              <Text className='what-title'>更低试错</Text>
              <Text className='what-text'>先做 MVP，再决定要不要走更远。</Text>
            </View>
            <View className='what-card'>
              <Text className='what-title'>更真实搭档</Text>
              <Text className='what-text'>找到的不只是人，而是一起做产品的节奏。</Text>
            </View>
          </View>
        </View>
      </View>

      <View className='bottom-cta'>
        <View className='section-inner'>
          <Text className='bottom-title'>留下邮箱，抢先加入 waitlist</Text>
          <Text className='bottom-sub'>产品上线后，我们第一时间通知你。</Text>

          <View className='waitlist-box bottom-waitlist'>
            <View className='waitlist-row'>
              <Input
                className='waitlist-input'
                type='text'
                value={bottomEmail}
                onInput={(e) => setBottomEmail(e.detail.value)}
                placeholder='your@email.com'
                placeholderStyle='color: #94a3b8;'
                disabled={status === 'loading'}
              />
              <View
                className={`waitlist-btn ${status === 'loading' ? 'disabled' : ''}`}
                onClick={status === 'loading' ? undefined : () => submitWaitlist(bottomEmail)}
              >
                <Text className='waitlist-btn-text'>
                  {status === 'loading' ? '提交中...' : '加入等待名单'}
                </Text>
              </View>
            </View>
          </View>

          {status === 'done' && <Text className='ok-msg'>✓ {message}</Text>}
          {status === 'error' && <Text className='err-msg'>{message}</Text>}
          <Text className='foot-note'>免费 · 不会发垃圾邮件 · 随时退订</Text>
        </View>
      </View>
    </View>
  )
}

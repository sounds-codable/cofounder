import { View, Text, Input } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { waitlistApi } from '@/services/api'
import './index.scss'

type SubmitState = 'idle' | 'loading' | 'done' | 'error'

export default function Index5() {
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
        setMessage(res.message || '预约成功，上线第一时间通知你。')
        setTopEmail(email)
        setBottomEmail(email)
        return
      }
      setStatus('error')
      setMessage(res.message || '提交失败，请稍后重试')
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || '网络异常，请稍后重试')
    }
  }

  return (
    <View className='index5'>
      <View className='hero'>
        <Text className='eyebrow'>叩饭（Cofounder） · 内测招募中</Text>
        <Text className='title'>一个人走得快，两个人走得远。</Text>
        <Text className='subtitle'>
          专家懂方向，程序员能落地。先匹配，再共建，用结果说话。
        </Text>

        <View className='waitlist-box top-box'>
          <View className='input-row'>
            <Input
              className='email-input'
              type='text'
              value={topEmail}
              onInput={(e) => setTopEmail(e.detail.value)}
              placeholder='输入邮箱，抢先体验'
              placeholderStyle='color: #94a3b8;'
              disabled={status === 'loading'}
            />
            <View
              className={`submit-btn ${status === 'loading' ? 'disabled' : ''}`}
              onClick={status === 'loading' ? undefined : () => submitWaitlist(topEmail)}
            >
              <Text className='submit-btn-text'>
                {status === 'loading' ? '提交中...' : '立即加入'}
              </Text>
            </View>
          </View>
          <Text className='waitlist-note'>免费 · 无打扰 · 可随时退订</Text>
        </View>

        <View className='metric-row'>
          <View className='metric-card mc-1'>
            <Text className='metric-icon'>⚡</Text>
            <Text className='metric-value'>更快</Text>
            <Text className='metric-label'>跳过社交，直接协作</Text>
          </View>
          <View className='metric-card mc-2'>
            <Text className='metric-icon'>🎯</Text>
            <Text className='metric-value'>更准</Text>
            <Text className='metric-label'>方向×执行，同时就位</Text>
          </View>
          <View className='metric-card mc-3'>
            <Text className='metric-icon'>🤝</Text>
            <Text className='metric-value'>更真</Text>
            <Text className='metric-label'>用 MVP 验证合作默契</Text>
          </View>
        </View>
      </View>

      <View className='content'>
        <View className='block-card'>
          <Text className='block-num'>01</Text>
          <Text className='block-title'>好想法死于找不到对的人</Text>
          <Text className='block-desc'>
            懂业务的缺技术，能写代码的缺场景。叩饭（Cofounder）让互补的两个人直接碰面。
          </Text>
        </View>

        <View className='block-card featured-card'>
          <Text className='block-num'>02</Text>
          <Text className='block-title'>不聊天，直接围绕问题干活</Text>
          <Text className='block-desc'>
            专家发布场景，程序员亮出能力。匹配后先做一个最小产品，用结果说话。
          </Text>
        </View>

        <View className='block-card'>
          <Text className='block-num'>03</Text>
          <Text className='block-title'>你拿到的不是人脉，是起点</Text>
          <Text className='block-desc'>
            更低的试错成本、更清晰的下一步，和一个真能推进的产品雏形。
          </Text>
        </View>
      </View>

      <View className='bottom-cta'>
        <Text className='bottom-title'>别让好想法只停在脑子里。</Text>
        <Text className='bottom-sub'>留下邮箱，我们上线就叫你。</Text>

        <View className='waitlist-box bottom-box'>
          <View className='input-row'>
            <Input
              className='email-input'
              type='text'
              value={bottomEmail}
              onInput={(e) => setBottomEmail(e.detail.value)}
              placeholder='your@email.com'
              placeholderStyle='color: #94a3b8;'
              disabled={status === 'loading'}
            />
            <View
              className={`submit-btn ${status === 'loading' ? 'disabled' : ''}`}
              onClick={status === 'loading' ? undefined : () => submitWaitlist(bottomEmail)}
            >
              <Text className='submit-btn-text'>
                {status === 'loading' ? '提交中...' : '预约通知'}
              </Text>
            </View>
          </View>
        </View>

        {status === 'done' && <Text className='success-msg'>{message}</Text>}
        {status === 'error' && <Text className='error-msg'>{message}</Text>}
        <Text className='foot-note'>内测优先 · 免费 · 没有垃圾邮件</Text>
      </View>
    </View>
  )
}

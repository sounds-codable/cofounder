import { View, Text, Input } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { waitlistApi } from '@/services/api'
import './index6.scss'

type SubmitState = 'idle' | 'loading' | 'done' | 'error'

export default function Index6() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<SubmitState>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
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
        setMessage('已加入 waitlist，上线第一时间通知你。')
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
    <View className='index6'>
      <View className='bg-breathe bubble-1' />
      <View className='bg-breathe bubble-2' />

      <View className='hero'>
        <Text className='brand'>合伙造</Text>
        <Text className='headline'>程序员 × 专家，今天就能开始</Text>
        <Text className='subline'>不是找外包，不是空聊想法。是一起把产品做出来。</Text>
      </View>

      <View className='why-block'>
        <Text className='kicker'>WHY</Text>
        <Text className='why-title'>多数好想法，不是输在方向，而是停在没人并肩。</Text>
        <Text className='why-desc'>
          专家有行业洞察，程序员有产品实现。分开都很强，合在一起才有结果。
        </Text>
      </View>

      <View className='how-what-grid'>
        <View className='panel'>
          <Text className='kicker'>HOW</Text>
          <Text className='panel-title'>怎么做</Text>
          <Text className='panel-desc'>
            1) 双向匹配{'\n'}
            2) 快速组队{'\n'}
            3) 先做 MVP 验证
          </Text>
        </View>

        <View className='panel'>
          <Text className='kicker'>WHAT</Text>
          <Text className='panel-title'>你会得到</Text>
          <Text className='panel-desc'>
            更快落地速度{'\n'}
            更低试错成本{'\n'}
            更真实的合作关系
          </Text>
        </View>
      </View>

      <View className='cta-card'>
        <Text className='cta-title'>把你放进第一批内测名单</Text>
        <Text className='cta-sub'>上线即通知，优先体验</Text>

        <View className='row'>
          <Input
            className='email'
            type='text'
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
            placeholder='your@email.com'
            placeholderStyle='color:#94a3b8;'
            disabled={status === 'loading'}
          />
          <View className={`submit ${status === 'loading' ? 'disabled' : ''}`} onClick={status === 'loading' ? undefined : handleSubmit}>
            <Text className='submit-text'>{status === 'loading' ? '提交中...' : '通知我'}</Text>
          </View>
        </View>

        {status === 'done' && <Text className='ok'>{message}</Text>}
        {status === 'error' && <Text className='err'>{message}</Text>}
        <Text className='note'>免费 · 不会发垃圾邮件 · 随时退订</Text>
      </View>
    </View>
  )
}

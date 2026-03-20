import { View, Text, Input } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { waitlistApi } from '@/services/api'
import './index5.scss'

type SubmitState = 'idle' | 'loading' | 'done' | 'error'

export default function Index5() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<SubmitState>('idle')
  const [msg, setMsg] = useState('')

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      Taro.showToast({ title: '请输入有效邮箱', icon: 'none' })
      return
    }

    setState('loading')
    setMsg('')
    try {
      const res = await waitlistApi.subscribe(email)
      if (res.success) {
        setState('done')
        setMsg('已加入 waitlist，上线第一时间通知你。')
      } else {
        setState('error')
        setMsg(res.message || '订阅失败，请稍后重试')
      }
    } catch (error: any) {
      setState('error')
      setMsg(error.message || '网络异常，请稍后重试')
    }
  }

  return (
    <View className='index5'>
      <View className='hero breathe'>
        <Text className='brand'>合伙造</Text>
        <Text className='title'>程序员 × 专家，共创产品</Text>
        <Text className='sub'>快、准、真协作。不是雇佣，是并肩。</Text>
      </View>

      <View className='grid'>
        <View className='card'>
          <Text className='kicker'>WHY</Text>
          <Text className='card-title'>为什么做这个网站</Text>
          <Text className='card-desc'>好想法常常死在“找不到对的人”。我们让双方在同一场景里相遇。</Text>
        </View>

        <View className='card'>
          <Text className='kicker'>HOW</Text>
          <Text className='card-title'>我们的 solution</Text>
          <Text className='card-desc'>专家发场景，程序员发能力；双向匹配后先做 MVP，快速验证合作。</Text>
        </View>

        <View className='card'>
          <Text className='kicker'>WHAT</Text>
          <Text className='card-title'>你会得到什么</Text>
          <Text className='card-desc'>更快落地、风险更低、合作更真。把“点子”变成“可用产品”。</Text>
        </View>
      </View>

      <View className='cta'>
        <Text className='cta-title'>留下邮箱，抢先进入内测</Text>
        <View className='row'>
          <Input
            className='input'
            type='text'
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
            placeholder='your@email.com'
            placeholderStyle='color:#94a3b8;'
            disabled={state === 'loading'}
          />
          <View className={`btn ${state === 'loading' ? 'disabled' : ''}`} onClick={state === 'loading' ? undefined : handleSubmit}>
            <Text className='btn-text'>{state === 'loading' ? '提交中...' : '通知我'}</Text>
          </View>
        </View>

        {state === 'done' && <Text className='ok'>{msg}</Text>}
        {state === 'error' && <Text className='err'>{msg}</Text>}
        <Text className='note'>免费 · 不会发垃圾邮件 · 随时退订</Text>
      </View>
    </View>
  )
}

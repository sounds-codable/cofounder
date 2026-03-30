import { View, Text, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { storage } from '@/utils/storage'
import { waitlistApi } from '@/services/api'
import './index.scss'

export default function Index() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  useDidShow(() => {
    if (storage.isLoggedIn()) {
      const user = storage.getUser()
      if (user?.basicProfileCompleted) {
        Taro.redirectTo({ url: '/pages/projects/index' })
      } else {
        Taro.redirectTo({ url: '/pages/onboarding/index' })
      }
    }
  })

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      Taro.showToast({ title: '请输入有效邮箱', icon: 'none' })
      return
    }
    setStatus('loading')
    try {
      const res = await waitlistApi.subscribe(email)
      if (res.success) {
        setStatus('done')
        setMsg(res.message || '订阅成功')
      } else {
        setStatus('error')
        setMsg(res.message || '订阅失败')
      }
    } catch (e: any) {
      setStatus('error')
      setMsg(e.message || '网络错误')
    }
  }

  if (storage.isLoggedIn()) {
    return <View className='page' />
  }

  return (
    <View className='page'>
      <View className='center'>
        {/* Logo */}
        <Text className='logo'>叩饭（Cofounder）</Text>

        {/* Tagline */}
        <Text className='tagline'>
          行业专家 × 程序员{'\n'}股权合伙，从想法到产品
        </Text>

        {/* Status line */}
        <View className='status-bar'>
          <View className='status-dot' />
          <Text className='status-text'>即将上线</Text>
        </View>

        {/* Form */}
        {status === 'done' ? (
          <View className='done-box'>
            <Text className='done-icon'>✓</Text>
            <Text className='done-text'>你在名单上了</Text>
            <Text className='done-sub'>上线后第一时间通知你</Text>
          </View>
        ) : (
          <View className='form-box'>
            <Text className='form-label'>留下邮箱，上线后第一时间通知你</Text>
            <View className='input-row'>
              <Input
                className='email-input'
                type='text'
                placeholder='your@email.com'
                value={email}
                onInput={(e) => setEmail(e.detail.value)}
                placeholderStyle='color: #475569;'
                disabled={status === 'loading'}
              />
              <View
                className={`submit-btn ${status === 'loading' ? 'disabled' : ''}`}
                onClick={status === 'loading' ? undefined : handleSubmit}
              >
                <Text className='submit-text'>
                  {status === 'loading' ? '...' : '通知我'}
                </Text>
              </View>
            </View>
            {status === 'error' && (
              <Text className='error-msg'>{msg}</Text>
            )}
            <Text className='note'>免费 · 不会发垃圾邮件 · 随时退订</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <Text className='foot'>© 2026 叩饭（Cofounder）</Text>
    </View>
  )
}

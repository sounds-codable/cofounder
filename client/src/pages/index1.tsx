import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { waitlistApi } from '@/services/api'
import './index1.scss'

export default function Index1() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

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
        setMessage('收到。上线第一时间叫你。')
      } else {
        setStatus('error')
        setMessage(res.message || '订阅失败，请稍后再试')
      }
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || '网络异常，请稍后再试')
    }
  }

  return (
    <View className='index1'>
      <View className='card'>
        <Text className='title'>ICU</Text>
        <Text className='subtitle'>I See You.</Text>
        <Text className='desc'>
          我看见你：有想法，但卡在最后一步。{'\n'}
          不急着解释，先留下邮箱。我们上线就叫你。
        </Text>

        {status === 'done' ? (
          <View className='done'>
            <Text className='done-icon'>❤</Text>
            <Text className='done-text'>{message}</Text>
          </View>
        ) : (
          <View className='form'>
            <Input
              className='input'
              type='text'
              placeholder='your@email.com'
              value={email}
              onInput={(e) => setEmail(e.detail.value)}
              placeholderStyle='color: #64748b;'
              disabled={status === 'loading'}
            />
            <View
              className={`button ${status === 'loading' ? 'disabled' : ''}`}
              onClick={status === 'loading' ? undefined : handleSubmit}
            >
              <Text className='button-text'>{status === 'loading' ? '提交中...' : '上线通知我'}</Text>
            </View>
            {status === 'error' && <Text className='error'>{message}</Text>}
          </View>
        )}

        <Text className='note'>紧急，但不慌。我们一起把它救回来。</Text>
      </View>
    </View>
  )
}

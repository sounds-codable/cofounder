import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { authApi } from '@/services/api'
import { storage } from '@/utils/storage'
import './index.scss'

export default function Login() {
  const router = useRouter()
  const role = router.params.role || 'developer'
  
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendCode = async () => {
    if (!email) {
      Taro.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Taro.showToast({ title: '请输入有效的邮箱地址', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      await authApi.sendCode(email, role)
      setStep('code')
      startCountdown()
      Taro.showToast({ title: '验证码已发送', icon: 'success' })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '发送失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      Taro.showToast({ title: '请输入6位验证码', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const result = await authApi.verify(email, code, role)
      storage.setToken(result.access_token)
      storage.setUser(result.user)
      
      Taro.showToast({ title: '登录成功', icon: 'success' })
      
      setTimeout(() => {
        if (result.user.basicProfileCompleted) {
          Taro.redirectTo({ url: '/pages/projects/index' })
        } else {
          Taro.redirectTo({ url: '/pages/onboarding/index' })
        }
      }, 1000)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '验证失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='login'>
      <View className='login-header'>
        <Text className='login-emoji'>
          {role === 'project_owner' ? '💼' : '💻'}
        </Text>
        <Text className='login-title'>
          {role === 'project_owner' ? '项目方登录' : '程序员登录'}
        </Text>
        <Text className='login-subtitle'>
          使用邮箱验证码登录，新用户将自动注册
        </Text>
      </View>

      <View className='login-form'>
        {step === 'email' ? (
          <>
            <View className='form-item'>
              <Text className='form-label'>邮箱地址</Text>
              <Input
                className='form-input'
                type='text'
                placeholder='请输入您的邮箱'
                value={email}
                onInput={(e) => setEmail(e.detail.value)}
              />
            </View>
            <Button
              className='btn-primary'
              loading={loading}
              onClick={handleSendCode}
            >
              发送验证码
            </Button>
          </>
        ) : (
          <>
            <View className='form-item'>
              <Text className='form-label'>验证码</Text>
              <View className='code-input-wrapper'>
                <Input
                  className='form-input'
                  type='number'
                  maxlength={6}
                  placeholder='请输入6位验证码'
                  value={code}
                  onInput={(e) => setCode(e.detail.value)}
                />
                <Button
                  className='btn-resend'
                  disabled={countdown > 0}
                  onClick={handleSendCode}
                >
                  {countdown > 0 ? `${countdown}s` : '重新发送'}
                </Button>
              </View>
              <Text className='form-hint'>验证码已发送至 {email}</Text>
            </View>
            <Button
              className='btn-primary'
              loading={loading}
              onClick={handleVerify}
            >
              登录
            </Button>
          </>
        )}
      </View>
    </View>
  )
}


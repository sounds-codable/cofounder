import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { storage } from '@/utils/storage'
import './index.scss'

export default function Index() {
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

  const handleLogin = (role: 'project_owner' | 'developer') => {
    Taro.navigateTo({ url: `/pages/login/index?role=${role}` })
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
          行业专家 × 程序员{'\n'}不是雇佣，是合伙创业
        </Text>

        <View className='status-bar'>
          <Text className='status-text'>登录 / 注册</Text>
        </View>

        <View className='actions'>
          <Button className='btn-owner' onClick={() => handleLogin('project_owner')}>
            💼 我是项目方（登录 / 注册）
          </Button>
          <Button className='btn-dev' onClick={() => handleLogin('developer')}>
            💻 我是程序员（登录 / 注册）
          </Button>
          <Text className='note'>首次登录会自动注册账号</Text>
        </View>
      </View>

      {/* Footer */}
      <Text className='foot'>© 2026 叩饭（Cofounder）</Text>
    </View>
  )
}

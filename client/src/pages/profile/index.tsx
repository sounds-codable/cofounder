import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { storage } from '@/utils/storage'
import { userApi } from '@/services/api'
import './index.scss'

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const result = await userApi.getProfile()
      setUser(result)
      storage.setUser(result)
    } catch (error) {
      const cachedUser = storage.getUser()
      if (cachedUser) {
        setUser(cachedUser)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          storage.clear()
          Taro.redirectTo({ url: '/pages/index/index' })
        }
      },
    })
  }

  const goToTab = (page: string) => {
    Taro.redirectTo({ url: `/pages/${page}/index` })
  }

  if (loading) {
    return (
      <View className='loading'>
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <View className='profile'>
      {/* Tab Navigation */}
      <View className='tabs'>
        <View className='tab' onClick={() => goToTab('projects')}>项目广场</View>
        <View className='tab' onClick={() => goToTab('developers')}>程序员广场</View>
        <View className='tab' onClick={() => goToTab('requests')}>我的请求</View>
        <View className='tab active'>个人中心</View>
      </View>

      {/* Profile Header */}
      <View className='profile-header'>
        <Text className='profile-avatar'>
          {user?.role === 'developer' ? '👨‍💻' : '💼'}
        </Text>
        <Text className='profile-name'>{user?.nickname || '未设置昵称'}</Text>
        <Text className='profile-role'>
          {user?.role === 'developer' ? '程序员' : '项目方'}
        </Text>
      </View>

      {/* Profile Info */}
      <View className='profile-section'>
        <View className='section-header'>
          <Text className='section-title'>基础信息</Text>
          <Text
            className='section-action'
            onClick={() => Taro.navigateTo({ url: '/pages/profile/basic' })}
          >
            编辑
          </Text>
        </View>
        
        <View className='info-item'>
          <Text className='info-label'>邮箱</Text>
          <Text className='info-value'>{user?.email}</Text>
        </View>
        
        <View className='info-item'>
          <Text className='info-label'>每周投入</Text>
          <Text className='info-value'>{user?.weeklyHours || '未设置'}</Text>
        </View>

        {user?.role === 'developer' && (
          <>
            <View className='info-item'>
              <Text className='info-label'>技术方向</Text>
              <Text className='info-value'>
                {user?.techDirections?.join('、') || '未设置'}
              </Text>
            </View>
            <View className='info-item'>
              <Text className='info-label'>工作年限</Text>
              <Text className='info-value'>{user?.workYears || '未设置'}年</Text>
            </View>
          </>
        )}

        {user?.role === 'project_owner' && (
          <View className='info-item'>
            <Text className='info-label'>行业领域</Text>
            <Text className='info-value'>{user?.industry || '未设置'}</Text>
          </View>
        )}
      </View>

      {/* Detailed Profile */}
      <View className='profile-section'>
        <View className='section-header'>
          <Text className='section-title'>详细资料</Text>
          <Text
            className='section-action'
            onClick={() => Taro.navigateTo({ url: '/pages/profile/detail' })}
          >
            {user?.detailedProfileCompleted ? '编辑' : '去完善'}
          </Text>
        </View>
        
        {user?.detailedProfileCompleted ? (
          <View className='info-item'>
            <Text className='info-value complete'>✅ 已完善</Text>
          </View>
        ) : (
          <View className='info-item'>
            <Text className='info-value incomplete'>
              ⚠️ 完善详细资料后才能发送合伙请求
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View className='profile-actions'>
        <Button className='btn-logout' onClick={handleLogout}>
          退出登录
        </Button>
      </View>
    </View>
  )
}


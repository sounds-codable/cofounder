import { View, Text, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { developerApi, requestApi } from '@/services/api'
import { storage } from '@/utils/storage'
import './detail.scss'

export default function DeveloperDetail() {
  const router = useRouter()
  const developerId = router.params.id
  const [developer, setDeveloper] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const user = storage.getUser()

  useEffect(() => {
    if (developerId) {
      loadDeveloper()
    }
  }, [developerId])

  const loadDeveloper = async () => {
    setLoading(true)
    try {
      const result = await developerApi.get(developerId)
      setDeveloper(result)
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async () => {
    if (!user?.detailedProfileCompleted) {
      Taro.showModal({
        title: '完善资料',
        content: '发送合伙请求前需要完善详细资料，是否前往完善？',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/profile/detail' })
          }
        },
      })
      return
    }

    setRequesting(true)
    try {
      await requestApi.send({ targetUserId: developerId })
      Taro.showToast({ title: '请求已发送', icon: 'success' })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '发送失败', icon: 'none' })
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <View className='loading'>
        <Text>加载中...</Text>
      </View>
    )
  }

  if (!developer) {
    return (
      <View className='error'>
        <Text>程序员不存在</Text>
      </View>
    )
  }

  return (
    <View className='developer-detail'>
      <View className='detail-header'>
        <Text className='dev-avatar'>👨‍💻</Text>
        <Text className='dev-name'>{developer.nickname}</Text>
        <Text className='dev-exp'>{developer.workYears || '?'}年工作经验</Text>
      </View>

      {developer.bio && (
        <View className='detail-section'>
          <Text className='section-label'>个人简介</Text>
          <Text className='section-content'>{developer.bio}</Text>
        </View>
      )}

      {developer.techDirections?.length > 0 && (
        <View className='detail-section'>
          <Text className='section-label'>技术方向</Text>
          <View className='tech-tags'>
            {developer.techDirections.map((tech: string, idx: number) => (
              <Text key={idx} className='tech-tag'>{tech}</Text>
            ))}
          </View>
        </View>
      )}

      {developer.weeklyHours && (
        <View className='detail-section'>
          <Text className='section-label'>每周可投入时间</Text>
          <Text className='section-content'>{developer.weeklyHours}</Text>
        </View>
      )}

      {/* 发送请求按钮 - 仅项目方可见 */}
      {user?.role === 'project_owner' && (
        <View className='action-bar'>
          <Button
            className='btn-request'
            loading={requesting}
            onClick={handleSendRequest}
          >
            邀请合伙
          </Button>
        </View>
      )}
    </View>
  )
}


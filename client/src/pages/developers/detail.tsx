import { View, Text, Button, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { developerApi, requestApi, projectApi } from '@/services/api'
import { storage } from '@/utils/storage'
import './detail.scss'

export default function DeveloperDetail() {
  const router = useRouter()
  const developerId = router.params.id
  const [developer, setDeveloper] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [myProjects, setMyProjects] = useState<any[]>([])
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number>(0)
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const user = storage.getUser()

  useEffect(() => {
    if (developerId) {
      loadDeveloper()
    }
    if (user?.role === 'project_owner') {
      loadMyProjects()
    }
  }, [developerId, user])

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

  const loadMyProjects = async () => {
    try {
      const projects = await projectApi.findMyProjects()
      // 只显示招募中的项目
      const openProjects = projects.filter((p: any) => p.status === 'open')
      setMyProjects(openProjects)
    } catch (error) {
      console.log('加载我的项目失败', error)
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

    // 如果没有项目，提示先发布项目
    if (myProjects.length === 0) {
      Taro.showModal({
        title: '发布项目',
        content: '邀请程序员前需要先发布项目，是否前往发布？',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/profile/detail' })
          }
        },
      })
      return
    }

    // 如果只有一个项目，直接邀请；否则显示选择器
    if (myProjects.length === 1) {
      await doInvite(myProjects[0].id)
    } else {
      setShowProjectPicker(true)
    }
  }

  const handleProjectSelect = (e: any) => {
    const index = Number(e.detail.value)
    setSelectedProjectIndex(index)
    setShowProjectPicker(false)
    doInvite(myProjects[index].id)
  }

  const doInvite = async (projectId: string) => {
    setRequesting(true)
    try {
      await requestApi.inviteDeveloper({
        developerId,
        projectId,
      })
      Taro.showToast({ title: '邀请已发送', icon: 'success' })
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
          {showProjectPicker && myProjects.length > 1 ? (
            <Picker
              mode='selector'
              range={myProjects}
              rangeKey='title'
              value={selectedProjectIndex}
              onChange={handleProjectSelect}
              onCancel={() => setShowProjectPicker(false)}
            >
              <Button className='btn-request' loading={requesting}>
                选择项目并邀请
              </Button>
            </Picker>
          ) : (
            <Button
              className='btn-request'
              loading={requesting}
              onClick={handleSendRequest}
            >
              {myProjects.length === 0 ? '先发布项目' : '邀请合伙'}
            </Button>
          )}
        </View>
      )}
    </View>
  )
}


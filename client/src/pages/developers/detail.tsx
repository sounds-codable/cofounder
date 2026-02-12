import { View, Text, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { AtButton, AtTag } from 'taro-ui'
import { developerApi, requestApi, projectApi } from '@/services/api'
import { storage } from '@/utils/storage'
import './detail.scss'

export default function DeveloperDetail() {
  const router = useRouter()
  const [developer, setDeveloper] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [myProjects, setMyProjects] = useState<any[]>([])
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number>(0)
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const user = storage.getUser()

  // 获取 developerId，兼容多种路由模式
  const getDeveloperId = () => {
    return router.params.id || Taro.getCurrentInstance().router?.params?.id || ''
  }

  useEffect(() => {
    const id = getDeveloperId()
    if (id) {
      loadDeveloper(id)
    }
    if (user?.role === 'project_owner') {
      loadMyProjects()
    }
  }, [])

  const loadDeveloper = async (id: string) => {
    setLoading(true)
    try {
      const result = await developerApi.get(id)
      setDeveloper(result)
    } catch (error: any) {
      console.log('加载程序员详情失败:', error)
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const loadMyProjects = async () => {
    try {
      const projects = await projectApi.findMyProjects()
      const openProjects = projects.filter((p: any) => p.status === 'open')
      setMyProjects(openProjects)
    } catch (error) {
      console.log('加载我的项目失败', error)
    }
  }

  const handleSendRequest = async () => {
    if (!user?.basicProfileCompleted) {
      Taro.showModal({
        title: '完善资料',
        content: '邀请合伙前需要完善基础资料，是否前往完善？',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/onboarding/index' })
          }
        },
      })
      return
    }

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
        developerId: getDeveloperId(),
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
        <View className='back-btn' onClick={() => Taro.navigateBack()}>
          <Text className='back-icon'>← 返回</Text>
        </View>
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
              <AtTag key={idx} size='small' circle>{tech}</AtTag>
            ))}
          </View>
        </View>
      )}

      {developer.projectExperience && (
        <View className='detail-section'>
          <Text className='section-label'>项目经历</Text>
          <Text className='section-content'>{developer.projectExperience}</Text>
        </View>
      )}

      {developer.weeklyHours && (
        <View className='detail-section'>
          <Text className='section-label'>每周可投入时间</Text>
          <Text className='section-content'>{developer.weeklyHours}</Text>
        </View>
      )}

      {/* 邀请合伙按钮 - 仅项目方可见 */}
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
              <AtButton type='primary' loading={requesting} circle>
                选择项目并邀请
              </AtButton>
            </Picker>
          ) : (
            <AtButton 
              type='primary' 
              loading={requesting} 
              onClick={handleSendRequest}
              circle
            >
              {myProjects.length === 0 ? '先发布项目' : '🤝 邀请合伙'}
            </AtButton>
          )}
        </View>
      )}
    </View>
  )
}

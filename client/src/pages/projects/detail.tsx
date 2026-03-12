import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { AtButton, AtTag } from 'taro-ui'
import { projectApi, requestApi } from '@/services/api'
import { storage } from '@/utils/storage'
import { clearRequestBadgeCache } from '@/utils/request-badge'
import './detail.scss'

export default function ProjectDetail() {
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const user = storage.getUser()

  const getProjectId = () => {
    return router.params.id || Taro.getCurrentInstance().router?.params?.id || ''
  }

  useEffect(() => {
    const id = getProjectId()
    if (id) {
      loadProject(id)
    }
  }, [])

  const loadProject = async (id?: string) => {
    const projectId = id || getProjectId()
    setLoading(true)
    try {
      const result = await projectApi.get(projectId)
      setProject(result)
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async () => {
    const projectId = getProjectId()
    if (!user?.basicProfileCompleted) {
      Taro.showModal({
        title: '完善资料',
        content: '申请合作前需要完善基础资料，是否前往完善？',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/onboarding/index' })
          }
        },
      })
      return
    }

    setRequesting(true)
    try {
      await requestApi.applyProject({ projectId })
      clearRequestBadgeCache()
      Taro.showToast({ 
        title: '申请已发送！项目方会收到通知', 
        icon: 'success',
        duration: 2000
      })
      setTimeout(() => {
        loadProject()
      }, 500)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '申请失败', icon: 'none' })
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

  if (!project) {
    return (
      <View className='error'>
        <Text>项目不存在</Text>
      </View>
    )
  }

  return (
    <View className='project-detail'>
      <View className='detail-header'>
        <View className='back-btn' onClick={() => Taro.navigateBack()}>
          <Text className='back-icon'>← 返回</Text>
        </View>
        <Text className='detail-title'>{project.title}</Text>
        <View className='detail-meta'>
          <AtTag size='small' type='primary' circle>{project.industry}</AtTag>
          <Text className='detail-time'>
            发布于 {new Date(project.createdAt).toLocaleDateString()}
          </Text>
          {project.applicationCount > 0 && (
            <Text className='detail-count'>{project.applicationCount} 人申请</Text>
          )}
        </View>
      </View>

      <View className='detail-section'>
        <Text className='section-label'>项目介绍</Text>
        <Text className='section-content'>{project.description}</Text>
      </View>

      {project.targetUsers && (
        <View className='detail-section'>
          <Text className='section-label'>目标用户</Text>
          <Text className='section-content'>{project.targetUsers}</Text>
        </View>
      )}

      {project.whySucceed && (
        <View className='detail-section'>
          <Text className='section-label'>为什么这个项目能成</Text>
          <Text className='section-content'>{project.whySucceed}</Text>
        </View>
      )}

      {project.techNeeds?.length > 0 && (
        <View className='detail-section'>
          <Text className='section-label'>需要的技术能力</Text>
          <View className='skill-tags'>
            {project.techNeeds.map((skill: string, idx: number) => (
              <AtTag key={idx} size='small' circle>{skill}</AtTag>
            ))}
          </View>
          {project.techNotes && (
            <Text className='section-content' style={{ marginTop: '12px' }}>{project.techNotes}</Text>
          )}
        </View>
      )}

      {project.mvpPlan && (
        <View className='detail-section'>
          <Text className='section-label'>MVP计划</Text>
          <Text className='section-content'>{project.mvpPlan}</Text>
        </View>
      )}

      {project.cooperationNotes && (
        <View className='detail-section'>
          <Text className='section-label'>合作说明</Text>
          <Text className='section-content'>{project.cooperationNotes}</Text>
        </View>
      )}

      {/* 项目发布者信息 */}
      <View className='detail-section owner-info'>
        <Text className='section-label'>发布者</Text>
        <View 
          className='owner-card clickable'
          onClick={() => {
            if (project.owner?.id) {
              Taro.navigateTo({ url: `/pages/owners/detail?id=${project.owner.id}` })
            }
          }}
        >
          <Text className='owner-name'>{project.owner?.nickname || '匿名'}</Text>
          <Text className='owner-bio'>{project.owner?.bio || '暂无简介'}</Text>
          <Text className='owner-link'>查看详情 →</Text>
        </View>
      </View>

      {/* 申请合作按钮 - 仅程序员可见 */}
      {user?.role === 'developer' && project.status === 'open' && (
        <View className='action-bar'>
          <AtButton 
            type='primary' 
            loading={requesting}
            onClick={handleSendRequest}
            circle
          >
            🤝 申请合作
          </AtButton>
        </View>
      )}
    </View>
  )
}

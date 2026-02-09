import { View, Text, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { projectApi, requestApi } from '@/services/api'
import { storage } from '@/utils/storage'
import './detail.scss'

export default function ProjectDetail() {
  const router = useRouter()
  const projectId = router.params.id
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const user = storage.getUser()

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const loadProject = async () => {
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
      await requestApi.applyProject({ projectId })
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
        <Text className='detail-title'>{project.title}</Text>
        <View className='detail-meta'>
          <Text className='detail-industry'>{project.industry}</Text>
          <Text className='detail-time'>
            发布于 {new Date(project.createdAt).toLocaleDateString()}
          </Text>
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
              <Text key={idx} className='skill-tag'>{skill}</Text>
            ))}
          </View>
          {project.techNotes && (
            <Text className='section-content' style={{ marginTop: '16px' }}>{project.techNotes}</Text>
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
        <View className='owner-card'>
          <Text className='owner-name'>{project.owner?.nickname || '匿名'}</Text>
          <Text className='owner-bio'>{project.owner?.bio || '暂无简介'}</Text>
        </View>
      </View>

      {/* 发送请求按钮 - 仅程序员可见 */}
      {user?.role === 'developer' && (
        <View className='action-bar'>
          <Button
            className='btn-request'
            loading={requesting}
            onClick={handleSendRequest}
          >
            发送合伙请求
          </Button>
        </View>
      )}
    </View>
  )
}


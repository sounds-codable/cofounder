import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { AtTag } from 'taro-ui'
import { projectOwnerApi } from '@/services/api'
import './detail.scss'

export default function OwnerDetail() {
  const router = useRouter()
  const [owner, setOwner] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const getOwnerId = () => {
    return router.params.id || Taro.getCurrentInstance().router?.params?.id || ''
  }

  useEffect(() => {
    const id = getOwnerId()
    if (id) {
      loadOwner(id)
    }
  }, [])

  const loadOwner = async (id: string) => {
    setLoading(true)
    try {
      const result = await projectOwnerApi.get(id)
      setOwner(result.profile)
      setProjects(result.projects || [])
    } catch (error: any) {
      console.log('加载项目方详情失败:', error)
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View className='loading'>
        <Text>加载中...</Text>
      </View>
    )
  }

  if (!owner) {
    return (
      <View className='error'>
        <Text>项目方不存在</Text>
      </View>
    )
  }

  return (
    <View className='owner-detail'>
      <View className='detail-header'>
        <View className='back-btn' onClick={() => Taro.navigateBack()}>
          <Text className='back-icon'>← 返回</Text>
        </View>
        <Text className='owner-avatar'>💼</Text>
        <Text className='owner-name'>{owner.nickname}</Text>
        {owner.industry && (
          <Text className='owner-industry'>{owner.industry}{owner.industryExperience ? ` · ${owner.industryExperience}年经验` : ''}</Text>
        )}
      </View>

      {owner.bio && (
        <View className='detail-section'>
          <Text className='section-label'>个人简介</Text>
          <Text className='section-content'>{owner.bio}</Text>
        </View>
      )}

      {owner.relatedExperience && (
        <View className='detail-section'>
          <Text className='section-label'>行业经历</Text>
          <Text className='section-content'>{owner.relatedExperience}</Text>
        </View>
      )}

      {owner.industryResources && (
        <View className='detail-section'>
          <Text className='section-label'>行业资源</Text>
          <Text className='section-content'>{owner.industryResources}</Text>
        </View>
      )}

      {owner.canProvide?.length > 0 && (
        <View className='detail-section'>
          <Text className='section-label'>能提供</Text>
          <View className='tag-list'>
            {owner.canProvide.map((item: string, idx: number) => (
              <AtTag key={idx} size='small' circle>{item}</AtTag>
            ))}
          </View>
        </View>
      )}

      {owner.education && (
        <View className='detail-section'>
          <Text className='section-label'>学历</Text>
          <Text className='section-content'>{owner.education}</Text>
        </View>
      )}

      {projects.length > 0 && (
        <View className='detail-section'>
          <Text className='section-label'>发布的项目（{projects.length}）</Text>
          <View className='project-list'>
            {projects.map((project: any) => (
              <View 
                key={project.id} 
                className='project-card'
                onClick={() => Taro.navigateTo({ url: `/pages/projects/detail?id=${project.id}` })}
              >
                <Text className='project-title'>{project.title}</Text>
                <View className='project-meta'>
                  <AtTag size='small' circle>{project.industry}</AtTag>
                  {project.applicationCount > 0 && (
                    <Text className='project-applicants'>{project.applicationCount}人申请</Text>
                  )}
                </View>
                <Text className='project-desc'>
                  {project.description?.substring(0, 80)}{project.description?.length > 80 ? '...' : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

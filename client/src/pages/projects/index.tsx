import { View, Text } from '@tarojs/components'
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { AtTag, AtCard } from 'taro-ui'
import { projectApi } from '@/services/api'
import { storage } from '@/utils/storage'
import TabBar from '@/components/TabBar'
import './index.scss'

export default function ProjectList() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const user = storage.getUser()

  useEffect(() => {
    loadProjects()
  }, [])

  useDidShow(() => {
    loadProjects()
  })

  usePullDownRefresh(() => {
    loadProjects().then(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const loadProjects = async () => {
    setLoading(true)
    try {
      const result = await projectApi.list({ limit: 20 })
      setProjects(result.items || [])
    } catch (error) {
      console.log('加载项目失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/projects/detail?id=${id}` })
  }

  return (
    <View className='project-list'>
      <View className='page-header'>
        <Text className='page-title'>项目广场</Text>
        <Text className='page-subtitle'>发现值得合伙的好项目</Text>
      </View>

      {loading ? (
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      ) : projects.length === 0 ? (
        <View className='empty'>
          <Text className='empty-emoji'>📭</Text>
          <Text className='empty-text'>暂无项目</Text>
          {user?.role === 'project_owner' && (
            <Text className='empty-hint'>去个人中心发布您的第一个项目</Text>
          )}
        </View>
      ) : (
        <View className='project-scroll'>
          {projects.map((project) => (
            <View
              key={project.id}
              className='project-card'
              onClick={() => handleViewDetail(project.id)}
            >
              <View className='project-card-top'>
                <Text className='project-title'>{project.title}</Text>
                <AtTag size='small' type='primary' circle>
                  {project.industry}
                </AtTag>
              </View>
              <Text className='project-desc'>
                {project.description?.slice(0, 100)}...
              </Text>
              {project.techNeeds?.length > 0 && (
                <View className='project-skills'>
                  {project.techNeeds.slice(0, 3).map((skill: string, idx: number) => (
                    <AtTag key={idx} size='small' circle>{skill}</AtTag>
                  ))}
                </View>
              )}
              <View className='project-footer'>
                <Text className='project-owner'>
                  {project.owner?.nickname || '匿名'}
                </Text>
                <Text className='project-time'>
                  {new Date(project.createdAt).toLocaleDateString()}
                </Text>
                {project.applicationCount > 0 && (
                  <Text className='project-count'>
                    {project.applicationCount} 人申请
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <TabBar current={0} />
    </View>
  )
}

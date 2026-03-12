import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { projectApi } from '@/services/api'
import { storage } from '@/utils/storage'
import './index.scss'

export default function ProjectList() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const user = storage.getUser()

  useEffect(() => {
    loadProjects()
  }, [])

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

  const goToTab = (page: string) => {
    Taro.redirectTo({ url: `/pages/${page}/index` })
  }

  return (
    <View className='project-list'>
      {/* Tab Navigation */}
      <View className='tabs'>
        <View className='tab active'>项目广场</View>
        <View className='tab' onClick={() => goToTab('developers')}>程序员广场</View>
        <View className='tab' onClick={() => goToTab('requests')}>我的请求</View>
        <View className='tab' onClick={() => goToTab('profile')}>个人中心</View>
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
            <Text className='empty-hint'>点击右下角发布您的第一个项目</Text>
          )}
        </View>
      ) : (
        <ScrollView scrollY className='project-scroll'>
          {projects.map((project) => (
            <View
              key={project.id}
              className='project-card'
              onClick={() => handleViewDetail(project.id)}
            >
              <Text className='project-title'>{project.title}</Text>
              <View className='project-meta'>
                <Text className='project-industry'>{project.industry}</Text>
                <Text className='project-time'>
                  {new Date(project.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text className='project-desc'>
                {project.description?.slice(0, 80)}...
              </Text>
              {project.techNeeds?.length > 0 && (
                <View className='project-skills'>
                  {project.techNeeds.slice(0, 3).map((skill: string, idx: number) => (
                    <Text key={idx} className='skill-tag'>{skill}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* FAB for project owners */}
      {user?.role === 'project_owner' && (
        <View
          className='fab'
          onClick={() => Taro.navigateTo({ url: '/pages/profile/detail' })}
        >
          <Text className='fab-icon'>+</Text>
        </View>
      )}
    </View>
  )
}


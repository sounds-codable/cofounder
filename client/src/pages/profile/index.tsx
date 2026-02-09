import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { storage } from '@/utils/storage'
import { userApi, projectApi } from '@/services/api'
import './index.scss'

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [myProjects, setMyProjects] = useState<any[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (user?.role === 'project_owner') {
      loadMyProjects()
    }
  }, [user?.id])

  useDidShow(() => {
    // 页面显示时刷新数据
    if (user?.role === 'project_owner') {
      loadMyProjects()
    }
  })

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

  const loadMyProjects = async () => {
    setProjectsLoading(true)
    try {
      const projects = await projectApi.findMyProjects()
      setMyProjects(projects || [])
    } catch (error) {
      console.log('加载我的项目失败', error)
    } finally {
      setProjectsLoading(false)
    }
  }

  const handleViewProject = (projectId: string) => {
    Taro.navigateTo({ url: `/pages/projects/detail?id=${projectId}` })
  }

  const handleEditProject = (projectId: string) => {
    Taro.showToast({ 
      title: '编辑功能开发中，请先查看详情', 
      icon: 'none',
      duration: 2000 
    })
    setTimeout(() => {
      Taro.navigateTo({ url: `/pages/projects/detail?id=${projectId}` })
    }, 500)
  }

  const handleCloseProject = async (projectId: string) => {
    Taro.showModal({
      title: '关闭招募',
      content: '确定要关闭该项目的招募吗？关闭后其他用户将无法申请。',
      success: async (res) => {
        if (res.confirm) {
          try {
            await projectApi.closeProject(projectId)
            Taro.showToast({ title: '已关闭', icon: 'success' })
            loadMyProjects()
          } catch (error: any) {
            Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
          }
        }
      },
    })
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

      {/* 我的项目 - 仅项目方 */}
      {user?.role === 'project_owner' && (
        <View className='profile-section'>
          <View className='section-header'>
            <Text className='section-title'>我的项目</Text>
            <Text className='section-count'>{myProjects.length} 个</Text>
          </View>
          
          {projectsLoading ? (
            <View className='info-item'>
              <Text className='info-value'>加载中...</Text>
            </View>
          ) : myProjects.length === 0 ? (
            <View className='info-item'>
              <Text className='info-value incomplete'>暂无项目</Text>
            </View>
          ) : (
            <View className='project-list-mini'>
              {myProjects.slice(0, 3).map((project) => (
                <View key={project.id} className='project-item-mini'>
                  <View className='project-item-header'>
                    <Text className='project-item-title'>{project.title}</Text>
                    <Text className={`project-item-status status-${project.status === 'open' ? 'pending' : project.status === 'matched' ? 'accepted' : 'rejected'}`}>
                      {project.status === 'open' ? '招募中' :
                       project.status === 'matched' ? '已匹配' : '已关闭'}
                    </Text>
                  </View>
                  <View className='project-item-meta'>
                    <Text className='project-item-industry'>{project.industry}</Text>
                    {project.applicationCount > 0 && (
                      <Text className='project-item-count'>📊 {project.applicationCount} 人申请</Text>
                    )}
                  </View>
                  <View className='project-item-actions'>
                    <Text 
                      className='project-item-action'
                      onClick={() => handleViewProject(project.id)}
                    >
                      查看
                    </Text>
                    {project.status === 'open' && (
                      <>
                        <Text 
                          className='project-item-action'
                          onClick={() => handleEditProject(project.id)}
                        >
                          编辑
                        </Text>
                        <Text 
                          className='project-item-action danger'
                          onClick={() => handleCloseProject(project.id)}
                        >
                          关闭
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              ))}
              {myProjects.length > 3 && (
                <View className='info-item'>
                  <Text 
                    className='section-action'
                    onClick={() => Taro.navigateTo({ url: '/pages/requests/index' })}
                  >
                    查看全部 ({myProjects.length} 个) →
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* 发布项目按钮 */}
          <View className='section-action-bar'>
            <Button
              className='btn-publish'
              onClick={() => Taro.navigateTo({ url: '/pages/profile/detail' })}
            >
              ➕ 发布新项目
            </Button>
          </View>
        </View>
      )}

      {/* 程序员：我曾经的项目 */}
      {user?.role === 'developer' && (
        <View className='profile-section'>
          <View className='section-header'>
            <Text className='section-title'>我曾经的项目</Text>
            <Text
              className='section-action'
              onClick={() => Taro.navigateTo({ url: '/pages/profile/detail' })}
            >
              编辑
            </Text>
          </View>
          
          {user?.detailedProjects ? (
            <View className='info-item' style={{ alignItems: 'flex-start' }}>
              <Text className='info-value' style={{ textAlign: 'left', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {user.detailedProjects}
              </Text>
            </View>
          ) : (
            <View className='info-item'>
              <Text className='info-value' style={{ color: '#94a3b8' }}>未填写（选填）</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View className='profile-actions'>
        <Button className='btn-logout' onClick={handleLogout}>
          退出登录
        </Button>
      </View>
    </View>
  )
}


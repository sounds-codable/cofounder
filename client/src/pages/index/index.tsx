import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { storage } from '@/utils/storage'
import { projectApi, developerApi } from '@/services/api'
import './index.scss'

export default function Index() {
  const [projects, setProjects] = useState<any[]>([])
  const [developers, setDevelopers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    // 检查是否已登录
    if (storage.isLoggedIn()) {
      const user = storage.getUser()
      if (user?.basicProfileCompleted) {
        // 已完善基础资料，跳转到项目广场
        Taro.redirectTo({ url: '/pages/projects/index' })
      } else {
        // 未完善基础资料，跳转到onboarding
        Taro.redirectTo({ url: '/pages/onboarding/index' })
      }
    } else {
      // 未登录，获取展示数据
      loadData()
    }
  })

  const loadData = async () => {
    setLoading(false)
    try {
      const [projectsRes, developersRes] = await Promise.all([
        projectApi.list({ limit: 3 }).catch(() => ({ items: [] })),
        developerApi.list({ limit: 3 }).catch(() => ({ items: [] })),
      ])
      setProjects(projectsRes.items || [])
      setDevelopers(developersRes.items || [])
    } catch (error) {
      console.log('获取数据失败', error)
    }
  }

  const handleLogin = (role: string) => {
    Taro.navigateTo({ url: `/pages/login/index?role=${role}` })
  }

  if (loading && storage.isLoggedIn()) {
    return (
      <View className='loading'>
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <View className='index'>
      {/* Hero Section */}
      <View className='hero'>
        <View className='hero-emoji'>🤝</View>
        <Text className='hero-title'>行业专家 × 程序员 = 合伙创业</Text>
        <View className='hero-slogan'>
          <Text className='slogan-item'>不是雇佣，是合伙</Text>
          <Text className='slogan-item'>不谈工资，谈股权</Text>
          <Text className='slogan-item'>先做MVP，再定分配</Text>
        </View>
        
        {/* 登录按钮 - 始终显示 */}
        <View className='hero-actions'>
          <Button 
            className='btn-role btn-owner'
            onClick={() => handleLogin('project_owner')}
          >
            💼 我是项目方
          </Button>
          <Button 
            className='btn-role btn-dev'
            onClick={() => handleLogin('developer')}
          >
            💻 我是程序员
          </Button>
        </View>
      </View>

      {/* How it works */}
      <View className='section how-it-works'>
        <Text className='section-title'>怎么玩？</Text>
        <View className='steps'>
          <View className='step'>
            <Text className='step-num'>1</Text>
            <Text className='step-title'>发布</Text>
            <Text className='step-desc'>项目/简历</Text>
          </View>
          <View className='step-arrow'>→</View>
          <View className='step'>
            <Text className='step-num'>2</Text>
            <Text className='step-title'>匹配</Text>
            <Text className='step-desc'>合伙人</Text>
          </View>
          <View className='step-arrow'>→</View>
          <View className='step'>
            <Text className='step-num'>3</Text>
            <Text className='step-title'>做MVP</Text>
            <Text className='step-desc'>验证合作</Text>
          </View>
          <View className='step-arrow'>→</View>
          <View className='step'>
            <Text className='step-num'>4</Text>
            <Text className='step-title'>合伙</Text>
            <Text className='step-desc'>创业</Text>
          </View>
        </View>
      </View>

      {/* Latest Projects */}
      {projects.length > 0 && (
        <View className='section'>
          <Text className='section-title'>🔥 最新项目</Text>
          {projects.map((project) => (
            <View key={project.id} className='preview-card'>
              <Text className='preview-title'>{project.title}</Text>
              <View className='preview-info'>
                <Text className='preview-tag'>{project.industry}</Text>
                <Text className='preview-time'>
                  {new Date(project.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text className='preview-desc'>
                {project.description?.slice(0, 50)}...
              </Text>
            </View>
          ))}
          <Button className='btn-more' onClick={() => handleLogin('developer')}>
            查看更多项目 →
          </Button>
        </View>
      )}

      {/* Active Developers */}
      {developers.length > 0 && (
        <View className='section'>
          <Text className='section-title'>💻 活跃程序员</Text>
          {developers.map((dev) => (
            <View key={dev.id} className='preview-card'>
              <Text className='preview-title'>{dev.nickname}</Text>
              <View className='preview-info'>
                <Text className='preview-tag'>{dev.techDirections?.join(' · ')}</Text>
                <Text className='preview-tag'>{dev.workYears}年经验</Text>
              </View>
              <Text className='preview-desc'>
                {dev.bio?.slice(0, 50)}...
              </Text>
            </View>
          ))}
          <Button className='btn-more' onClick={() => handleLogin('project_owner')}>
            查看更多程序员 →
          </Button>
        </View>
      )}

      {/* Footer */}
      <View className='footer'>
        <Text className='footer-text'>© 2026 合伙造 - 让创业合伙更简单</Text>
      </View>
    </View>
  )
}


import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { developerApi } from '@/services/api'
import { storage } from '@/utils/storage'
import './index.scss'

export default function DeveloperList() {
  const [developers, setDevelopers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const user = storage.getUser()

  useEffect(() => {
    loadDevelopers()
  }, [])

  usePullDownRefresh(() => {
    loadDevelopers().then(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const loadDevelopers = async () => {
    setLoading(true)
    try {
      const result = await developerApi.list({ limit: 20 })
      setDevelopers(result.items || [])
    } catch (error) {
      console.log('加载程序员失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/developers/detail?id=${id}` })
  }

  const goToTab = (page: string) => {
    Taro.redirectTo({ url: `/pages/${page}/index` })
  }

  return (
    <View className='developer-list'>
      {/* Tab Navigation */}
      <View className='tabs'>
        <View className='tab' onClick={() => goToTab('projects')}>项目广场</View>
        <View className='tab active'>程序员广场</View>
        <View className='tab' onClick={() => goToTab('requests')}>我的请求</View>
        <View className='tab' onClick={() => goToTab('profile')}>个人中心</View>
      </View>

      {loading ? (
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      ) : developers.length === 0 ? (
        <View className='empty'>
          <Text className='empty-emoji'>👨‍💻</Text>
          <Text className='empty-text'>暂无程序员入驻</Text>
        </View>
      ) : (
        <ScrollView scrollY className='developer-scroll'>
          {developers.map((dev) => (
            <View
              key={dev.id}
              className='developer-card'
              onClick={() => handleViewDetail(dev.id)}
            >
              <View className='dev-header'>
                <Text className='dev-avatar'>👨‍💻</Text>
                <View className='dev-info'>
                  <Text className='dev-name'>{dev.nickname}</Text>
                  <Text className='dev-exp'>{dev.workYears || '?'}年经验</Text>
                </View>
              </View>
              
              {dev.techDirections?.length > 0 && (
                <View className='dev-techs'>
                  {dev.techDirections.slice(0, 3).map((tech: string, idx: number) => (
                    <Text key={idx} className='tech-tag'>{tech}</Text>
                  ))}
                </View>
              )}

              {dev.bio && (
                <Text className='dev-bio'>
                  {dev.bio.slice(0, 60)}...
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}


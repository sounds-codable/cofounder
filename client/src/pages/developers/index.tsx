import { View, Text } from '@tarojs/components'
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { AtTag } from 'taro-ui'
import { developerApi } from '@/services/api'
import { storage } from '@/utils/storage'
import TabBar from '@/components/TabBar'
import './index.scss'

export default function DeveloperList() {
  const [developers, setDevelopers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDevelopers()
  }, [])

  useDidShow(() => {
    loadDevelopers()
  })

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

  return (
    <View className='developer-list'>
      <View className='page-header'>
        <Text className='page-title'>程序员广场</Text>
        <Text className='page-subtitle'>找到你的技术合伙人</Text>
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
        <View className='developer-scroll'>
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
                  {dev.techDirections.slice(0, 4).map((tech: string, idx: number) => (
                    <AtTag key={idx} size='small' circle>{tech}</AtTag>
                  ))}
                </View>
              )}

              {dev.bio && (
                <Text className='dev-bio'>
                  {dev.bio.slice(0, 80)}...
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      <TabBar current={1} />
    </View>
  )
}

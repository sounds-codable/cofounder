import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { AtTabBar } from 'taro-ui'
import { getPendingRequestCount } from '@/utils/request-badge'
import { storage } from '@/utils/storage'

interface TabBarProps {
  current: number
}

const tabList = [
  { title: '项目广场', iconType: 'bullet-list' },
  { title: '程序员', iconType: 'user' },
  { title: '我的请求', iconType: 'message' },
  { title: '个人中心', iconType: 'settings' },
]

const tabPages = [
  '/pages/projects/index',
  '/pages/developers/index',
  '/pages/requests/index',
  '/pages/profile/index',
]

export default function TabBar({ current }: TabBarProps) {
  const [pendingCount, setPendingCount] = useState(0)
  const user = storage.getUser()

  useEffect(() => {
    if (user) {
      loadPendingCount()
    }
  }, [])

  const loadPendingCount = async () => {
    const count = await getPendingRequestCount()
    setPendingCount(count)
  }

  const handleClick = (index: number) => {
    if (index !== current) {
      Taro.redirectTo({ url: tabPages[index] })
    }
  }

  const tabListWithBadge = tabList.map((tab, index) => {
    if (index === 2 && pendingCount > 0) {
      return { ...tab, text: String(pendingCount) }
    }
    return tab
  })

  return (
    <View className='tab-bar-wrapper'>
      <AtTabBar
        fixed
        tabList={tabListWithBadge}
        onClick={handleClick}
        current={current}
        color='#94a3b8'
        selectedColor='#2563eb'
      />
    </View>
  )
}

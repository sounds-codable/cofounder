import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { requestApi } from '@/services/api'
import { storage } from '@/utils/storage'
import { clearRequestBadgeCache } from '@/utils/request-badge'
import './index.scss'

export default function Requests() {
  const user = storage.getUser()
  const [activeTab, setActiveTab] = useState(0)
  const [receivedRequests, setReceivedRequests] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useDidShow(() => {
    loadData()
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [received, sent] = await Promise.all([
        requestApi.received().catch(() => []),
        requestApi.sent().catch(() => []),
      ])
      setReceivedRequests(Array.isArray(received) ? received : [])
      setSentRequests(Array.isArray(sent) ? sent : [])
    } catch (error) {
      console.log('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const pendingCount = receivedRequests.filter((r: any) => r.status === 'pending').length

  const handleAccept = async (id: string) => {
    try {
      await requestApi.accept(id)
      clearRequestBadgeCache()
      Taro.showToast({ title: '已接受', icon: 'success' })
      loadData()
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
    }
  }

  const handleReject = async (id: string) => {
    try {
      await requestApi.reject(id)
      clearRequestBadgeCache()
      Taro.showToast({ title: '已拒绝', icon: 'success' })
      loadData()
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
    }
  }

  const currentRequests = activeTab === 0 ? receivedRequests : sentRequests

  const goToTab = (page: string) => {
    Taro.redirectTo({ url: `/pages/${page}/index` })
  }

  return (
    <View className='requests'>
      <View className='tabs'>
        <View className='tab' onClick={() => goToTab('projects')}>项目广场</View>
        <View className='tab' onClick={() => goToTab('developers')}>程序员广场</View>
        <View className='tab active'>我的请求</View>
        <View className='tab' onClick={() => goToTab('profile')}>个人中心</View>
      </View>

      <View className='segment-wrapper'>
        <View className={`segment-item ${activeTab === 0 ? 'active' : ''}`} onClick={() => setActiveTab(0)}>
          收到的 ({receivedRequests.length}){pendingCount > 0 ? ' 🔴' : ''}
        </View>
        <View className={`segment-item ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>
          发出的 ({sentRequests.length})
        </View>
      </View>

      {loading ? (
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      ) : currentRequests.length === 0 ? (
        <View className='empty'>
          <Text className='empty-emoji'>📭</Text>
          <Text className='empty-text'>
            {activeTab === 0 ? '暂无收到的请求' : '暂无发出的请求'}
          </Text>
        </View>
      ) : (
        <View className='request-list'>
          {currentRequests.map((request) => (
            <View key={request.id} className='request-card'>
              <View className='request-header'>
                <Text className='request-avatar'>
                  {request.sender?.role === 'developer' ? '👨‍💻' : '💼'}
                </Text>
                <View className='request-info'>
                  <Text 
                    className='request-name clickable'
                    onClick={(e) => {
                      e.stopPropagation()
                      const targetUser = activeTab === 0 ? request.sender : request.receiver
                      if (targetUser?.id) {
                        if (targetUser.role === 'developer') {
                          Taro.navigateTo({ url: `/pages/developers/detail?id=${targetUser.id}` })
                        } else if (targetUser.role === 'project_owner') {
                          Taro.navigateTo({ url: `/pages/owners/detail?id=${targetUser.id}` })
                        }
                      }
                    }}
                  >
                    {activeTab === 0 
                      ? request.sender?.nickname 
                      : request.receiver?.nickname || request.project?.title}
                    {' →'}
                  </Text>
                  {request.project && (
                    <Text 
                      className='request-project clickable'
                      onClick={(e) => {
                        e.stopPropagation()
                        Taro.navigateTo({ url: `/pages/projects/detail?id=${request.project.id}` })
                      }}
                    >
                      📋 {request.project.title} →
                    </Text>
                  )}
                  <Text className='request-time'>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text className={`request-status status-${request.status}`}>
                  {request.status === 'pending' ? '待处理' :
                   request.status === 'accepted' ? '已接受' : '已拒绝'}
                </Text>
              </View>

              {request.message && (
                <Text className='request-message'>{request.message}</Text>
              )}

              {activeTab === 0 && request.status === 'pending' && (
                <View className='request-actions'>
                  <Button className='btn-accept' onClick={() => handleAccept(request.id)}>
                    接受
                  </Button>
                  <Button className='btn-reject' onClick={() => handleReject(request.id)}>
                    拒绝
                  </Button>
                </View>
              )}

              {request.status === 'accepted' && (
                <View className='contact-info'>
                  <Text className='contact-label'>📧 联系邮箱：</Text>
                  <Text className='contact-value'>
                    {activeTab === 0 
                      ? request.sender?.email 
                      : request.receiver?.email || '待对方接受后显示'}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

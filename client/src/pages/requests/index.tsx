import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { requestApi } from '@/services/api'
import { storage } from '@/utils/storage'
import './index.scss'

export default function Requests() {
  const user = storage.getUser()
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [receivedRequests, setReceivedRequests] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

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

  const handleAccept = async (id: string) => {
    try {
      await requestApi.accept(id)
      Taro.showToast({ title: '已接受', icon: 'success' })
      loadData()
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
    }
  }

  const handleReject = async (id: string) => {
    try {
      await requestApi.reject(id)
      Taro.showToast({ title: '已拒绝', icon: 'success' })
      loadData()
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
    }
  }


  const goToTab = (page: string) => {
    Taro.redirectTo({ url: `/pages/${page}/index` })
  }

  const currentRequests = activeTab === 'received' ? receivedRequests : sentRequests

  return (
    <View className='requests'>
      {/* Tab Navigation */}
      <View className='tabs'>
        <View className='tab' onClick={() => goToTab('projects')}>项目广场</View>
        <View className='tab' onClick={() => goToTab('developers')}>程序员广场</View>
        <View className='tab active'>我的请求</View>
        <View className='tab' onClick={() => goToTab('profile')}>个人中心</View>
      </View>

      {/* Sub Tabs */}
      <View className='sub-tabs'>
        <View
          className={`sub-tab ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          收到的 ({receivedRequests.length})
        </View>
        <View
          className={`sub-tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
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
            {activeTab === 'received' ? '暂无收到的请求' : '暂无发出的请求'}
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
                  <Text className='request-name'>
                    {activeTab === 'received' 
                      ? request.sender?.nickname 
                      : request.receiver?.nickname || request.project?.title}
                  </Text>
                  {request.project && (
                    <Text className='request-time' style={{ fontSize: '12px', marginTop: '2px' }}>
                      项目：{request.project.title}
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

              {activeTab === 'received' && request.status === 'pending' && (
                <View className='request-actions'>
                  <Button
                    className='btn-accept'
                    onClick={() => handleAccept(request.id)}
                  >
                    接受
                  </Button>
                  <Button
                    className='btn-reject'
                    onClick={() => handleReject(request.id)}
                  >
                    拒绝
                  </Button>
                </View>
              )}

              {request.status === 'accepted' && (
                <View className='contact-info'>
                  <Text className='contact-label'>📧 联系邮箱：</Text>
                  <Text className='contact-value'>
                    {activeTab === 'received' 
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


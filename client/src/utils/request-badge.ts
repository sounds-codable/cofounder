import { requestApi } from '@/services/api'
import { storage } from './storage'

let cachedPendingCount: number | null = null
let cacheTime: number = 0
const CACHE_DURATION = 30000 // 30秒缓存

/**
 * 获取待处理的申请数量（仅项目方）
 * 带缓存，避免频繁请求
 */
export async function getPendingRequestCount(): Promise<number> {
  const user = storage.getUser()
  
  // 只有项目方才有待处理的申请
  if (user?.role !== 'project_owner') {
    return 0
  }

  // 检查缓存
  const now = Date.now()
  if (cachedPendingCount !== null && (now - cacheTime) < CACHE_DURATION) {
    return cachedPendingCount
  }

  try {
    const received = await requestApi.received()
    const pending = Array.isArray(received) 
      ? received.filter((r: any) => r.status === 'pending').length
      : 0
    
    cachedPendingCount = pending
    cacheTime = now
    return pending
  } catch (error) {
    console.log('获取待处理申请数量失败', error)
    return cachedPendingCount || 0
  }
}

/**
 * 清除缓存（当有新的申请或处理了申请后调用）
 */
export function clearRequestBadgeCache() {
  cachedPendingCount = null
  cacheTime = 0
}



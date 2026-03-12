import { requestApi } from '@/services/api'
import { storage } from './storage'

let cachedPendingCount: number | null = null
let cacheTime: number = 0
const CACHE_DURATION = 30000

export async function getPendingRequestCount(): Promise<number> {
  const user = storage.getUser()
  
  if (!user) {
    return 0
  }

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

export function clearRequestBadgeCache() {
  cachedPendingCount = null
  cacheTime = 0
}

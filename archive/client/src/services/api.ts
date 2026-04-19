import Taro from '@tarojs/taro'
import { storage } from '@/utils/storage'

const API_PREFIX = '/api'
const API_BASE_FROM_ENV = process.env.TARO_APP_API_BASE || ''
const IS_WEAPP = process.env.TARO_ENV === 'weapp'
const BASE_URL = (() => {
  if (API_BASE_FROM_ENV) {
    return `${API_BASE_FROM_ENV.replace(/\/$/, '')}${API_PREFIX}`
  }

  // 微信小程序不支持 H5 相对路径代理，开发环境默认直连本地后端
  if (IS_WEAPP) {
    return `http://localhost:3010${API_PREFIX}`
  }

  return API_PREFIX
})()

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  header?: Record<string, string>
}

const normalizeRole = (role?: string) => {
  if (role === 'expert' || role === 'project_owner') return 'project_owner'
  return 'developer'
}

const cleanPlaceholderText = (value: any) => {
  if (typeof value !== 'string') return ''
  return value
    .replace(/（待完善）/g, '')
    .replace(/待补充教育背景/g, '')
    .replace(/待补充工作背景/g, '')
    .trim()
}

const normalizeEducationForSubmit = (value: any) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (raw.length >= 4) return raw

  const map: Record<string, string> = {
    '博士': '博士研究生',
    '硕士': '硕士研究生',
    '本科': '大学本科',
    '大专': '大学专科',
    '中专': '中等专科',
  }

  return map[raw] || `${raw}学历`
}

const normalizeMeProfile = (payload: any, previous: any = {}) => {
  if (!payload?.user) return payload

  const role = normalizeRole(payload.card?.role)
  const strengths = Array.isArray(payload.card?.strengths) ? payload.card.strengths : []
  const detailedProfile = payload.user?.detailedProfile || {}
  const detailedProfileCompleted = Boolean(payload.user?.detailedProfileCompletedAt)
  const contactMethods = Array.isArray(payload.contactMethods) ? payload.contactMethods : []
  const phone = contactMethods.find((item: any) => item?.type === 'phone')?.value || previous?.phone || ''
  const wechat = contactMethods.find((item: any) => item?.type === 'wechat')?.value || previous?.wechat || ''
  const emailFromContact = contactMethods.find((item: any) => item?.type === 'email')?.value || ''

  return {
    id: payload.user.id,
    email: payload.user.email || emailFromContact || previous?.email || '',
    role,
    nickname: payload.user.displayName || '',
    displayName: payload.user.displayName || '',
    realName: previous?.realName || payload.user.displayName || '',
    bio: payload.card?.basicSummary || '',
    city: detailedProfile.city || payload.card?.city || previous?.city || '',
    phone,
    wechat,
    industry: role === 'project_owner' ? (payload.card?.optionalDirection || strengths[0] || '') : '',
    techDirections: role === 'developer' ? strengths : [],
    detailedProjects: detailedProfile.developerProjectExperience || detailedProfile.projectDetail || previous?.detailedProjects || '',
    industryResources: detailedProfile.expertProjectDetail || detailedProfile.projectDetail || previous?.industryResources || '',
    workExperienceDesc: cleanPlaceholderText(detailedProfile.workExperienceDesc) || previous?.workExperienceDesc || '',
    education: cleanPlaceholderText(detailedProfile.education) || previous?.education || '',
    company: detailedProfile.company || previous?.company || '',
    position: detailedProfile.position || previous?.position || '',
    employmentStatus: detailedProfile.employmentStatus || previous?.employmentStatus || '',
    school: detailedProfile.school || previous?.school || '',
    major: detailedProfile.major || previous?.major || '',
    weeklyHours: detailedProfile.weeklyHours || previous?.weeklyHours || '',
    workYears: detailedProfile.workYears || previous?.workYears || '',
    techStack: detailedProfile.techStack || (role === 'developer' ? (Array.isArray(strengths) ? strengths.join(', ') : previous?.techStack || '') : ''),
    github: detailedProfile.github || previous?.github || '',
    relatedExperience: detailedProfile.relatedExperience || previous?.relatedExperience || '',
    canProvide: typeof detailedProfile.canProvide === 'string'
      ? detailedProfile.canProvide.split(/[、,，]/).map((item: string) => item.trim()).filter(Boolean)
      : (Array.isArray(previous?.canProvide) ? previous.canProvide : []),
    interestedIndustries: typeof detailedProfile.interestedIndustries === 'string'
      ? detailedProfile.interestedIndustries.split(/[、,，]/).map((item: string) => item.trim()).filter(Boolean)
      : (Array.isArray(previous?.interestedIndustries) ? previous.interestedIndustries : []),
    detailedProfileCompleted,
    basicProfileCompleted: Boolean(payload.card),
    detailedProfileCompletedAt: payload.user.detailedProfileCompletedAt || null,
    card: payload.card || null,
    contactMethods,
    rawProfile: payload,
  }
}

const buildBasicProfilePayload = (data: any, currentUser: any) => {
  const role = normalizeRole(currentUser?.role)
  const strengths =
    Array.isArray(data?.techDirections) && data.techDirections.length > 0
      ? data.techDirections
      : role === 'project_owner' && data?.industry
        ? [data.industry]
        : Array.isArray(currentUser?.techDirections) && currentUser.techDirections.length > 0
          ? currentUser.techDirections
          : ['待补充']

  return {
    role: role === 'project_owner' ? 'expert' : 'developer',
    headline: (data?.nickname || currentUser?.nickname || currentUser?.displayName || '未命名').slice(0, 200),
    basicSummary: (data?.bio || currentUser?.bio || '待补充简介').slice(0, 2000),
    city: (data?.city || currentUser?.city || '未填写').slice(0, 120),
    desiredDirection:
      role === 'project_owner'
        ? (data?.industry || data?.desiredDirection || currentUser?.industry || undefined)
        : (data?.desiredDirection || undefined),
    strengths: strengths.map((item: string) => item?.trim()).filter(Boolean).slice(0, 8),
  }
}

const buildDetailProfilePayload = (data: any) => {
  const intro = (data?.intro || `${data?.realName || ''} ${data?.bio || ''}`.trim() || '待补充个人简介').trim()
  const education = normalizeEducationForSubmit(
    data?.education ||
    [data?.school, data?.major].filter(Boolean).join(' / ') ||
    '教育信息待补充'
  )
  const experience = (data?.experience || [data?.company, data?.position, data?.employmentStatus].filter(Boolean).join(' / ') || '工作信息待补充').trim()

  return {
    intro: intro.length >= 6 ? intro : `${intro}（待完善）`,
    education,
    experience,
    expertProjectDetail: data?.industryResources || data?.relatedExperience || data?.projectDetail || undefined,
    developerProjectExperience: data?.detailedProjects || data?.projectExperience || data?.projectDetail || undefined,
    projectDetail: data?.projectDetail || data?.detailedProjects || data?.industryResources || undefined,
    company: data?.company || undefined,
    position: data?.position || undefined,
    employmentStatus: data?.employmentStatus || undefined,
    workExperienceDesc: data?.workExperienceDesc || undefined,
    weeklyHours: data?.weeklyHours || undefined,
    techStack: data?.techStack || undefined,
    github: data?.github || undefined,
    interestedIndustries: Array.isArray(data?.interestedIndustries) ? data.interestedIndustries.join('、') : undefined,
    canProvide: Array.isArray(data?.canProvide) ? data.canProvide.join('、') : undefined,
    relatedExperience: data?.relatedExperience || undefined,
    school: data?.school || undefined,
    major: data?.major || undefined,
    city: data?.city || undefined,
    workYears: data?.workYears ? String(data.workYears) : undefined,
  }
}

const mapCardToProject = (card: any) => {
  if (!card) return null

  return {
    id: card.id,
    title: card.headline || '未命名项目',
    industry: card.optionalDirection || card.strengths?.[0] || '未分类',
    description: card.basicSummary || '',
    targetUsers: card.detailPreview?.projectDetail || '',
    whySucceed: '',
    techNeeds: Array.isArray(card.strengths) ? card.strengths : [],
    techNotes: '',
    mvpPlan: card.detailPreview?.expertProjectDetail || '',
    cooperationNotes: '',
    createdAt: card.updatedAt,
    updatedAt: card.updatedAt,
    status: 'open',
    applicationCount: 0,
    owner: {
      id: card.ownerId,
      nickname: card.ownerName,
      bio: card.detailPreview?.intro || '',
    },
    rawCard: card,
  }
}

const buildCardPayload = (data: any, currentUser: any) => {
  const strengths =
    Array.isArray(data?.techNeeds) && data.techNeeds.length > 0
      ? data.techNeeds
      : Array.isArray(currentUser?.techDirections) && currentUser.techDirections.length > 0
        ? currentUser.techDirections
        : [data?.industry].filter(Boolean)

  return {
    headline: (data?.title || data?.headline || currentUser?.nickname || currentUser?.displayName || '未命名项目').slice(0, 200),
    basicSummary: (data?.description || data?.projectDesc || currentUser?.bio || '待补充项目简介').slice(0, 2000),
    city: (currentUser?.city || '未填写').slice(0, 120),
    strengths: strengths.map((item: string) => item?.trim()).filter(Boolean).slice(0, 8),
  }
}

const mapRequestStatus = (status?: string) => {
  if (status === 'rejected') return 'rejected'
  if (status === 'approved_detail_visible' || status === 'contact_exchanged' || status === 'requester_declined_contact') {
    return 'accepted'
  }
  return 'pending'
}

const extractEmail = (contactMethods?: Array<{ type?: string; value?: string }>) => {
  if (!Array.isArray(contactMethods)) return ''
  return contactMethods.find((item) => item?.type === 'email')?.value || ''
}

const mapIncomingRequest = (item: any) => ({
  id: item.id,
  status: mapRequestStatus(item.status),
  message: item.requester?.detailedProfile?.intro || '',
  createdAt: item.createdAt,
  project: item.targetCard
    ? {
        id: item.targetCard.id,
        title: item.targetCard.headline,
      }
    : null,
  sender: item.requester
    ? {
        id: item.requester.id,
        role: 'developer',
        nickname: item.requester.displayName,
        email: extractEmail(item.requester.contactMethods),
      }
    : null,
})

const mapOutgoingRequest = (item: any) => ({
  id: item.id,
  status: mapRequestStatus(item.status),
  message: item.requesterSubmittedDetail?.intro || '',
  createdAt: item.createdAt,
  project: item.targetCard
    ? {
        id: item.targetCard.id,
        title: item.targetCard.headline,
      }
    : null,
  receiver: item.publisher
    ? {
        id: item.publisher.id,
        role: 'project_owner',
        nickname: item.publisher.displayName,
        email: extractEmail(item.publisher.contactMethods),
      }
    : null,
})

async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const token = storage.getToken()
  const requestConfig = {
    url: `${BASE_URL}${url}`,
    method: options.method || 'GET',
    data: options.data,
    timeout: 15000,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.header,
    },
  } as const

  let response: any
  try {
    response = await Taro.request(requestConfig)
  } catch (error: any) {
    const message = String(error?.errMsg || error?.message || '')
    if (message.toLowerCase().includes('timeout')) {
      // 网络波动时重试一次，提升保存成功率
      response = await Taro.request(requestConfig)
    } else {
      throw error
    }
  }

  if (response.statusCode === 401) {
    storage.clear()
    Taro.redirectTo({ url: '/pages/login/index' })
    throw new Error('登录已过期，请重新登录')
  }

  if (response.statusCode >= 400) {
    throw new Error(response.data?.message || '请求失败')
  }

  return response.data
}

// Auth API
export const authApi = {
  sendCode: (email: string, inviteCode?: string) => 
    request('/auth/send-code', { method: 'POST', data: { email, inviteCode } }),
  
  verify: (email: string, code: string) =>
    request<{ accessToken: string; user: any }>('/auth/verify-code', {
      method: 'POST',
      data: { email, code },
    }),
}

// User API  
export const userApi = {
  getProfile: async () => {
    const cachedUser = storage.getUser()
    const profile = await request('/me')
    return normalizeMeProfile(profile, cachedUser)
  },
  
  updateBasicProfile: (data: any) => {
    const user = storage.getUser()
    const payload = buildBasicProfilePayload(data, user)
    const mergedPrevious = { ...user, weeklyHours: data?.weeklyHours || user?.weeklyHours || '', workYears: data?.workYears || user?.workYears || '' }
    return request('/me/basic', { method: 'PUT', data: payload }).then((profile) => normalizeMeProfile(profile, mergedPrevious))
  },
  
  updateDetailedProfile: (data: any) => {
    const user = storage.getUser()
    const payload = buildDetailProfilePayload(data)
    return request('/me/detail', { method: 'PUT', data: payload }).then((profile) => normalizeMeProfile(profile, user))
  },

  updateContactMethods: (data: { phone?: string; wechat?: string; email?: string; other?: string }) => {
    const user = storage.getUser()
    return request('/me/contacts', { method: 'PUT', data }).then((profile) => normalizeMeProfile(profile, user))
  },
}

// Project API
export const projectApi = {
  list: async () => {
    const cards = await request<any[]>('/platform/cards', {
      method: 'GET',
      data: { role: 'expert' },
    })

    const items = (cards || []).map((card) => mapCardToProject(card)).filter(Boolean)
    return { items, total: items.length }
  },
  
  get: async (id: string) => {
    const card = await request<any>(`/platform/cards/${id}`)
    return mapCardToProject(card)
  },
  
  create: async (data: any) => {
    const currentUser = storage.getUser()
    const payload = buildCardPayload(data, currentUser)
    let latestProfile: any = null
    let existingCardId = currentUser?.card?.id

    // 先实时拉取一次，避免用到本地过期的 cardId（常见于数据重置后）
    try {
      latestProfile = await request('/me')
      const normalizedLatestProfile = normalizeMeProfile(latestProfile, currentUser)
      storage.setUser(normalizedLatestProfile)
      existingCardId = normalizedLatestProfile?.card?.id || existingCardId
    } catch {
      // 拉取失败时继续使用本地缓存兜底
    }

    if (existingCardId) {
      try {
        const updated = await request(`/me/card/${existingCardId}`, { method: 'PUT', data: payload })
        return mapCardToProject(updated)
      } catch (error: any) {
        // 卡片不存在时自动降级为新建，避免用户“发布项目”被卡死
        const message = String(error?.message || '')
        if (!message.includes('不存在') && !message.includes('Not Found') && !message.includes('404')) {
          throw error
        }
      }
    }

    const createdProfile = await request('/me/basic', {
      method: 'PUT',
      data: {
        role: 'expert',
        ...payload,
        desiredDirection: data?.industry || undefined,
      },
    })

    const normalized = normalizeMeProfile(createdProfile, currentUser)
    storage.setUser(normalized)
    return normalized.card ? mapCardToProject(normalized.card) : null
  },
  
  update: (id: string, data: any) =>
    request(`/me/card/${id}`, {
      method: 'PUT',
      data: buildCardPayload(data, storage.getUser()),
    }).then((card) => mapCardToProject(card)),
  
  delete: (id: string) =>
    request(`/me/card/${id}`, { method: 'DELETE' }),

  findMyProjects: () =>
    request('/me').then((profile) => {
      const normalized = normalizeMeProfile(profile, storage.getUser())
      return normalized.card ? [mapCardToProject(normalized.card)] : []
    }),

  closeProject: (id: string) =>
    request(`/me/card/${id}`, { method: 'DELETE' }),
}

// Developer API
export const developerApi = {
  list: (params?: { page?: number; limit?: number; techDirection?: string }) =>
    request<{ items: any[]; total: number }>('/developers', {
      method: 'GET', 
      data: params,
    }),
  
  get: (id: string) => request(`/developers/${id}`),
}

// Project Owner API
export const projectOwnerApi = {
  get: (id: string) => request<{ profile: any; projects: any[] }>(`/project-owners/${id}`),
}

// Request API
export const requestApi = {
  applyProject: (data: { projectId: string; message?: string }) =>
    request('/requests', {
      method: 'POST',
      data: { cardId: data.projectId, intro: data.message || undefined },
    }),

  inviteDeveloper: (data: { developerId: string; projectId: string; message?: string }) =>
    request('/requests', {
      method: 'POST',
      data: { cardId: data.projectId, intro: data.message || undefined },
    }),

  received: () =>
    request<{ incoming: any[]; outgoing: any[] }>('/requests').then((res) =>
      Array.isArray(res?.incoming) ? res.incoming.map(mapIncomingRequest) : []
    ),

  sent: () =>
    request<{ incoming: any[]; outgoing: any[] }>('/requests').then((res) =>
      Array.isArray(res?.outgoing) ? res.outgoing.map(mapOutgoingRequest) : []
    ),

  accept: (id: string) =>
    request(`/requests/${id}/approve`, { method: 'POST' }),

  reject: (id: string) =>
    request(`/requests/${id}/reject`, {
      method: 'POST',
      data: { reason: '暂不合作' },
    }),

  getContactInfo: (id: string) =>
    request(`/requests/${id}/exchange-contact`, { method: 'POST' }),
}

// Waitlist API
export const waitlistApi = {
  subscribe: (email: string) =>
    request<{ success: boolean; message: string }>('/waitlist/subscribe', {
      method: 'POST',
      data: { email },
    }),
}


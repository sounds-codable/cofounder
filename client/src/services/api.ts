import Taro from '@tarojs/taro'
import { storage } from '@/utils/storage'

const BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api' 
  : '/api'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  header?: Record<string, string>
}

async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const token = storage.getToken()
  
  const response = await Taro.request({
    url: `${BASE_URL}${url}`,
    method: options.method || 'GET',
    data: options.data,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.header,
    },
  })

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
  sendCode: (email: string, role: string) => 
    request('/auth/send-code', { method: 'POST', data: { email, role } }),
  
  verify: (email: string, code: string, role: string) =>
    request<{ access_token: string; user: any }>('/auth/verify', {
      method: 'POST',
      data: { email, code, role },
    }),
}

// User API  
export const userApi = {
  getProfile: () => request('/users/profile'),
  
  updateBasicProfile: (data: any) => {
    const user = storage.getUser()
    const rolePath = user?.role === 'project_owner' ? 'project-owner' : 'developer'
    return request(`/users/profile/basic/${rolePath}`, { method: 'PUT', data })
  },
  
  updateDetailedProfile: (data: any) => {
    const user = storage.getUser()
    const rolePath = user?.role === 'project_owner' ? 'project-owner' : 'developer'
    return request(`/users/profile/detail/${rolePath}`, { method: 'PUT', data })
  },
}

// Project API
export const projectApi = {
  list: (params?: { page?: number; limit?: number; industry?: string }) =>
    request<{ items: any[]; total: number }>('/projects', {
      method: 'GET',
      data: params,
    }),
  
  get: (id: string) => request(`/projects/${id}`),
  
  create: (data: any) =>
    request('/projects', { method: 'POST', data }),
  
  update: (id: string, data: any) =>
    request(`/projects/${id}`, { method: 'PUT', data }),
  
  delete: (id: string) =>
    request(`/projects/${id}`, { method: 'DELETE' }),

  findMyProjects: () =>
    request<any[]>('/projects/my'),

  closeProject: (id: string) =>
    request(`/projects/${id}/close`, { method: 'PATCH' }),
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
    request('/requests/apply', { method: 'POST', data }),

  inviteDeveloper: (data: { developerId: string; projectId: string; message?: string }) =>
    request('/requests/invite', { method: 'POST', data }),

  received: () =>
    request<any[]>('/requests/received'),

  sent: () =>
    request<any[]>('/requests/sent'),

  accept: (id: string) =>
    request(`/requests/${id}/accept`, { method: 'PATCH' }),

  reject: (id: string) =>
    request(`/requests/${id}/reject`, { method: 'PATCH' }),

  getContactInfo: (id: string) =>
    request<{ realName: string; phone: string; wechat: string; city: string }>(`/requests/${id}/contact`),
}

// Waitlist API
export const waitlistApi = {
  subscribe: (email: string) =>
    request<{ success: boolean; message: string }>('/waitlist/subscribe', {
      method: 'POST',
      data: { email },
    }),
}


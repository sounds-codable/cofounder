import Taro from '@tarojs/taro'

const STORAGE_KEYS = {
  TOKEN: 'hehuozao_token',
  USER: 'hehuozao_user',
}

export const storage = {
  getToken(): string | null {
    return Taro.getStorageSync(STORAGE_KEYS.TOKEN) || null
  },

  setToken(token: string): void {
    Taro.setStorageSync(STORAGE_KEYS.TOKEN, token)
  },

  removeToken(): void {
    Taro.removeStorageSync(STORAGE_KEYS.TOKEN)
  },

  getUser(): any | null {
    try {
      const userStr = Taro.getStorageSync(STORAGE_KEYS.USER)
      return userStr ? (typeof userStr === 'string' ? JSON.parse(userStr) : userStr) : null
    } catch {
      return null
    }
  },

  setUser(user: any): void {
    Taro.setStorageSync(STORAGE_KEYS.USER, JSON.stringify(user))
  },

  removeUser(): void {
    Taro.removeStorageSync(STORAGE_KEYS.USER)
  },

  isLoggedIn(): boolean {
    return !!this.getToken()
  },

  clear(): void {
    this.removeToken()
    this.removeUser()
  },
}


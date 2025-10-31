import { defineStore } from 'pinia'
import { loginUser, getUserInfo } from '@/api/user'
import type { UserInfo } from '@/components/type'

interface UserState {
  token: string
  name: string
  email: string
  avatar: string
  roles: string[]
  isLoggedIn: boolean
}

interface LoginParams {
  username: string
  password: string
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: '',
    name: '',
    email: '',
    avatar: '',
    roles: [],
    isLoggedIn: false
  }),
  
  getters: {
    hasToken: (state) => !!state.token,
    userInfo: (state) => ({
      name: state.name,
      email: state.email,
      avatar: state.avatar,
      roles: state.roles
    })
  },
  
  actions: {
    // 设置用户信息
    setUser(user: Partial<UserState>) {
      if (user.token !== undefined) this.token = user.token
      if (user.name !== undefined) this.name = user.name
      if (user.email !== undefined) this.email = user.email
      if (user.avatar !== undefined) this.avatar = user.avatar
      if (user.roles !== undefined) this.roles = user.roles
      if (user.isLoggedIn !== undefined) this.isLoggedIn = user.isLoggedIn
      
      // 保存到本地存储
      this.saveToLocalStorage()
    },
    
    // 保存到本地存储
    saveToLocalStorage() {
      const userState = {
        token: this.token,
        name: this.name,
        email: this.email,
        avatar: this.avatar,
        roles: this.roles,
        isLoggedIn: this.isLoggedIn
      }
      localStorage.setItem('user-store', JSON.stringify(userState))
    },
    
    // 从本地存储加载
    loadFromLocalStorage() {
      const stored = localStorage.getItem('user-store')
      if (stored) {
        try {
          const userState = JSON.parse(stored)
          this.token = userState.token || ''
          this.name = userState.name || ''
          this.email = userState.email || ''
          this.avatar = userState.avatar || ''
          this.roles = userState.roles || []
          this.isLoggedIn = userState.isLoggedIn || false
        } catch (error) {
          console.error('加载用户信息失败:', error)
        }
      }
    },
    
    // 设置token
    setToken(token: string) {
      this.token = token
      this.isLoggedIn = !!token
      
      // 保存到本地存储
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    },
    
    // 登录
    async login(loginParams: LoginParams) {
      try {
        const response = await loginUser(loginParams)
        console.log('登录API响应:', response)
        
        // 兼容不同的响应格式
        let token: string = ''
        let userInfo: any = null
        
        if (response && typeof response === 'object') {
          // 情况1：标准格式 { access_token, user }
          if (response.access_token) {
            token = response.access_token
            userInfo = response.user
          }
          // 情况2：简化格式 { token, user }
          else if ((response as any).token) {
            token = (response as any).token
            userInfo = (response as any).user
          }
          // 情况3：只有token
          else if (typeof response === 'string') {
            token = response
          }
          // 情况4：响应表示成功但没有具体数据
          else if ((response as any).success) {
            // 使用一个临时token，稍后获取用户信息
            token = 'temp_token_' + Date.now()
          }
        }
        
        if (token) {
          // 设置token
          this.setToken(token)
          
          // 设置用户信息
          // 优先使用 displayName，其次使用 username，最后使用登录时输入的用户名
          const displayName = userInfo?.displayName || userInfo?.username || loginParams.username
          
          this.setUser({
            name: displayName,
            email: userInfo?.email || '',
            avatar: userInfo?.avatar || '',
            roles: [], 
            isLoggedIn: true
          })
          
          console.log('登录成功，token:', token)
          console.log('用户信息:', { name: displayName, email: userInfo?.email })
          return { success: true, data: response }
        } else {
          throw new Error('未获取到有效的认证信息')
        }
      } catch (error) {
        console.error('登录失败:', error)
        return { success: false, error }
      }
    },
    
    // 获取用户信息
    async fetchUserInfo() {
      try {
        if (!this.token) {
          throw new Error('No token found')
        }
        
        const userInfo: UserInfo = await getUserInfo()
        
        // 优先使用 displayName，其次使用 username，最后使用 name（兼容旧版本）
        const displayName = userInfo.displayName || userInfo.username || userInfo.name || ''
        
        this.setUser({
          name: displayName,
          email: userInfo.email || '',
          avatar: userInfo.avatar || '',
          roles: [], // UserInfo没有roles字段，使用默认值
          isLoggedIn: true
        })
        
        console.log('获取用户信息成功:', { name: displayName, email: userInfo.email })
        return { success: true, data: userInfo }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        // 如果获取用户信息失败，清除token
        this.logout()
        return { success: false, error }
      }
    },
    
    // 登出
    logout() {
      this.token = ''
      this.name = ''
      this.email = ''
      this.avatar = ''
      this.roles = []
      this.isLoggedIn = false
      
      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user-store')
      sessionStorage.removeItem('token')
    },
    
    // 初始化用户状态（从本地存储恢复）
    initUserState() {
      // 先从本地存储加载用户信息
      this.loadFromLocalStorage()
      
      // 如果有token，尝试获取最新的用户信息
      if (this.token) {
        this.fetchUserInfo()
      }
    }
  }
})

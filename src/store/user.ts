import { defineStore } from 'pinia'
import { loginUser, getUserInfo } from '@/api/user'
import type { UserInfo } from '@/components/type'
import { socketService } from '@/services/socket'  // ⭐ 导入 socketService

interface UserState {
  token: string
  id: string | number  // ⭐ 新增 userId
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
    id: '',  // ⭐ 初始化 id
    name: '',
    email: '',
    avatar: '',
    roles: [],
    isLoggedIn: false
  }),
  
  // ⭐ 配置持久化 - 使用 pinia-plugin-persistedstate
  persist: {
    key: 'user-store',  // 使用 'user-store' 作为 localStorage 的 key
    storage: localStorage
  },
  
  getters: {
    hasToken: (state) => !!state.token,
    userInfo: (state) => ({
      id: state.id,  // ⭐ 添加到 getter
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
      if (user.id !== undefined) this.id = user.id  // ⭐ 设置 id
      if (user.name !== undefined) this.name = user.name
      if (user.email !== undefined) this.email = user.email
      if (user.avatar !== undefined) this.avatar = user.avatar
      if (user.roles !== undefined) this.roles = user.roles
      if (user.isLoggedIn !== undefined) this.isLoggedIn = user.isLoggedIn
      // ⭐ 不再需要手动保存，Pinia 持久化插件会自动处理
    },
    
    // 设置token
    setToken(token: string) {
      this.token = token
      this.isLoggedIn = !!token
      
      // ⭐ 同时保存到单独的 token key，供 API 拦截器使用
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
      // Pinia 持久化插件也会自动保存到 'user-store'
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
            id: userInfo?.id || '',  // ⭐ 保存 userId
            name: displayName,
            email: userInfo?.email || '',
            avatar: userInfo?.avatar || '',
            roles: [], 
            isLoggedIn: true
          })
          
          console.log('登录成功，token:', token)
          console.log('用户信息:', { name: displayName, email: userInfo?.email })
          
          // ⭐ 登录成功后，初始化 WebSocket 连接
          this.initWebSocket()
          
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
          id: userInfo.id || '',  // ⭐ 保存 userId
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
      this.id = ''  // ⭐ 清除 id
      this.name = ''
      this.email = ''
      this.avatar = ''
      this.roles = []
      this.isLoggedIn = false
      // ⭐ Pinia 持久化插件会自动清除 'user-store'
      // 但我们仍然需要清除旧的 token 键（如果存在）
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      
      // ⭐ 登出时断开 WebSocket
      if (socketService.socket?.connected) {
        socketService.disconnect()
      }
    },
    
    // 初始化 WebSocket 连接
    initWebSocket() {
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
      if (!SOCKET_URL) {
        console.warn('[UserStore] 未配置 VITE_SOCKET_URL')
        return
      }
      
      // 只有在已登录且有用户 ID 的情况下才连接
      if (this.hasToken && this.id) {
        console.log('[UserStore] 🔌 初始化 WebSocket 连接')
        console.log('[UserStore] 用户信息:', { 
          id: this.id, 
          name: this.name, 
          token: this.token ? '存在' : '不存在' 
        })
        
        socketService.connect(SOCKET_URL, this.token)
      } else {
        console.warn('[UserStore] ⚠️ 用户未登录或缺少 ID，跳过 WebSocket 连接')
      }
    },
    
    // 初始化用户状态（从本地存储恢复）
    initUserState() {
      // ⭐ Pinia 持久化插件会自动从 localStorage 恢复状态
      // 如果有token，尝试获取最新的用户信息
      if (this.token) {
        this.fetchUserInfo()
        
        // ⭐ 如果已经有完整的用户信息（包括 ID），初始化 WebSocket
        if (this.id) {
          this.initWebSocket()
        }
      }
    }
  }
})
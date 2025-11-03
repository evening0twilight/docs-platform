import { createApp } from 'vue'
// 引入pinia
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
// 引入路由
import router from './router'
// 引入arco
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import './style.css'
import App from './App.vue'
// 引入用户store
import { useUserStore } from './store/user'
// 引入 WebSocket 服务
import { socketService } from './services/socket'

const app = createApp(App)
// pinia
const pinia = createPinia()
pinia.use(createPersistedState())

// 使用插件
app.use(pinia)
app.use(router)
app.use(ArcoVue)

// 初始化用户状态
const userStore = useUserStore()
userStore.initUserState()

// 初始化 WebSocket 连接
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
if (SOCKET_URL) {
  console.log('[App] 初始化 WebSocket 连接:', SOCKET_URL)
  
  // 获取 token
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  
  // 连接 WebSocket
  // ⭐ 连接后会自动触发 'connected' 事件，然后在事件处理中自动认证
  socketService.connect(SOCKET_URL, token)
} else {
  console.warn('[App] 未配置 VITE_SOCKET_URL，WebSocket 功能将不可用')
}

app.mount('#app')

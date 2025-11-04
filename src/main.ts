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

// ⭐ WebSocket 连接已移至 userStore.initWebSocket()
// 会在用户登录成功后自动初始化，或在 initUserState 中恢复登录状态后初始化

app.mount('#app')

import { createApp } from 'vue'
// 引入pinia
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
// 引入路由
import router from './router'
// Arco 组件改为按需自动导入(见 vite.config 的 unplugin-vue-components + ArcoResolver),
// 此处只保留全量样式以确保暗色主题与所有组件样式完整。
import '@arco-design/web-vue/dist/arco.css'
import './style.css'
import App from './App.vue'
// 引入用户store
import { useUserStore } from './store/user'
// 主题(暗色/亮色)
import { useTheme } from './composables/useTheme'

// 在挂载前应用主题,避免首屏闪烁
useTheme().init()

const app = createApp(App)
// pinia
const pinia = createPinia()
pinia.use(createPersistedState())

// 使用插件
app.use(pinia)
app.use(router)
// 注:不再 app.use(ArcoVue) 全量注册——组件按需自动导入,大幅缩减打包体积

// 初始化用户状态
const userStore = useUserStore()
userStore.initUserState()

// ⭐ WebSocket 连接已移至 userStore.initWebSocket()
// 会在用户登录成功后自动初始化，或在 initUserState 中恢复登录状态后初始化

app.mount('#app')

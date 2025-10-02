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

app.mount('#app')

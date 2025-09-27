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

const app = createApp(App)
// pinia
const pinia = createPinia()
pinia.use(createPersistedState())

// 路由
app.use(router)

// arco design
app.use(ArcoVue)

app.use(pinia)
app.mount('#app')

import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './Routes.js'
import { createPinia } from 'pinia'
import './services/axios.js'
import { useUserStore } from './store/index.js'

const app =createApp(App)
const pinia = createPinia()

const userStore = useUserStore();
await userStore.init();

app.use(router)
app.use(pinia)
app.mount('#app')


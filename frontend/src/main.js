import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './Routes.js'
import { createPinia } from 'pinia'
import './services/axios.js'
import { useUserStore } from './store/index.js'

const app =createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const userStore = useUserStore();

(async () => {
    await userStore.init();
    if (userStore.isAuth) {
        await userStore.getProjects();
    }
    app.mount('#app')
})();


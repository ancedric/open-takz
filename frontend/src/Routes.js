import { createRouter, createWebHistory } from 'vue-router'

// Vos imports originaux
import LandingPage from './views/LandingPage.vue'
import Project from './views/Project.vue'
import AddTask from './components/AddTask.vue'
import EditTask from './views/EditTask.vue'
import Profile from './views/Profile.vue'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import ConfirmEmail from './views/ConfirmEmail.vue'
import EditProfile from './views/EditProfile.vue'
import SetProfile from './views/SetProfile.vue'
import Pricing from './views/Pricing.vue'
import UsersConditions from './views/UserSConditions.vue'
import PrivacyPolicy from './views/PrivacyPolicy.vue'
import LegalNotice from './views/LegalNotice.vue'
import Support from './views/Support.vue'
import Credits from './views/Credits.vue'
import CreateCompany from './views/CreateCompany.vue'
import JoinCompany from './views/JoinCompany.vue'
import FinanceManagement from './views/FinanceManagement.vue'
import HRManagement from './views/HRManagement.vue'
import { useUserStore } from './store/index.js'
import ModuleLayout from './Layout/ModuleLayout.vue'

const routes = [
  // ROUTES PUBLIQUES (Hors structure ERP)
  { path: '/', component: LandingPage },
  { path: '/auth', component: Login },
  { path: '/register', component: Register },
  { path: '/confirmation', component: ConfirmEmail },
  { path: '/pricing', component: Pricing },
  { path: '/usersConditions', component: UsersConditions },
  { path: '/privacyPolicy', component: PrivacyPolicy },
  { path: '/legalNotice', component: LegalNotice },
  { path: '/support', component: Support },
  { path: '/credits', component: Credits },
  { path: '/create-company/:userref', component: CreateCompany },
  { path: '/join-company/:userref', component: JoinCompany },

  // ROUTES DE L'ERP (V2 utilisant le Layout Modulaire)
  {
    path: '/',
    component: ModuleLayout,
    children: [
      { path: 'home', component: ModuleLayout },
      { path: 'project/:userRef', component: Project },
      { path: 'addTask/:title', component: AddTask },
      { path: 'editTask/:id/title/:title/desc/:description', component: EditTask },
      { path: 'profile', component: Profile },
      { path: 'editProfile', component: EditProfile },
      { path: 'setProfile', component: SetProfile },
      
      // NOUVEAUX MODULES (V2)
      { 
        path: 'hr', 
        component: HRManagement,
        beforeEnter: (to, from, next) => {
          const userStore = useUserStore();
          if (userStore.user.privilege === 'owner' || userStore.user.privilege === 'hr') {
            next();
          } else {
            next('/home'); // Redirige si pas autorisé
          }
        }
      },
      { 
        path: 'finance', 
        component: FinanceManagement,
        beforeEnter: (to, from, next) => {
          const userStore = useUserStore();
          // Seul le propriétaire peut voir la finance pour l'instant
          if (userStore.user.privilege === 'owner') next();
          else next('/home');
        }
      },
    ]
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
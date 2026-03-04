import { createRouter, createWebHistory } from 'vue-router'
import supabase from './services/supabaseConfig.js'
import { ref, onMounted } from 'vue'
import { useUserStore } from './store/index'

// Vos imports originaux
import LandingPage from './views/LandingPage.vue'
import Project from './views/Project.vue'
import AddTask from './components/AddTask.vue'
import EditTask from './views/EditTask.vue'
import Profile from './views/Profile.vue'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import EmployePortal from './views/EmployeePortal.vue'
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
import AccountingManagement from './views/AccountingManagement.vue'
import CRMManagement from'./views/CRMManagement.vue'
import Dashboard from './views/Dashboard.vue'
import ClosingArchives from './views/ClosingArchives.vue'
import ModuleLayout from './Layout/ModuleLayout.vue'
import Home from './views/Home.vue'
import SuperAdmin from './views/SuperAdmin.vue'
import ErrorPage from './views/ErrorPage.vue'
import SubscriptionExpired from './views/SubscriptionExpired.vue'

const departments = ref([])

onMounted(async () => {
    // Charger les départements et clients au montage
    const { data: depts } = await supabase.from('department').select('*').eq('companyref', userStore.user.company.companyref)
    departments.value = depts || []
})

const routes = [
  // ROUTES PUBLIQUES (Hors structure ERP)
  { path: '/', component: LandingPage },
  { path: '/auth', component: Login },
  { path: '/register', component: Register },
  { path: '/pricing', component: Pricing },
  { path: '/users-conditions', component: UsersConditions },
  { path: '/privacyPolicy', component: PrivacyPolicy },
  { path: '/legalNotice', component: LegalNotice },
  { path: '/support', component: Support },
  { path: '/credits', component: Credits },
  { path: '/create-company/:userref', component: CreateCompany },
  { path: '/join-company/:userref', component: JoinCompany },
  { path: '/subscription-expired', component: SubscriptionExpired },
  
  {
    path: '/super-admin',
    component: SuperAdmin,
    meta: { requiresAuth: true, requiresAdmin: true } // Double sécurité
  },

  {
    path: '/home',
    component: ModuleLayout,
    children: [
      { path: '', component: Home },
      { path: 'dashboard', component: Dashboard },
      { path: 'profile', component: Profile },
      { 
        path: 'department/:deptName/:deptid', 
        name: 'department-view',
        component: Project, 
        props: true,
        beforeEnter: (to, from, next) => {
          const userStore = useUserStore();
          const user = userStore.user.employe;
          const hasHighPrivilege = ['owner', 'admin', 'hr'].includes(user.privilege);
          const isMemberOfDept = user.deptref === to.params.deptid;

          if (hasHighPrivilege || isMemberOfDept) {
            next();
          } else {
            console.warn("Accès refusé : privilèges insuffisants ou mauvais département");
            next('/home');
          }
        }
      },
      
      // ROUTES FIXES POUR LES MODULES SPÉCIAUX
      { path: 'hr', component: HRManagement,
        beforeEnter: (to, from, next) => {
          const userStore = useUserStore();

          if (['owner', 'admin', 'hr'].includes(userStore.user.employe.privilege)) {
            next();
          } else {
            next('/home');
          }
        }
      },
      { path: 'accounting', component: AccountingManagement,
        beforeEnter: (to, from, next) => {
          const userStore = useUserStore();

          if (['owner', 'admin', 'hr'].includes(userStore.user.employe.privilege)) {
            next();
          } else {
            next('/home');
          }
        }
       },
      { path: 'finance', component: FinanceManagement,
        beforeEnter: (to, from, next) => {
          const userStore = useUserStore();

          if (['owner', 'admin', 'hr'].includes(userStore.user.employe.privilege)) {
            next();
          } else {
            next('/home');
          }
        }
       },
      { path: 'crm', component: CRMManagement,
        beforeEnter: (to, from, next) => {
          const userStore = useUserStore();

          if (['owner', 'admin', 'hr'].includes(userStore.user.employe.privilege)) {
            next();
          } else {
            next('/home');
          }
        }
       },
      { path: 'archives', component: ClosingArchives,
        beforeEnter: (to, from, next) => {
          const userStore = useUserStore();

          if (['owner', 'admin', 'hr'].includes(userStore.user.employe.privilege)) {
            next();
          } else {
            next('/home');
          }
        }
      },
      { path: 'employe', component: EmployePortal }
    ]
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: ErrorPage,
    props: { 
      code: '403', 
      title: 'Accès Réservé', 
      message: "Halte-là ! Vous n'avez pas les permissions nécessaires pour accéder à cette zone sécurisée." 
    }
  },

  // Route 404 (Attrape-tout)
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: ErrorPage,
    props: { 
      code: '404', 
      title: 'Page Introuvable', 
      message: "Cette page n'existe pas ou a été déplacée. Arrêtez de jouer avec l'URL !" 
    }
  }
  
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // 1. Vérifier si la route demande d'être Admin
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    // Si l'utilisateur n'est pas connecté ou n'a pas le bon rôle
    if (!userStore.user || userStore.user.user.privilege !== 'admin') {
      return next('/403'); 
    }
  }

  if (to.path === '/auth') return next();

  // 2. On vérifie si l'utilisateur est connecté
  //if (!userStore.user) return next('/auth');

  // 3. LOGIQUE D'ABONNEMENT
  if(userStore.user && userStore.user.company){
    const expiryDateStr = userStore.user.company?.expiry_date;
  
    if (expiryDateStr) {
      const today = new Date();
      const expiryDate = new Date(expiryDateStr);

      // Si expiré et qu'on n'est pas déjà sur la page d'erreur
      if (today > expiryDate && to.path !== '/subscription-expired') {
      return next('/subscription-expired');
    }
  }}

  next();
});

export default router
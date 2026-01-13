<script setup>
import { useUserStore } from '../store/index'
import supabase from '../services/supabaseConfig.js'
import { useRouter } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import Header from '../components/Header.vue'

const userStore = useUserStore();
const router = useRouter();
const departments = ref([])
const excludedDepts = ['Ressources humaines', 'Comptabilité', 'Marketing', 'Finances']

onMounted(async () => {
  // Correction de l'accès au companyref selon ton store
  const companyRef = userStore.user.company.companyref 
  console.log(userStore.user.employe)
  const { data: depts } = await supabase
    .from('department')
    .select('*')
    .eq('companyref', companyRef)
    
  departments.value = depts || []
})

// 2. Création de la liste filtrée
const dynamicDepartments = computed(() => {
  return departments.value.filter(d => !excludedDepts.includes(d.deptname))
})

const logout = () => {
  // Logique de déconnexion ici
  router.push('/auth');
};
</script>

<template>
  <div class="erp-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2 class="logo">OpenTask <span>v2.0</span></h2>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <p class="section-title">Général</p>
          <router-link to="/home" class="nav-item" v-if="userStore.user.employe.privilege !=='user'">🏠 Tableau de Bord</router-link>
          <router-link to="/home/employe" class="nav-item">Portail employe</router-link>
        </div>

        <div class="nav-section" v-if="userStore.user.employe.privilege !=='user'">
          <p class="section-title">Départements</p>
          <router-link to="/home/hr" class="nav-item">👥 Ressources Humaines</router-link>
          <router-link to="/home/accounting" class="nav-item">👥 Comptabilité</router-link>
          <router-link to="/home/crm" class="nav-item">💰 Marketing</router-link>
          <router-link to="/home/finance" class="nav-item">💰 Finance & Facturation</router-link>
          <router-link v-for="d in dynamicDepartments" :key="d.deptref" :to="`/home/${d.deptname}/${d.deptref}`" class="nav-item"> {{d.deptname}} </router-link>
        </div>

        <div class="nav-section settings">
          <p class="section-title">Compte</p>
          <router-link to="/home/profile" class="nav-item">👤 Mon Profil</router-link>
          <button @click="logout" class="nav-item logout-btn">🚪 Déconnexion</button>
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <section class="page-view">
        <Header />
        <router-view />
      </section>
    </main>
  </div>
</template>

<style scoped>
.erp-container {
  display: flex;
  height: 100vh;
  background-color: #f4f7f9;
}

.sidebar {
  width: 260px;
  background-color: #1e293b;
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 30px 20px;
  text-align: center;
}

.logo { font-size: 1.5rem; font-weight: bold; }
.logo span { color: #3b82f6; font-size: 0.8rem; }

.sidebar-nav { 
  flex: 1; 
  padding: 10px; 
  overflow-y: scroll; 
  scroll-bar-width: none;
  scrollbar-width: none;
  -ms-overflow-style: none;
                        
  &::-webkit-scrollbar {
    display: none;
  }
}

.nav-section { margin-bottom: 30px; }
.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #64748b;
  padding-left: 15px;
  margin-bottom: 10px;
}

.nav-item {
  display: block;
  padding: 12px 15px;
  color: #cbd5e1;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-item:hover, .router-link-active {
  background-color: #334155;
  color: white;
}

.logout-btn{
  background-color: #c0340aff;
  color: #eee;
}
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.top-bar {
  height: 60px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 30px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.page-view { padding: 30px; flex: 1; }
</style>
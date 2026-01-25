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
const isSidebarOpen = ref(false);

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

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

router.afterEach(() => {
  isSidebarOpen.value = false;
});

const logout = () => {
  // Logique de déconnexion ici
  router.push('/auth');
};
</script>

<template>
  <div class="erp-container">
    <div v-if="isSidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>

    <aside :class="['sidebar', { 'is-open': isSidebarOpen }]">
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
      <div class="header-ctn">
        <Header />
      </div>
      <button class="mobile-toggle" @click="toggleSidebar">
        {{ isSidebarOpen ? '✕' : '☰' }}
      </button>
      <section class="page-view">
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
  width: 20vw;
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
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  width: 80vw;
}

.header-ctn {
  position: sticky;
  top: 0;
  z-index: 100;
}

.page-view { padding: 30px; flex: 1; }
/* --- Bouton Mobile Toggle --- */
.mobile-toggle {
  display: none; /* Caché sur desktop */
  position: fixed;
  top: 80px;
  left: 15px;
  z-index: 1001;
  background: #1e293b;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
}

/* --- Overlay mobile --- */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* --- Media Query pour Mobile (< 768px) --- */
@media (max-width: 768px) {
  .mobile-toggle {
    display: block; /* Visible sur mobile */
  }

  .sidebar-overlay {
    display: block; /* Activable sur mobile */
  }

  .sidebar {
    position: fixed;
    left: -720px; /* Cachée par défaut à gauche */
    top: 0;
    bottom: 0;
    width: 80vw;
    z-index: 1000;
    transition: left 0.3s ease;
    box-shadow: 5px 0 15px rgba(0,0,0,0.2);
  }

  /* Quand la classe 'is-open' est ajoutée via le bouton */
  .sidebar.is-open {
    left: 0;
  }

  .main-content {
    width: 100%;
    /*padding-top: 50px; /* Laisser de la place pour le bouton toggle */
  }

  .page-view {
    padding: 15px; 
    box-sizing: border-box;
  }
}
</style>
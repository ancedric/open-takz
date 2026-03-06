<script setup>
import { useUserStore } from '../store/index'
import supabase from '../services/supabaseConfig.js'
import { useRouter } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import Header from '../components/Header.vue'
import FeedbackModal from '../components/FeedBack.vue';

const feedbackRef = ref(null);

const openFeedback = () => {
  feedbackRef.value.open();
};

const userStore = useUserStore();
const router = useRouter();
const departments = ref([])
const excludedDepts = ['Ressources humaines', 'Comptabilité', 'Marketing', 'Finances']
const isSidebarOpen = ref(false);

onMounted(async () => {
  // Correction de l'accès au companyref selon ton store
  const companyRef = userStore.user.company?.companyref || null;
  const { data: depts } = await supabase
    .from('department')
    .select('*')
    .eq('companyref', companyRef)
    
  departments.value = depts || []
})

// 2. Création de la liste filtrée
const dynamicDepartments = computed(() => {
  const user = userStore.user.employe;

  return departments.value
    .filter(d => !excludedDepts.includes(d.deptname)) // Ton filtre actuel (exclusion)
    .filter(d => {
      // Ton nouveau filtre de sécurité
      const isHighPrivilege = ['hr', 'owner', 'admin'].includes(user.privilege);
      const isUserDept = user.deptref === d.deptref;

      return isHighPrivilege || isUserDept;
    });
});

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

router.afterEach(() => {
  isSidebarOpen.value = false;
});

const logout = () => {
  // Logique de déconnexion ici
  userStore.logout()
  router.push('/auth');
};
</script>

<template>
  <div class="erp-container">
    <div v-if="isSidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>

    <aside :class="['sidebar', { 'is-open': isSidebarOpen }]">
      <div class="sidebar-header">
        <div class="logo-ctn">
          <img class="logo" src="../assets/images/logo-2.png" alt="Corevia Logo">
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <div class="nav-section">
          <router-link :to="`/home/create-company/${userStore.user.employe.userref}`" class="nav-item">Créer une entreprise</router-link>
          <button @click="openFeedback" class="nav-item logout-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"></path></svg>
            Laisser un avis
          </button>
    
          <p class="section-title">Général</p>
          
          <router-link to="/home" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Actualités
          </router-link>

          <router-link to="/home/dashboard" class="nav-item" v-if="userStore.user.employe.privilege ==='owner'">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="11" width="7" height="9"></rect><rect x="3" y="15" width="7" height="6"></rect></svg>
            Tableau de Bord
          </router-link>

          <router-link to="/home/employe" class="nav-item" v-if="userStore.user.employe.companyref">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Portail employé
          </router-link>
        </div>

        <div class="nav-section">
          <p class="section-title">Départements</p>
          
          <router-link to="/home/hr" class="nav-item" v-if="userStore.user.employe.privilege ==='hr' || userStore.user.employe.privilege ==='owner'">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Ressources Humaines
          </router-link>

          <router-link to="/home/accounting" class="nav-item" v-if="userStore.user.employe.privilege ==='hr' || userStore.user.employe.privilege ==='owner' || userStore.user.employe.privilege ==='admin'">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            Comptabilité
          </router-link>

          <router-link to="/home/crm" class="nav-item" v-if="userStore.user.employe.privilege ==='hr' || userStore.user.employe.privilege ==='owner' || userStore.user.employe.privilege ==='admin'">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            Marketing
          </router-link>

          <router-link to="/home/finance" class="nav-item" v-if="userStore.user.employe.privilege ==='hr' || userStore.user.employe.privilege ==='owner' || userStore.user.employe.privilege ==='admin'">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
            Finance & Facturation
          </router-link>

          <router-link v-for="d in dynamicDepartments" :key="d.deptref" :to="`/home/department/${d.deptname}/${d.deptref}`" class="nav-item"> 
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            {{d.deptname}} 
          </router-link>
        </div>

        <div class="nav-section settings">
          <p class="section-title">Compte</p>
          
          <router-link to="/home/profile" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Mon Profil
          </router-link>
          
          <button @click="logout" class="nav-item logout-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Déconnexion
          </button>
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
  <FeedbackModal ref="feedbackRef" />
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
.logo-ctn{
  display: flex;
  align-items: center;
  gap: 3px;
  width: 100%;
  height: 40px;
}
.logo { display: block; margin: 0 auto 10px; width: 80px; height: auto; object-fit: cover; }

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


.nav-item:hover, .router-link-active, .nav-item.router-link-active {
  background-color: #334155;
  color: white;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 12px; /* Espace entre le SVG et le texte */
    padding: 10px 15px;
    text-decoration: none;
    color: #475569;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.nav-item svg {
    flex-shrink: 0; /* Empêche le SVG de rétrécir si le texte est long */
    color: #94a3b8; /* Couleur par défaut des icônes */
    transition: color 0.2s ease;
} 
.nav-item:hover svg {
    color: white; /* L'icône change de couleur au survol */
}

.nav-item.router-link-active svg {
    color: white;
}

.logout-btn {
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    font-size: inherit;
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
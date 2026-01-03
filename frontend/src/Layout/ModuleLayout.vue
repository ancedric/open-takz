<script setup>
import { useUserStore } from '../store/index';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();
console.log("user: ", userStore.user);
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
          <router-link to="/home" class="nav-item">🏠 Tableau de Bord</router-link>
        </div>

        <div class="nav-section">
          <p class="section-title">Départements</p>
          <router-link :to="`/project/${userStore.user.userref}`" class="nav-item">
            📁 Projets (V1)
          </router-link>
          
          <router-link to="/hr" class="nav-item">👥 Ressources Humaines</router-link>
          <router-link to="/finance" class="nav-item">💰 Finance & Facturation</router-link>
        </div>

        <div class="nav-section settings">
          <router-link to="/profile" class="nav-item">👤 Mon Profil</router-link>
          <button @click="logout" class="nav-item logout-btn">🚪 Déconnexion</button>
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <header class="top-bar">
        <div class="user-info">
          <span>{{ userStore.user.firstname }} {{ userStore.user.lastname }}</span>
        </div>
      </header>
      
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

.sidebar-nav { flex: 1; padding: 10px; }

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
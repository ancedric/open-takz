<script setup>
import { useUserStore } from '../store/index'; // Utilisation du store Pinia

const userStore = useUserStore();
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="logo-icon">🚀</span>
      <span class="logo-text">OpenTask <small>v2</small></span>
    </div>

    <nav class="nav-menu">
      <p class="nav-label">Gestion</p>
      <router-link to="/home" class="nav-link">🏠 Dashboard</router-link>
      <router-link :to="`/project/${userStore.user.userref}`" class="nav-link">📁 Mes Projets</router-link>

      <p class="nav-label">Entreprise (V2)</p>
      <router-link to="/hr" class="nav-link">👥 Ressources Humaines</router-link>
      <router-link to="/finance" class="nav-link">💰 Finance</router-link>
    </nav>

    <div class="sidebar-footer">
      <router-link to="/profile" class="nav-link user-link">
         👤 {{ userStore.user.firstname }}
      </router-link>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 250px;
  height: 100vh;
  background-color: #1a1c23;
  color: #9e9e9e;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #333;
}
.brand {
  padding: 2rem;
  font-size: 1.25rem;
  color: white;
  font-weight: bold;
}
.nav-menu { flex: 1; padding: 0 1rem; }
.nav-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 1.5rem 0 0.5rem 0.5rem;
  color: #555;
}
.nav-link {
  display: block;
  padding: 0.8rem 1rem;
  color: #cbd5e0;
  text-decoration: none;
  border-radius: 6px;
  margin-bottom: 0.2rem;
}
.nav-link:hover, .router-link-active {
  background-color: #2d3748;
  color: #3b82f6;
}
.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #333;
}
</style>
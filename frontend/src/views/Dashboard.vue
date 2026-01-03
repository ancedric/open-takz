<script setup>
import { ref, onMounted, computed } from 'vue';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const userStore = useUserStore();
const stats = ref({
  employees: 0,
  projects: 0,
  clients: 0,
  totalBudget: 0,
  totalExpenses: 0
});

const loading = ref(true);

const loadDashboardData = async () => {
  loading.value = true;
  const companyRef = userStore.user.companyref;

  // 1. Compter les employés
  const { count: empCount } = await supabase
    .from('user')
    .select('*', { count: 'exact', head: true })
    .eq('companyref', companyRef);

  // 2. Compter les projets
  const { count: projCount } = await supabase
    .from('project')
    .select('*', { count: 'exact', head: true })
    .eq('userref', userStore.user.userref); // Filtre par créateur ou département

  // 3. Compter les clients (CRM)
  const { count: cliCount } = await supabase
    .from('client')
    .select('*', { count: 'exact', head: true })
    .eq('companyref_owner', companyRef);

  // 4. Calculer la Finance
  const { data: financeData } = await supabase
    .from('finance_transactions')
    .select('amount, category')
    .eq('companyref', companyRef);

  const budget = financeData?.filter(t => t.category === 'budget_allocation').reduce((s, t) => s + t.amount, 0) || 0;
  const expenses = financeData?.filter(t => t.category === 'expense').reduce((s, t) => s + t.amount, 0) || 0;

  stats.value = {
    employees: empCount || 0,
    projects: projCount || 0,
    clients: cliCount || 0,
    totalBudget: budget,
    totalExpenses: expenses
  };

  loading.value = false;
};

// Données pour le graphique Finance
const chartData = computed(() => ({
  labels: ['Budget Alloué', 'Dépenses Réelles'],
  datasets: [{
    label: 'Finance (€)',
    backgroundColor: ['#22c55e', '#ef4444'],
    data: [stats.value.totalBudget, stats.value.totalExpenses]
  }]
}));

onMounted(loadDashboardData);
</script>

<template>
  <div class="dashboard">
    <header class="dash-header">
      <h1>Tableau de Bord : {{ userStore.user.companyname || 'Mon Entreprise' }}</h1>
      <p>Bienvenue, {{ userStore.user.firstname }} (Rôle : {{ userStore.user.privilege }})</p>
    </header>

    <div class="grid-stats">
      <div class="stat-card">
        <span class="icon">👥</span>
        <div class="info">
          <span class="label">Employés</span>
          <span class="value">{{ stats.employees }}</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="icon">💼</span>
        <div class="info">
          <span class="label">Projets Actifs</span>
          <span class="value">{{ stats.projects }}</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="icon">🤝</span>
        <div class="info">
          <span class="label">Clients</span>
          <span class="value">{{ stats.clients }}</span>
        </div>
      </div>
      <div class="stat-card" :class="{ 'warning': stats.totalExpenses > stats.totalBudget }">
        <span class="icon">💰</span>
        <div class="info">
          <span class="label">Solde</span>
          <span class="value">{{ (stats.totalBudget - stats.totalExpenses).toLocaleString() }} €</span>
        </div>
      </div>
    </div>

    <div class="dash-content">
      <div class="chart-container card">
        <h3>Aperçu Financier</h3>
        <Bar :data="chartData" :options="{ responsive: true }" />
      </div>

      <div class="recent-activity card">
        <h3>Actions Rapides</h3>
        <div class="quick-links">
          <router-link to="/hr" class="q-link">Gérer le personnel</router-link>
          <router-link to="/crm" class="q-link">Ajouter un client</router-link>
          <router-link to="/finance" class="q-link">Saisir une facture</router-link>
          <router-link :to="`/project/${userStore.user.userref}`" class="q-link">Voir mes projets</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard { padding: 2rem; background: #f8fafc; min-height: 100vh; }
.dash-header { margin-bottom: 2rem; }
.dash-header h1 { color: #1e293b; margin: 0; }

.grid-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
.stat-card { background: white; padding: 1.5rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
.stat-card .icon { font-size: 2.5rem; }
.stat-card .label { display: block; color: #64748b; font-size: 0.875rem; }
.stat-card .value { font-size: 1.5rem; font-weight: bold; color: #1e293b; }
.stat-card.warning { border-left: 5px solid #ef4444; }

.dash-content { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
.card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }

.quick-links { display: grid; gap: 10px; margin-top: 1rem; }
.q-link { 
  display: block; padding: 12px; background: #f1f5f9; border-radius: 8px; 
  text-decoration: none; color: #1e293b; font-weight: 500; text-align: center;
  transition: 0.2s;
}
.q-link:hover { background: #e2e8f0; transform: translateX(5px); }

@media (max-width: 1024px) {
  .dash-content { grid-template-columns: 1fr; }
}
</style>
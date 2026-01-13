<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const userStore = useUserStore();
const router = useRouter()
const stats = ref({
  employees: 0,
  projects: 0,
  clients: 0,
  totalBudget: 0,
  totalExpenses: 0
});

const loading = ref(true);

const loadDashboardData = async () => {
  if (!userStore.user) return;
  loading.value = true;
  
  // Utiliser la référence employe pour la cohérence
  const companyRef = userStore.user.employe.companyref;

  // 1. Appels parallélisés pour plus de performance
  const [empRes, projRes, cliRes, transRes, invRes] = await Promise.all([
    supabase.from('employe').select('*', { count: 'exact', head: true }).eq('companyref', companyRef),
    supabase.from('project').select('*', { count: 'exact', head: true }).eq('companyref', companyRef), // Filtré par entreprise
    supabase.from('client').select('*', { count: 'exact', head: true }).eq('companyref_owner', companyRef),
    supabase.from('finance_transactions').select('amount, category').eq('companyref', companyRef),
    supabase.from('invoices').select('total_ttc').eq('company_ref', companyRef).eq('status', 'paid')
  ]);

  // 2. Calculs Financiers
  // Chiffre d'Affaires = Factures encaissées
  const revenue = invRes.data?.reduce((s, t) => s + t.total_ttc, 0) || 0;
  
  // Dépenses = Toutes les catégories 'expense' (inclut désormais les salaires via le trigger)
  const expenses = transRes.data?.filter(t => t.category === 'expense').reduce((s, t) => s + t.amount, 0) || 0;

  stats.value = {
    employees: empRes.count || 0,
    projects: projRes.count || 0,
    clients: cliRes.count || 0,
    totalRevenue: revenue,
    totalExpenses: expenses,
    netProfit: revenue - expenses
  };

  loading.value = false;
};

// Données pour le graphique Finance
const chartData = computed(() => ({
  labels: ['Revenus (Ventes)', 'Dépenses (Salaires & Frais)'],
  datasets: [{
    label: 'Situation Financière (XAF)',
    backgroundColor: ['#22c55e', '#ef4444'],
    borderRadius: 8,
    data: [stats.value.totalRevenue, stats.value.totalExpenses]
  }]
}));

onMounted(() =>{
  if(userStore.user.user.privilege !== 'owner' && userStore.user.user.privilege !== 'admin' && userStore.user.user.privilege !== 'hr') {
    router.push('/home/employe')}
  loadDashboardData
});
</script>

<template>
  <div class="dashboard">
    <div class="grid-stats">
      <div class="stat-card" :class="{ 'negative': stats.netProfit < 0, 'positive': stats.netProfit > 0 }">
        <span class="icon">{{ stats.netProfit >= 0 ? '📈' : '📉' }}</span>
        <div class="info">
          <span class="label">Bénéfice Net</span>
          <span class="value">{{ stats.netProfit }} XAF</span>
        </div>
      </div>
    </div>

    <div class="dash-content">
      <div class="chart-container card">
        <div class="card-header">
          <h3>Performance Financière</h3>
          <span class="badge-year">Année 2026</span>
        </div>
        <Bar :data="chartData" :options="{ responsive: true, maintainAspectRatio: false }" style="max-height: 300px;" />
      </div>

      <div class="recent-activity card">
        <h3>Actions Rapides</h3>
        <div class="quick-links">
          <router-link to="/home/hr" class="q-link">👥 Gérer le personnel</router-link>
          <router-link to="/home/finance" class="q-link">🧾 Créer une facture</router-link>
          <router-link to="/home/finance" class="q-link">📊 Voir la trésorerie</router-link>
          <router-link to="/home/archives" class="q-link report-link">📂 Rapports & Archives</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard { 
  padding: 2rem; 
  padding-top: 60px;
  background: #f8fafc; 
  min-height: 100vh; }
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
.stat-card.positive {
  border-bottom: 4px solid #22c55e;
}

.stat-card.negative {
  border-bottom: 4px solid #ef4444;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.badge-year {
  background: #e2e8f0;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  color: #475569;
}

.value {
  white-space: nowrap; /* Évite que le gros montant XAF ne revienne à la ligne */
}
.q-link.report-link {
  background: #1e293b;
  color: white;
  margin-top: 10px;
}

.q-link.report-link:hover {
  background: #334155;
  transform: scale(1.02);
}
</style>
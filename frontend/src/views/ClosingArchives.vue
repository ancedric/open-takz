<script setup>
import { ref, onMounted, computed } from 'vue';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler);

const userStore = useUserStore();
const archives = ref([]);
const loading = ref(true);

const fetchArchives = async () => {
  const { data, error } = await supabase
    .from('monthly_closings')
    .select('*')
    .eq('companyref', userStore.user.employe.companyref)
    .order('created_at', { ascending: true }); // Ascendant pour le graphique (Jan -> Déc)

  if (!error) archives.value = data;
  loading.value = false;
};

// Données pour le graphique de tendance
const trendChartData = computed(() => {
  return {
    labels: archives.value.map(a => a.closing_month),
    datasets: [
      {
        label: 'Profit Net (XAF)',
        data: archives.value.map(a => a.net_profit),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8
      }
    ]
  };
});

onMounted(fetchArchives);
</script>

<template>
  <div class="archive-container">
    <header class="header">
      <div>
        <h1>📈 Tendance de Performance</h1>
        <p class="subtitle">Analyse de la rentabilité annuelle</p>
      </div>
      <router-link to="/home" class="btn-back">← Retour au Dashboard</router-link>
    </header>

    <div v-if="archives.length > 0" class="chart-section card">
      <Line :data="trendChartData" :options="{ responsive: true, maintainAspectRatio: false }" />
    </div>

    <div v-if="loading" class="loader">Analyse des données...</div>

    <div v-else class="archive-list-section">
      <h3>Historique des Clôtures</h3>
      <div class="archive-grid">
        <div v-for="report in archives.slice().reverse()" :key="report.id" class="report-card">
          <div class="card-header">
            <strong>{{ report.closing_month }}</strong>
            <span class="profit-badge" :class="report.net_profit >= 0 ? 'pos' : 'neg'">
              {{ report.net_profit >= 0 ? '+' : '' }}{{ report.net_profit.toLocaleString() }} XAF
            </span>
          </div>
          <div class="card-details">
            <div class="row"><span>Revenus:</span> <span>{{ report.total_income.toLocaleString() }}</span></div>
            <div class="row"><span>Charges:</span> <span>{{ report.total_expense.toLocaleString() }}</span></div>
          </div>
          <button @click="window.print()" class="btn-detail">Voir le rapport complet</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.archive-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
.chart-section { height: 350px; margin-bottom: 3rem; padding: 1.5rem; background: white; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.subtitle { color: #64748b; margin-top: 5px; }

.archive-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1rem; }
.report-card { background: white; padding: 1.2rem; border-radius: 12px; border: 1px solid #e2e8f0; transition: 0.2s; }
.report-card:hover { transform: translateY(-5px); border-color: #10b981; }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.profit-badge { padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 0.85rem; }
.profit-badge.pos { background: #dcfce7; color: #166534; }
.profit-badge.neg { background: #fee2e2; color: #991b1b; }

.card-details { font-size: 0.9rem; color: #475569; margin-bottom: 1rem; }
.row { display: flex; justify-content: space-between; margin-bottom: 5px; }

.btn-detail { width: 100%; padding: 8px; background: #f1f5f9; border: none; border-radius: 6px; cursor: pointer; color: #1e293b; font-weight: 500; }
.btn-detail:hover { background: #e2e8f0; }

.btn-back { color: #64748b; text-decoration: none; font-weight: 600; }
</style>
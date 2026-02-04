<script setup>
import { ref, onMounted, computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import supabase from '../services/supabaseConfig';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const rawData = ref([]);

const fetchData = async () => {
  // On récupère tous les abonnements approuvés
  const { data } = await supabase
    .from('subscription_renewals')
    .select('userplan, createdat')
    .eq('status', 'approved');
  
  rawData.value = data || [];
};

const chartData = computed(() => {
  // Initialisation des 6 derniers mois
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  const currentMonth = new Date().getMonth();
  const last6Months = [];
  const revenues = [0, 0, 0, 0, 0, 0];

  for (let i = 5; i >= 0; i--) {
    const m = (currentMonth - i + 12) % 12;
    last6Months.push(months[m]);
  }

  // Calcul du revenu par mois (Hypothèse : Mensuel=29€, Annuel=290€)
  rawData.value.forEach(row => {
    const date = new Date(row.createdat);
    const monthIndex = last6Months.indexOf(months[date.getMonth()]);
    
    if (monthIndex !== -1) {
      revenues[monthIndex] += (row.userplan === 'mensuel' ? 29 : 290);
    }
  });

  return {
    labels: last6Months,
    datasets: [{
      label: 'Revenus (€)',
      backgroundColor: '#2563eb',
      borderRadius: 8,
      data: revenues
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { beginAtZero: true, grid: { display: false } },
    x: { grid: { display: false } }
  }
};

onMounted(fetchData);
</script>

<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>Croissance des Revenus (MRR)</h3>
      <p class="total">Total 6 mois : {{ chartData.datasets[0].data.reduce((a,b) => a+b, 0) }}€</p>
    </div>
    <div class="chart-wrapper">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  background: white;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  margin-top: 20px;
}
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.chart-header h3 { margin: 0; color: #1e293b; }
.total { font-weight: bold; color: #10b981; font-size: 1.1em; }
.chart-wrapper { height: 300px; }
</style>
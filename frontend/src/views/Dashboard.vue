<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import AppIcon from '../components/AppIcon.vue';

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

const projectsHealth = ref([]);
const globalProjectStats = ref({
    totalProjects: 0,
    activeProjects: 0,
    totalBudgetAllocated: 0,
    totalSpent: 0,
    globalMargin: 0
});

const loading = ref(true);
const recentTransactions = ref([]);
const totalUnpaid = ref(0);

const loadDashboardData = async () => {
  if (!userStore.user) return;
  loading.value = true;
  
  const companyRef = userStore.user.employe.companyref;

  try {
    const [empRes, projRes, cliRes, transRes, recentRes, invPendingRes] = await Promise.all([
      supabase.from('employe').select('*', { count: 'exact', head: true }).eq('companyref', companyRef),
      supabase.from('project').select('*', { count: 'exact', head: true }).eq('companyref', companyRef),
      supabase.from('client').select('*', { count: 'exact', head: true }).eq('companyref_owner', companyRef),
      supabase.from('finance_transactions').select('*').eq('companyref', companyRef),
      // On récupère les 5 dernières transactions avec le nom du projet
      supabase.from('finance_transactions')
        .select('*')
        .eq('companyref', companyRef)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('invoices').select('total_ttc').eq('company_ref', companyRef).neq('status', 'paid')

    ]);

    totalUnpaid.value = invPendingRes.data?.reduce((s, t) => s + t.total_ttc, 0) || 0;
    // Calculs financiers
    const revenue = transRes.data
      ?.filter(t => t.category === 'income' || t.category === 'budget_allocation')
      .reduce((s, t) => s + t.amount, 0) || 0;
    
    const expenses = transRes.data
      ?.filter(t => t.category === 'expense')
      .reduce((s, t) => s + t.amount, 0) || 0;

    stats.value = {
      employees: empRes.count || 0,
      projects: projRes.count || 0,
      clients: cliRes.count || 0,
      totalRevenue: revenue,
      totalExpenses: expenses,
      netProfit: revenue - expenses
    };

    recentTransactions.value = recentRes.data || [];

  } catch (error) {
    console.error("Erreur Dashboard:", error);
  } finally {
    loading.value = false;
  }
};

const isProjectLate = (endDateStr) => {
    if (!endDateStr) return false;

    const today = new Date();
    const endDate = new Date(endDateStr);

    // Si la différence est négative, c'est que la date de fin est passée
    return (endDate - today) < 0;
};

const fetchAllProjectsHealth = async () => {
    try {
        // 1. Récupérer tous les projets de la compagnie
        const { data: allProjects, error } = await supabase
            .from('project')
            .select(`
                projectref, 
                projectname, 
                start_date, 
                end_date,
                department(deptname),
                task(status, task_budget)
            `)
            .eq('companyref', userStore.user.company.companyref);

        if (error) throw error;

        // 2. Calculer les KPIs par projet
        projectsHealth.value = allProjects.map(proj => {
            const totalTasks = proj.task?.length || 0;
            const completedTasks = proj.task?.filter(t => t.status === 'completed' || t.status === 'validated').length || 0;
            const projectBudget = proj.task?.reduce((acc, t) => acc + (t.task_budget || 0), 0) || 0;
            const isLate = isProjectLate(proj.enddate)
            
            // Simulation du dépensé (lié aux transactions financières)
            // Dans une version avancée, on lierait ici la table finance_transactions
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return {
                ...proj,
                progress,
                budget: projectBudget,
                status: progress === 100 ? 'Terminé' : 'En cours'
            };
        });

        // 3. Synthèse globale pour le Manager
        globalProjectStats.value = {
            totalProjects: projectsHealth.value.length,
            activeProjects: projectsHealth.value.filter(p => p.progress < 100).length,
            totalBudgetAllocated: projectsHealth.value.reduce((s, p) => s + p.budget, 0),
            totalSpent: 0, // À lier avec ton module finance existant
            globalMargin: 0, 
            totalProjectsLate: projectsHealth.value.reduce((acc, pro) => {return acc + (pro.isLate === true ? 1 : 0)}, 0)}

    } catch (err) {
        console.error("Erreur dashboard manager projets:", err);
    }
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

// IMPORTANT : Correction du onMounted (il manquait les parenthèses pour appeler la fonction)
onMounted(() => {
  if (userStore.user.user.privilege !== 'owner' && 
      userStore.user.user.privilege !== 'admin' && 
      userStore.user.user.privilege !== 'hr') {
    router.push('/home/employe');
  } else {
    loadDashboardData(); 
    fetchAllProjectsHealth();
  }
});
</script>

<template>
  <div class="dashboard">
    <div class="grid-stats">
      <div class="stat-card" :class="{ 'negative': stats.netProfit < 0, 'positive': stats.netProfit > 0 }">
        <AppIcon name="CHART_UP" size="20" v-if="stats.netProfit >= 0" />
        <AppIcon name="CHART_DOWN" size="20" v-else />
        <div class="info">
          <span class="label">Bénéfice Net</span>
          <span class="value">{{ (stats.netProfit || 0).toLocaleString() }} XAF</span>
        </div>
      </div>
    </div>
    <div class="stat-card warning" v-if="totalUnpaid > 0">
      <AppIcon name="ALERT" size="20" />
      <div class="info">
        <span class="label">Paiements en attente</span>
        <span class="value text-red">{{ totalUnpaid.toLocaleString() }} XAF</span>
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
          <router-link to="/home/hr" class="q-link"><AppIcon name="USERS" size="16" /> Gérer le personnel</router-link>
          <router-link to="/home/finance" class="q-link"><AppIcon name="RECEIPT" size="16" /> Créer une facture</router-link>
          <router-link to="/home/finance" class="q-link"><AppIcon name="CASH" size="16" /> Voir la trésorerie</router-link>
          <router-link to="/home/archives" class="q-link report-link"><AppIcon name="SCROLL" size="16" /> Rapports & Archives</router-link>
        </div>
      </div>
    </div>
    <div class="manager-section">
        <div class="section-header">
            <h2> <AppIcon name="START" size="20" /> État de Santé des Projets</h2>
            <div class="global-badges">
                <span class="badge">{{ globalProjectStats.activeProjects }} Projets Actifs</span>
                <span class="badge blue">{{ globalProjectStats.totalProjects }} Au total</span>
            </div>
        </div>

        <div class="manager-kpi-grid">
            <div class="m-kpi-card">
                <label>Budget Total Engagé</label>
                <div class="value">{{ globalProjectStats.totalBudgetAllocated.toLocaleString() }} XAF</div>
            </div>
            <div class="m-kpi-card">
                <label>Projets en Retard</label>
                <div class="value text-red">{{globalProjectStats.totalProjectsLate}}</div> 
            </div>
        </div>

        <table class="dash-table">
            <thead>
                <tr>
                    <th>Projet</th>
                    <th>Département</th>
                    <th>Progression</th>
                    <th>Budget (Tasks)</th>
                    <th>Santé</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="proj in projectsHealth" :key="proj.projectref">
                    <td><strong>{{ proj.projectname }}</strong></td>
                    <td>{{ proj.department.deptname }}</td>
                    <td>
                        <div class="mini-progress-bar">
                            <div class="fill" :style="{ width: proj.progress + '%' }"></div>
                            <span>{{ proj.progress.toFixed(0) }}%</span>
                        </div>
                    </td>
                    <td>{{ proj.budget.toLocaleString() }} XAF</td>
                    <td>
                        <span :class="['status-dot', proj.progress < 50 ? 'warning' : 'healthy']"></span>
                        {{ proj.progress < 50 ? 'Critique' : 'Stable' }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <div class="recent-transactions card">
      <div class="card-header">
        <h3>Flux de trésorerie récents</h3>
        <router-link to="/home/finance" class="view-all">Voir tout</router-link>
      </div>
      
      <div class="table-responsive">
        <table class="dash-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th>Projet</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in recentTransactions" :key="t.id">
              <td>
                <div class="t-info">
                  <span class="t-label">{{ t.label }}</span>
                  <span class="t-date">{{ new Date(t.created_at).toLocaleDateString() }}</span>
                </div>
              </td>
              <td class="t-project">{{ t.project?.projectname || '---' }}</td>
              <td :class="t.category === 'expense' ? 'text-red' : 'text-green'">
                {{ t.category === 'expense' ? '-' : '+' }}{{ t.amount.toLocaleString() }}
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="recentTransactions.length === 0" class="empty-state">
          Aucune transaction récente.
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
  .heade-ctn{
    position: relative;
    width: 100%; 
  }
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

.recent-transactions {
  margin-top: 1.5rem;
}

.view-all {
  font-size: 0.8rem;
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
}

.dash-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.dash-table th {
  text-align: left;
  font-size: 0.75rem;
  color: #64748b;
  padding: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.dash-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #f8fafc;
  font-size: 0.85rem;
}

.t-info { display: flex; flex-direction: column; }
.t-label { font-weight: 500; color: #1e293b; }
.t-date { font-size: 0.7rem; color: #94a3b8; }
.t-project { color: #64748b; font-size: 0.8rem; }

.text-red { color: #ef4444; font-weight: 600; }
.text-green { color: #10b981; font-weight: 600; }

.empty-state {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-style: italic;
}
.manager-section {
    background: white;
    padding: 20px;
    border-radius: 15px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    margin-top: 25px;
}

.manager-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.m-kpi-card {
    padding: 15px;
    border-radius: 10px;
    background: #f8fafc;
    border-left: 5px solid #004581;
}

.mini-progress-bar {
    width: 100%;
    height: 12px;
    background: #e2e8f0;
    border-radius: 10px;
    position: relative;
    overflow: hidden;
}

.mini-progress-bar .fill {
    height: 100%;
    background: #3498db;
    transition: width 0.3s ease;
}

.mini-progress-bar span {
    position: absolute;
    right: 5px;
    top: 0;
    font-size: 0.65rem;
    color: #1e293b;
    font-weight: bold;
}

.status-dot {
    height: 10px;
    width: 10px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 5px;
}
.status-dot.healthy { background: #2ecc71; }
.status-dot.warning { background: #e67e22; }
</style>
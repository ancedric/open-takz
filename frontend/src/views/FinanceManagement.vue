<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// --- ÉTATS ET RÉFÉRENCES ---
const userStore = useUserStore();
const projects = ref([]);
const transactions = ref([]);
const invoices = ref([]);
const loading = ref(true);
const chartCanvas = ref(null);
let financeChart = null;

// Navigation et Modals (Tes états d'origine)
const activeTab = ref('transactions'); // Par défaut sur ton historique
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const showModal = ref(false);
const invoiceModal = ref(false);
const toast = ref({ show: false, message: '', type: 'success' });

// Formulaires (Respect de tes schémas Supabase)
const newTransaction = ref({
  projectref: '',
  amount: 0,
  label: '',
  category: 'expense',
  account_code: '601'
});

const newInvoice = ref({
  client_name: '',
  amount: 0,
  due_date: '',
  status: 'pending'
});

// --- LOGIQUE CFO / DAF (AJOUTS STRATÉGIQUES) ---

const totalIncome = computed(() => {
  return transactions.value
    .filter(t => t.category === 'income' || t.category === 'budget_allocation')
    .reduce((sum, t) => sum + t.amount, 0);
});

const totalExpense = computed(() => {
  return transactions.value
    .filter(t => t.category === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
});

// Burn Rate : Moyenne des sorties d'argent sur la période
const burnRate = computed(() => totalExpense.value);

// Runway : Autonomie financière (Trésorerie nette / Dépenses mensuelles)
const runway = computed(() => {
  const cashNet = totalIncome.value - totalExpense.value;
  if (burnRate.value <= 0) return '∞';
  const result = cashNet / burnRate.value;
  return result > 0 ? result.toFixed(1) : '0';
});

// Suivi Budgétaire : Comparaison Allocation vs Dépense Réelle par Projet
const budgetAnalytic = computed(() => {
  return projects.value.map(proj => {
    const allocated = transactions.value
      .filter(t => t.projectref === proj.id && t.category === 'budget_allocation')
      .reduce((s, t) => s + t.amount, 0);
    const spent = transactions.value
      .filter(t => t.projectref === proj.id && t.category === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    
    return {
      name: proj.name,
      allocated,
      spent,
      ratio: allocated > 0 ? (spent / allocated) * 100 : 0
    };
  });
});

// --- ACTIONS (TES FONCTIONS RÉINTÉGRÉES) ---

const fetchData = async () => {
  loading.value = true;
  try {
    const [projRes, transRes, invRes] = await Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('finance_transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').order('created_at', { ascending: false })
    ]);

    projects.value = projRes.data || [];
    transactions.value = transRes.data || [];
    invoices.value = invRes.data || [];
    
    if (activeTab.value === 'dashboard') nextTick(updateChart);
  } catch (e) {
    showToast("Erreur de synchronisation", "error");
  } finally {
    loading.value = false;
  }
};

const addTransaction = async () => {
  try {
    const { error } = await supabase.from('finance_transactions').insert([{
      ...newTransaction.value,
      user_id: userStore.user.id,
      created_at: new Date()
    }]);
    if (error) throw error;
    showToast("Opération enregistrée");
    showModal.value = false;
    fetchData();
  } catch (e) {
    showToast("Échec de l'enregistrement", "error");
  }
};

const addInvoice = async () => {
  try {
    const { error } = await supabase.from('invoices').insert([newInvoice.value]);
    if (error) throw error;
    showToast("Facture créée");
    invoiceModal.value = false;
    fetchData();
  } catch (e) {
    showToast("Erreur facture", "error");
  }
};

const showToast = (msg, type = 'success') => {
  toast.value = { show: true, message: msg, type };
  setTimeout(() => toast.value.show = false, 3000);
};

const updateChart = () => {
  if (!chartCanvas.value) return;
  if (financeChart) financeChart.destroy();
  financeChart = new Chart(chartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: ['Revenus', 'Dépenses'],
      datasets: [{
        data: [totalIncome.value, totalExpense.value],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0
      }]
    },
    options: { cutout: '75%', plugins: { legend: { position: 'bottom' } } }
  });
};

onMounted(fetchData);
watch(activeTab, (val) => { if(val === 'dashboard') nextTick(updateChart); });
watch(selectedMonth, fetchData);
</script>

<template>
  <div class="finance-manager">
    <Transition name="fade">
      <div v-if="toast.show" :class="['toast-notification', toast.type]">
        {{ toast.message }}
      </div>
    </Transition>

    <header class="finance-header">
      <div class="header-titles">
        <h1>Corevia Finance</h1>
        <div class="badge-cfo">Vision Stratégique CFO</div>
      </div>
      <div class="header-controls">
        <input type="month" v-model="selectedMonth" class="input-month" />
        <div class="btn-group">
          <button @click="showModal = true" class="btn-add-trans">+ Flux</button>
          <button @click="invoiceModal = true" class="btn-add-inv">+ Facture</button>
        </div>
      </div>
    </header>

    <section class="kpi-dashboard">
      <div class="kpi-card income">
        <span class="kpi-label">Flux Net (Mensuel)</span>
        <strong class="kpi-value">{{ (totalIncome - totalExpense).toLocaleString() }} <small>XAF</small></strong>
      </div>
      <div class="kpi-card burn">
        <span class="kpi-label">Burn Rate</span>
        <strong class="kpi-value">{{ burnRate.toLocaleString() }} <small>XAF</small></strong>
      </div>
      <div class="kpi-card runway">
        <span class="kpi-label">Runway (Autonomie)</span>
        <strong class="kpi-value">{{ runway }} <small>MOIS</small></strong>
      </div>
    </section>

    <nav class="finance-tabs">
      <button :class="{ active: activeTab === 'transactions' }" @click="activeTab = 'transactions'">Journal des Flux</button>
      <button :class="{ active: activeTab === 'invoices' }" @click="activeTab = 'invoices'">Facturation</button>
      <button :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">Analyses & Budgets</button>
    </nav>

    <div v-if="activeTab === 'transactions'" class="tab-content card-main">
      <div v-if="loading" class="loader">Synchronisation...</div>
      <table v-else class="finance-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Libellé</th>
            <th>Projet</th>
            <th>Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in transactions" :key="t.id">
            <td data-label="Date">{{ new Date(t.created_at).toLocaleDateString() }}</td>
            <td data-label="Libellé">{{ t.label }}</td>
            <td data-label="Projet">{{ projects.find(p => p.id === t.projectref)?.name || 'Général' }}</td>
            <td data-label="Montant" :class="t.category === 'expense' ? 'amount-neg' : 'amount-pos'">
              {{ t.amount.toLocaleString() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'invoices'" class="tab-content">
      <div class="invoice-grid">
        <div v-for="inv in invoices" :key="inv.id" class="invoice-card">
          <div class="inv-details">
            <h4>{{ inv.client_name }}</h4>
            <span class="inv-date">Échéance: {{ new Date(inv.due_date).toLocaleDateString() }}</span>
          </div>
          <div class="inv-amount">
            <strong>{{ inv.amount.toLocaleString() }} XAF</strong>
            <span :class="['status-tag', inv.status]">{{ inv.status }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'dashboard'" class="tab-content dashboard-grid">
      <div class="chart-section card-main">
        <h3>Répartition Entrées / Sorties</h3>
        <div class="canvas-wrapper">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>

      <div class="budget-section card-main">
        <h3>Santé Budgétaire des Projets</h3>
        <div v-for="b in budgetAnalytic" :key="b.name" class="budget-item">
          <div class="budget-info">
            <span>{{ b.name }}</span>
            <span>{{ b.ratio.toFixed(0) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: b.ratio + '%', background: b.ratio > 90 ? '#ef4444' : '#10b981' }"></div>
          </div>
          <small>{{ b.spent.toLocaleString() }} / {{ b.allocated.toLocaleString() }} XAF</small>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Nouvelle Opération</h3>
        <form @submit.prevent="addTransaction">
          <input v-model="newTransaction.label" placeholder="Libellé (ex: Loyer, Vente...)" required />
          <input type="number" v-model="newTransaction.amount" placeholder="Montant en XAF" required />
          <select v-model="newTransaction.projectref">
            <option value="">Projet lié (Optionnel)</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <select v-model="newTransaction.category">
            <option value="expense">Dépense (Sortie)</option>
            <option value="income">Revenu (Entrée)</option>
            <option value="budget_allocation">Allocation Budget</option>
          </select>
          <div class="modal-actions">
            <button type="button" @click="showModal = false" class="btn-cancel">Fermer</button>
            <button type="submit" class="btn-submit">Valider l'écriture</button>
          </div>
        </form>
      </div>
    </div>
    <div v-if="invoiceModal" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Émettre une Facture</h3>
        <button @click="invoiceModal = false" class="btn-close">&times;</button>
      </div>
      <form @submit.prevent="addInvoice">
        <div class="form-group">
          <label>Nom du Client</label>
          <input v-model="newInvoice.client_name" type="text" placeholder="Ex: MTN Cameroon, Client Particulier..." required />
        </div>
        <div class="form-group">
          <label>Montant (XAF)</label>
          <input v-model="newInvoice.amount" type="number" step="0.01" required />
        </div>
        <div class="form-group">
          <label>Date d'échéance</label>
          <input v-model="newInvoice.due_date" type="date" required />
        </div>
        <div class="modal-actions">
          <button type="button" @click="invoiceModal = false" class="btn-secondary">Annuler</button>
          <button type="submit" class="btn-primary">Créer la facture</button>
        </div>
      </form>
    </div>
  </div>
  </div>
</template>

<style scoped>
/* --- LAYOUT GLOBAL --- */
.finance-manager {
  padding: 1rem;
  background: #f8fafc;
  min-height: 100vh;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.card-main {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* --- EN-TÊTE & BADGES --- */
.finance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.badge-cfo {
  background: #e0f2fe;
  color: #0369a1;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  display: inline-block;
}

/* --- KPI DASHBOARD --- */
.kpi-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  border-left: 4px solid #cbd5e1;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.kpi-card.income { border-left-color: #10b981; }
.kpi-card.burn { border-left-color: #f59e0b; }
.kpi-card.runway { border-left-color: #3b82f6; }

.kpi-label { font-size: 0.85rem; color: #64748b; font-weight: 500; }
.kpi-value { display: block; font-size: 1.5rem; color: #1e293b; margin-top: 0.5rem; }

/* --- NAVIGATION ONGLETS --- */
.finance-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding-bottom: 5px;
}

.finance-tabs button {
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  border: none;
  background: #e2e8f0;
  color: #475569;
  cursor: pointer;
  white-space: nowrap;
  font-weight: 600;
  transition: all 0.2s;
}

.finance-tabs button.active {
  background: #1e293b;
  color: white;
}

/* --- TABLEAU RESPONSIVE (TON SYSTÈME) --- */
.finance-table {
  width: 100%;
  border-collapse: collapse;
}

.finance-table th {
  text-align: left;
  padding: 12px;
  color: #64748b;
  font-size: 0.85rem;
  border-bottom: 1px solid #f1f5f9;
}

.finance-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
.amount-pos { color: #10b981; font-weight: 600; }
.amount-neg { color: #ef4444; font-weight: 600; }

@media (max-width: 768px) {
  .finance-table thead { display: none; }
  .finance-table tr {
    display: block;
    margin-bottom: 1rem;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    padding: 0.5rem;
  }
  .finance-table td {
    display: flex;
    justify-content: space-between;
    text-align: right;
    border-bottom: 1px dotted #f1f5f9;
  }
  .finance-table td::before {
    content: attr(data-label);
    font-weight: 700;
    color: #94a3b8;
    text-align: left;
  }
}

/* --- DASHBOARD & BUDGETS --- */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 1.5rem;
}

@media (max-width: 1024px) { .dashboard-grid { grid-template-columns: 1fr; } }

.budget-item { margin-bottom: 1.5rem; }
.budget-info { display: flex; justify-content: space-between; font-weight: 600; font-size: 0.9rem; }

.progress-bar {
  background: #f1f5f9;
  height: 10px;
  border-radius: 5px;
  margin: 8px 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* --- MODAL & FORM --- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 500px;
  padding: 2rem;
  border-radius: 20px;
}

.modal-content form { display: flex; flex-direction: column; gap: 1rem; }
.modal-content input, .modal-content select {
  padding: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

/* --- TOAST --- */
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 2rem;
  border-radius: 12px;
  color: white;
  z-index: 2000;
  font-weight: 600;
}
.toast-notification.success { background: #10b981; }
.toast-notification.error { background: #ef4444; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
  /* --- STYLISATION DES INPUTS --- */
input, select {
  width: 100%;
  padding: 12px 16px;
  margin: 8px 0;
  display: inline-block;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-sizing: border-box;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background-color: #ffffff;
}

input:focus, select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* --- BOUTONS PRINCIPAUX --- */
.btn-primary, .btn-add-trans {
  background-color: #1e293b;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-primary:hover, .btn-add-trans:hover {
  background-color: #334155;
}

.btn-secondary, .btn-add-inv {
  background-color: #ffffff;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-secondary:hover, .btn-add-inv:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
}

/* --- STRUCTURE FORMULAIRE --- */
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.2rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #94a3b8;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

</style>
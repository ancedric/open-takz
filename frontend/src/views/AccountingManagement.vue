<script setup>
import { ref, onMounted, computed } from 'vue';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';
import Spinner from '../components/Spinner.vue';

const userStore = useUserStore();
const loading = ref(true);
const transactions = ref([]);
const filterType = ref('all'); // all, income, expense
const showManualForm = ref(false);
const newEntry = ref({
  label: '',
  amount: 0,
  account_code: '601', // Code par défaut (Fournitures)
});

// Liste OHADA simplifiée pour le Cameroun
const ohadaCommonCodes = [
  { code: '601', label: 'Achats de fournitures' },
  { code: '605', label: 'Électricité, Eau' },
  { code: '611', label: 'Transports et Déplacements' },
  { code: '622', label: 'Loyers et charges' },
  { code: '625', label: 'Internet et Téléphone' },
  { code: '632', label: 'Impôts et Taxes' },
  { code: '701', label: 'Ventes (Revenus divers)' }
];

// Récupération des données
const fetchAccountingData = async () => {
  if (!userStore.user?.companyref) return;
  
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('finance_transactions')
      .select('*, project:project(projectname)')
      .eq('companyref', userStore.user.companyref)
      .order('created_at', { ascending: false });

    if (error) throw error;
    transactions.value = data;
  } catch (err) {
    console.error("Erreur comptable:", err.message);
  } finally {
    loading.value = false;
  }
};

const submitEntry = async () => {
  if (newEntry.value.amount <= 0) return alert("Montant invalide");
  
  const { error } = await supabase.from('finance_transactions').insert([{
    companyref: userStore.user.employe.companyref,
    amount: newEntry.value.amount,
    label: newEntry.value.label,
    category: newEntry.value.account_code.startsWith('7') ? 'income' : 'expense',
    account_code: newEntry.value.account_code
  }]);

  if (!error) {
    showManualForm.value = false;
    newEntry.value = { label: '', amount: 0, account_code: '601' };
    fetchAccountingData();
  }
};

// Fonction pour regrouper les transactions par Classe OHADA (le premier chiffre du code)
const transactionsByClass = computed(() => {
  const groups = {
    'Classe 6 (Charges)': 0,
    'Classe 7 (Produits)': 0
  };

  transactions.value.forEach(t => {
    if (t.account_code?.startsWith('6')) groups['Classe 6 (Charges)'] += t.amount;
    if (t.account_code?.startsWith('7')) groups['Classe 7 (Produits)'] += t.amount;
  });

  return groups;
});

const isClosing = ref(false);

const performMonthlyClosing = async () => {
  // 1. Demander confirmation
  const confirmMessage = `Voulez-vous vraiment clôturer le mois de ${selectedMonth.value} ? 
  Cela figera les rapports financiers.`;
  
  if (!confirm(confirmMessage)) return;

  isClosing.value = true;
  try {
    // 2. Préparation des données du rapport
    const closingData = {
      companyref: userStore.user.employe.companyref,
      closing_month: selectedMonth.value,
      total_income: totalIncome.value,
      total_expense: totalExpense.value,
      net_profit: balance.value,
      closed_by: userStore.user.name
    };

    // 3. Enregistrement dans Supabase
    const { error } = await supabase
      .from('monthly_closings')
      .insert([closingData]);

    if (error) throw error;

    alert(`Le mois de ${selectedMonth.value} a été clôturé avec succès !`);
    
    // Optionnel : Générer un PDF ou imprimer le rapport ici
    window.print(); 

  } catch (err) {
    console.error("Erreur clôture:", err.message);
    alert("Impossible de clôturer le mois.");
  } finally {
    isClosing.value = false;
  }
};
// Analyse par classe comptable
const accountingAnalysis = computed(() => {
  const analysis = {
    revenue: { label: 'Chiffre d\'Affaires (Ventes)', amount: 0, code: '7' },
    purchases: { label: 'Achats de marchandises', amount: 0, code: '60' },
    salaries: { label: 'Charges de personnel', amount: 0, code: '64' },
    taxes: { label: 'Impôts et taxes', amount: 0, code: '63' },
    other: { label: 'Autres charges externes', amount: 0, code: '61/62' }
  };

  transactions.value.forEach(t => {
    if (t.account_code?.startsWith('7')) analysis.revenue.amount += t.amount;
    if (t.account_code?.startsWith('60')) analysis.purchases.amount += t.amount;
    if (t.account_code?.startsWith('64')) analysis.salaries.amount += t.amount;
    if (t.account_code?.startsWith('63')) analysis.taxes.amount += t.amount;
    // ... etc
  });

  return analysis;
});

const netResult = computed(() => {
  const income = transactions.value.filter(t => t.category === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.value.filter(t => t.category === 'expense').reduce((s, t) => s + t.amount, 0);
  return income - expense;
});

onMounted(fetchAccountingData);
</script>

<template>
  <div class="accounting-container">
    <header class="accounting-header">
      <h1>Comptabilité & Flux</h1>
      <button class="btn-export" @click="exportToCSV">Exporter CSV</button>
    </header>
    <div class="closing-section card">
      <div class="closing-info">
        <h3>Clôture de période : {{ selectedMonth }}</h3>
        <p>En clôturant ce mois, vous validez un profit net de : 
          <strong :class="balance >= 0 ? 'text-success' : 'text-danger'">
            {{ balance}} XAF
          </strong>
        </p>
      </div>
      <button 
        @click="performMonthlyClosing" 
        class="btn-close-month"
        :disabled="isClosing || transactions.length === 0"
      >
        {{ isClosing ? 'Traitement...' : '🔒 Clôturer le mois' }}
      </button>
    </div>
    <div class="stats-grid">
      <div class="stat-card balance">
        <span class="label">Solde Total</span>
        <h2 :class="{ 'positive': balance >= 0, 'negative': balance < 0 }">
          {{ balance }} €
        </h2>
      </div>
      <div class="stat-card income">
        <span class="label">Total Revenus</span>
        <h2>+ {{ totalIncome }} €</h2>
      </div>
      <div class="stat-card expense">
        <span class="label">Total Dépenses</span>
        <h2>- {{ totalExpense }} €</h2>
      </div>
    </div>
    <div class="accounting-grid">
      <div class="p-l-statement card">
        <h3>Compte de Résultat Simplifié</h3>
        <div class="pl-row">
          <span>Ventes (701...)</span>
          <span class="text-success">+ {{ accountingAnalysis.revenue.amount }} XAF</span>
        </div>
        <div class="pl-row">
          <span>Achats (60...)</span>
          <span class="text-danger">- {{ accountingAnalysis.purchases.amount }} XAF</span>
        </div>
        <div class="pl-row">
          <span>Salaires (64...)</span>
          <span class="text-danger">- {{ accountingAnalysis.salaries.amount }} XAF</span>
        </div>
        <hr>
        <div class="pl-row total">
          <strong>RÉSULTAT NET</strong>
          <strong :class="netResult >= 0 ? 'text-success' : 'text-danger'">
            {{ netResult }} XAF
          </strong>
        </div>
      </div>

      <div class="expense-pie card">
        <canvas ref="pieChart"></canvas>
      </div>
    </div>

    <div class="table-section">
      <div class="table-controls">
        <div class="filters">
          <button :class="{ active: filterType === 'all' }" @click="filterType = 'all'">Tout</button>
          <button :class="{ active: filterType === 'income' }" @click="filterType = 'income'">Revenus</button>
          <button :class="{ active: filterType === 'expense' }" @click="filterType = 'expense'">Dépenses</button>
        </div>
      </div>

      <div class="action-bar">
        <button @click="showManualForm = !showManualForm" class="btn-close-month">
          {{ showManualForm ? 'Fermer' : '+ Nouvelle Écriture OHADA' }}
        </button>
      </div>

      <div v-if="showManualForm" class="quick-form card">
        <div class="form-grid">
          <div class="input-group">
            <label>Libellé de l'opération</label>
            <input v-model="newEntry.label" placeholder="ex: Facture Eneo Décembre">
          </div>
          <div class="input-group">
            <label>Montant (XAF)</label>
            <input type="number" v-model="newEntry.amount">
          </div>
          <div class="input-group">
            <label>Compte OHADA</label>
            <select v-model="newEntry.account_code">
              <option v-for="c in ohadaCommonCodes" :key="c.code" :value="c.code">
                {{ c.code }} - {{ c.label }}
              </option>
            </select>
          </div>
          <button @click="submitEntry" class="btn-save">Enregistrer</button>
        </div>
      </div>
      <div v-if="loading" class="loader"><Spinner /></div>
      
      <table v-else class="finance-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Libellé</th>
            <th>Projet</th>
            <th>Catégorie</th>
            <th>Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredTransactions" :key="item.id">
            <td>{{ new Date(item.created_at) }}</td>
            <td>{{ item.label }}</td>
            <td>{{ item.project?.projectname || 'Hors projet' }}</td>
            <td>
              <span :class="['badge', item.category]">
                {{ item.category === 'income' ? 'Revenu' : 'Dépense' }}
              </span>
            </td>
            <td :class="item.category === 'income' ? 'text-success' : 'text-danger'">
              <strong>{{ item.amount }} €</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.accounting-container { padding: 2rem; }
.accounting-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }

.stats-grid { 
  display: grid; 
  grid-template-columns: repeat(3, 1fr); 
  gap: 1.5rem; 
  margin-bottom: 2rem; 
}

.stat-card { 
  background: white; 
  padding: 1.5rem; 
  border-radius: 12px; 
  box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
}

.label { color: #64748b; font-size: 0.9rem; font-weight: 500; }
.positive { color: #10b981; }
.negative { color: #ef4444; }

.table-section { background: white; border-radius: 12px; padding: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }

.filters { display: flex; gap: 10px; margin-bottom: 1.5rem; }
.filters button { 
  padding: 8px 16px; border-radius: 20px; border: 1px solid #e2e8f0; 
  background: white; cursor: pointer; transition: 0.3s;
}
.filters button.active { background: #1e293b; color: white; border-color: #1e293b; }

.finance-table { width: 100%; border-collapse: collapse; }
.finance-table th { text-align: left; padding: 12px; border-bottom: 2px solid #f1f5f9; color: #64748b; }
.finance-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; }

.badge { padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: bold; }
.income { background: #dcfce7; color: #166534; }
.expense { background: #fee2e2; color: #991b1b; }

.text-success { color: #10b981; }
.text-danger { color: #ef4444; }
.closing-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8fafc;
  border-left: 5px solid #1e293b;
  margin-bottom: 2rem;
}

.btn-close-month {
  background-color: #1e293b;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-close-month:hover {
  background-color: #334155;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

@media print {
  .btn-close-month, .filters, .action-bar { display: none; }
  .card { border: 1px solid #eee; box-shadow: none; }
}
</style>
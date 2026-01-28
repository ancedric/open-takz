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
const selectedMonth = ref(new Date().toISOString().slice(0,7));
const balance = computed(() => {
  const totalCashIn = transactions.value
    .filter(t => t.account_code?.startsWith('1') || t.account_code?.startsWith('7'))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCashOut = transactions.value
    .filter(t => t.account_code?.startsWith('6'))
    .reduce((sum, t) => sum + t.amount, 0);

  return totalCashIn - totalCashOut;
});
const totalIncome = computed(() => {
  return transactions.value
    .filter(t => t.category === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
});
const totalExpense = computed(() => {
  return transactions.value
    .filter(t => t.category === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
});
const newEntry = ref({
  label: '',
  amount: 0,
  account_code: '601', // Code par défaut (Fournitures)
});

// Liste OHADA simplifiée pour le Cameroun
const ohadaCommonCodes = [
  { code: '101', label: 'Capital social' },
  { code: '164', label: 'Emprunts et dettes financières' },
  { code: '421', label: 'Personnel - Salaires à payer' },
  { code: '601', label: 'Achats de fournitures' },
  { code: '605', label: 'Électricité, Eau' },
  { code: '611', label: 'Transports et Déplacements' },
  { code: '622', label: 'Loyers et charges' },
  { code: '625', label: 'Internet et Téléphone' },
  { code: '632', label: 'Impôts et Taxes' },
  { code: '645', label: 'Charges sociales' },
  { code: '701', label: 'Ventes' },
];

// Récupération des données
const fetchAccountingData = async () => {
  if (!userStore.user.company.companyref) return;
  
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('companyref', userStore.user.company.companyref)
      .order('created_at', { ascending: false });

    if (error) console.error(error.message);
    transactions.value = data;
    console.log("Données comptables chargées:", data);
  } catch (err) {
    console.error("Erreur comptable:", err.message);
  } finally {
    loading.value = false;
  }
};

const burnRateAnalysis = computed(() => {
  const initialCapital = massAnalysis.value.capital;
  const totalExpenses = massAnalysis.value.charges;
  
  // Calcul du pourcentage consommé
  const consumptionPercentage = initialCapital > 0 
    ? Math.min(Math.round((totalExpenses / initialCapital) * 100), 100) 
    : 0;

  // Estimation de la "Runway" (combien de mois il reste si on continue ainsi)
  // On prend la moyenne des dépenses (ici simplifié sur les données chargées)
  const monthlyAverageExpense = totalExpenses / (transactions.value.length > 0 ? 1 : 1); 
  const remainingCash = balance.value;
  const runwayMonths = monthlyAverageExpense > 0 ? Math.floor(remainingCash / monthlyAverageExpense) : '∞';

  return {
    percentage: consumptionPercentage,
    runway: runwayMonths,
    isCritical: consumptionPercentage > 80
  };
});

const submitEntry = async () => {
  if (newEntry.value.amount <= 0 || !newEntry.value.label) {
    return triggerToast("Veuillez remplir correctement le libellé et le montant.", "error");
  }
  
  // Logique automatique de catégorie selon le plan OHADA
  let finalCategory = 'expense';
  if (newEntry.value.account_code.startsWith('7') || newEntry.value.account_code.startsWith('1')) {
    finalCategory = 'income';
  }

  const { error } = await supabase.from('finance_transactions').insert([{
    transaction_ref: `FIN-${Date.now()}`,
    companyref: userStore.user.company.companyref,
    amount: newEntry.value.amount,
    label: newEntry.value.label,
    category: finalCategory,
    account_code: newEntry.value.account_code,
    created_at: new Date()
  }]);

  if (!error) {
    // Reset et rafraîchissement
    showManualForm.value = false;
    newEntry.value = { label: '', amount: 0, account_code: '601' };
    await fetchAccountingData();
  } else {
    triggerToast("Erreur lors de l'enregistrement : " + error.message, "error");
  }
};

// Fonction pour regrouper les transactions par Classe OHADA (le premier chiffre du code)
const transactionsByClass = computed(() => {
  const groups = {
    'Classe 1 (Capitaux)': 0,
    'Classe 6 (Charges)': 0,
    'Classe 7 (Produits)': 0
  };

  transactions.value.forEach(t => {
    // Correction : Ajout de la Classe 1 et des autres
    if (t.account_code?.startsWith('1')) groups['Classe 1 (Capitaux)'] += t.amount;
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

    triggerToast(`Le mois de ${selectedMonth.value} a été clôturé avec succès !`, "success");
    
    // Générer un PDF ou imprimer le rapport ici
    window.print(); 

  } catch (err) {
    console.error("Erreur clôture:", err.message);
    triggerToast("Impossible de clôturer le mois.", "error");
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
  const products = transactions.value
    .filter(t => t.account_code?.startsWith('7'))
    .reduce((sum, t) => sum + t.amount, 0);

  const charges = transactions.value
    .filter(t => t.account_code?.startsWith('6'))
    .reduce((sum, t) => sum + t.amount, 0);

  return products - charges;
});

const massAnalysis = computed(() => {
  return {
    capital: transactions.value.filter(t => t.account_code?.startsWith('1')).reduce((s, t) => s + t.amount, 0),
    charges: transactions.value.filter(t => t.account_code?.startsWith('6')).reduce((s, t) => s + t.amount, 0),
    produits: transactions.value.filter(t => t.account_code?.startsWith('7')).reduce((s, t) => s + t.amount, 0)
  };
});

const filteredTransactions = computed(() => {
  if (filterType.value === 'all') return transactions.value;
  return transactions.value.filter(t => t.category === filterType.value);
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
        {{ isClosing ? 'Traitement...' : 'Clôturer le mois' }}
      </button>
    </div>
    <div class="stats-grid">
      <div class="stat-card treasury">
        <span class="label">Trésorerie Disponible (Cash)</span>
        <h2 :class="balance >= 0 ? 'text-success' : 'text-danger'">
          {{ balance.toLocaleString() }} XAF
        </h2>
        <small>Inclut Capital (Classe 1) + Ventes</small>
      </div>
      
      <div class="stat-card result">
        <span class="label">Résultat d'Exploitation</span>
        <h2 :class="netResult >= 0 ? 'text-success' : 'text-danger'">
          {{ netResult.toLocaleString() }} XAF
        </h2>
        <small>Produits (Cl. 7) - Charges (Cl. 6)</small>
      </div>

      <div class="stat-card capital">
        <span class="label">Capitaux Propres</span>
        <h2>{{ massAnalysis.capital.toLocaleString() }} XAF</h2>
        <small>Investissements initiaux (Cl. 1)</small>
      </div>
    </div>
    <div class="burn-rate-section card" v-if="massAnalysis.capital > 0">
      <div class="burn-header">
        <h3><AppIcon name="FIRE" size="20" /> Analyse de Survie (Burn Rate)</h3>
        <span class="runway-badge">Autonomie estimée : {{ burnRateAnalysis.runway }} mois</span>
      </div>
      
      <div class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: burnRateAnalysis.percentage + '%' }"
            :class="{ 'critical': burnRateAnalysis.isCritical }"
          ></div>
        </div>
        <div class="progress-labels">
          <span>Capital consommé : {{ burnRateAnalysis.percentage }}%</span>
          <span>Total Charges : {{ massAnalysis.charges.toLocaleString() }} XAF</span>
        </div>
      </div>
      
      <p v-if="burnRateAnalysis.isCritical" class="warning-msg">
        <AppIcon name="WARNING" size="20" /> Attention : Vous avez consommé plus de 80% de votre capital initial.
      </p>
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

        <div v-if="showManualForm" class="quick-form-container">
        <div class="form-card">
          <div class="form-header">
            <h3>➕ Nouvelle Écriture Comptable</h3>
            <p>Système OHADA - Enregistrement en base de données</p>
          </div>
          
          <div class="form-body">
            <div class="input-row">
              <div class="input-group full">
                <label>Libellé de l'opération</label>
                <input v-model="newEntry.label" placeholder="ex: Apport en capital initial" class="custom-input">
              </div>
            </div>

            <div class="input-row split">
              <div class="input-group">
                <label>Montant (XAF)</label>
                <div class="amount-wrapper">
                  <input type="number" v-model="newEntry.amount" placeholder="0" class="custom-input amount">
                  <span class="currency-label">XAF</span>
                </div>
              </div>

              <div class="input-group">
                <label>Compte OHADA</label>
                <select v-model="newEntry.account_code" class="custom-select">
                  <option v-for="c in ohadaCommonCodes" :key="c.code" :value="c.code">
                    {{ c.code }} - {{ c.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-footer">
            <button @click="showManualForm = false" class="btn-cancel">Annuler</button>
            <button @click="submitEntry" class="btn-save" :disabled="loading">
              {{ loading ? 'Enregistrement...' : 'Valider l\'écriture' }}
            </button>
          </div>
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

.burn-rate-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
}

.burn-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.runway-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 5px 12px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.85rem;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #f1f5f9;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.5s ease-in-out;
}

.progress-fill.critical {
  background: #ef4444;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #64748b;
}

.warning-msg {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 10px;
  font-weight: bold;
}
/* Conteneur et Animation */
.quick-form-container {
    margin-top: 1.5rem;
    margin-bottom: 2rem;
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.form-card {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

/* Header du formulaire */
.form-header {
    padding: 1.25rem 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.form-header h3 {
    margin: 0;
    color: #1e293b;
    font-size: 1.1rem;
}

.form-header p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 0.85rem;
}

/* Corps du formulaire */
.form-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.input-row {
    display: flex;
    gap: 1.25rem;
}

.input-row.split > div {
    flex: 1;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.input-group label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
}

/* Inputs personnalisés */
.custom-input, .custom-select {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.95rem;
    transition: all 0.2s;
    background-color: #fff;
    color: #1e293b;
}

.custom-input:focus, .custom-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Gestion du montant avec label monnaie */
.amount-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.amount-wrapper .amount {
    padding-right: 50px;
    font-weight: 700;
    color: #1e293b;
}

.currency-label {
    position: absolute;
    right: 12px;
    font-size: 0.8rem;
    font-weight: bold;
    color: #94a3b8;
}

/* Footer et Boutons */
.form-footer {
    padding: 1.25rem 1.5rem;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.btn-cancel {
    background: white;
    border: 1px solid #cbd5e1;
    padding: 10px 20px;
    border-radius: 8px;
    color: #64748b;
    cursor: pointer;
    font-weight: 500;
    transition: 0.2s;
}

.btn-cancel:hover {
    background: #f1f5f9;
    color: #1e293b;
}

.btn-save {
    background: #1e293b;
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
}

.btn-save:hover:not(:disabled) {
    background: #334155;
    transform: translateY(-1px);
}

.btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Responsive */
@media (max-width: 640px) {
    .input-row.split {
        flex-direction: column;
    }
}
</style>
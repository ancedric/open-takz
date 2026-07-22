<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';
import Spinner from '../components/Spinner.vue';

const userStore = useUserStore();
const loading = ref(true);
const transactions = ref([]);
const filterType = ref('all');
const showManualForm = ref(false);
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const toast = ref({ show: false, message: '', type: 'success' });Format: "2026-04"
const showBudgetModal = ref(false);

// Calcul de l'année en cours pour le Dashboard
const currentYear = new Date().getFullYear();

// --- RÉFÉRENTIEL OHADA SIMPLIFIÉ (Pour le DAF) ---
const ohadaClasses = [
  { code: '1', label: 'Capital & Ressources durables' },
  { code: '2', label: 'Actif Immobilisé' },
  { code: '4', label: 'Tiers (Créances/Dettes)' },
  { code: '6', label: 'Charges (Achats, Salaires...)' },
  { code: '7', label: 'Produits (Ventes)' }
];

const budgetSettings = ref({
  salaires: 0,
  loyer_charges_fixes: 0,
  projets_dev: 0,
  marketing: 0,
  imprevus: 0
});

const tempBudget = ref({ ...budgetSettings.value });

// --- ÉTAT DU FORMULAIRE D'ÉCRITURE COMPTABLE ---
const newEntry = ref({
  label: '',
  amount: 0,
  account_code: '601', // Par défaut: Achats de marchandises
  category: 'expense',
  projectref: '',
  created_at: new Date().toISOString().slice(0, 10)
});

// --- CALCULS COMPTABLES AVANCÉS (MISSION 3 DU DAF) -
// 
const fetchBudgetSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('budget_settings')
      .select('category_key, limit_amount')
      .eq('ref_entreprise', userStore.user.company.companyref)
      .eq('year', currentYear);

    if (error) throw error;

    if (data && data.length > 0) {
      data.forEach(item => {
        if (budgetSettings.value.hasOwnProperty(item.category_key)) {
          budgetSettings.value[item.category_key] = item.limit_amount;
        }
      });
    }
  } catch (e) {
    console.error("Erreur de chargement du budget");
  }
};

// SAUVEGARDE : Upsert basé sur l'année et la clé de catégorie
  const saveBudgetSettings = async () => {
    try{
    const entrepriseRef = userStore.user.company.companyref;

  const upsertData = Object.keys(tempBudget.value).map(key => ({
    ref_entreprise: entrepriseRef, // ON LIE CHAQUE LIGNE À L'ENTREPRISE
    year: currentYear,
    category_key: key,
    limit_amount: tempBudget.value[key],
    updated_at: new Date()
  }));

  const { error } = await supabase
    .from('budget_settings')
    .upsert(upsertData, { onConflict: 'ref_entreprise,year,category_key' });

    if (error) throw error;

    budgetSettings.value = { ...tempBudget.value };
    showBudgetModal.value = false;
    showToast("Budget prévisionnel mis à jour");
  } catch (e) {
    showToast("Erreur lors de l'enregistrement", "error");
  }
};

// LOGIQUE D'EXÉCUTION (Calculée sur tes transactions existantes)
const budgetExecution = computed(() => {
  const actuals = {
    salaires: transactions.value.filter(t => t.account_code?.startsWith('66')).reduce((s, t) => s + t.amount, 0),
    loyer_charges_fixes: transactions.value.filter(t => t.account_code?.startsWith('62') || t.account_code?.startsWith('63')).reduce((s, t) => s + t.amount, 0),
    projets_dev: transactions.value.filter(t => t.projectref && t.category === 'expense').reduce((s, t) => s + t.amount, 0),
    marketing: transactions.value.filter(t => t.account_code === '601').reduce((s, t) => s + t.amount, 0),
    imprevus: transactions.value.filter(t => t.account_code?.startsWith('65')).reduce((s, t) => s + t.amount, 0),
  };

  return Object.keys(budgetSettings.value).map(key => {
    const limit = budgetSettings.value[key];
    const spent = actuals[key] || 0;
    return {
      key,
      label: key.replace(/_/g, ' '),
      limit,
      spent,
      remaining: limit - spent,
      percent: limit > 0 ? (spent / limit) * 100 : 0
    };
  });
});

// 1. Calcul du Résultat Net (Produits - Charges)
const netResult = computed(() => {
  const produits = transactions.value
    .filter(t => t.account_code?.startsWith('7'))
    .reduce((sum, t) => sum + t.amount, 0);
    
  const charges = transactions.value
    .filter(t => t.account_code?.startsWith('6'))
    .reduce((sum, t) => sum + t.amount, 0);

  return produits - charges;
});

// 2. Calcul de la Capacité d'Autofinancement (CAF) simplifiée
const cafValue = computed(() => {
  // En compta OHADA, c'est un indicateur vital pour le CFO
  return netResult.value; // Simplifié pour le composant actuel
});

// 3. Ventilation par Classe (Pour le Bilan)
const classBreakdown = computed(() => {
  const totals = {};
  transactions.value.forEach(t => {
    const firstDigit = t.account_code?.charAt(0);
    if (firstDigit) {
      totals[firstDigit] = (totals[firstDigit] || 0) + t.amount;
    }
  });
  return totals;
});

// --- ACTIONS ---

// MODIFICATION DES CALCULS : On se base sur l'année pour le CFO
const totalIncome = computed(() => {
  return transactions.value
    .filter(t => {
      const year = new Date(t.created_at).getFullYear();
      return (year === currentYear) && (t.category === 'income' || t.category === 'budget_allocation');
    })
    .reduce((sum, t) => sum + t.amount, 0);
});

const totalExpense = computed(() => {
  return transactions.value
    .filter(t => {
      const year = new Date(t.created_at).getFullYear();
      return (year === currentYear) && (t.category === 'expense');
    })
    .reduce((sum, t) => sum + t.amount, 0);
});

// FILTRE DU JOURNAL : Uniquement pour la table détaillée
const filteredTransactions = computed(() => {
  if (!selectedMonth.value) return transactions.value;
  return transactions.value.filter(t => t.created_at.startsWith(selectedMonth.value));
});

// RÉCUPÉRATION GLOBALE (SANS FILTRE SQL)
const fetchAccountingData = async () => {
  loading.value = true;
  try {
    // On récupère tout pour l'année en cours pour éviter les trous dans les calculs
    const { data, error } = await supabase
      .from('finance_transactions')
      .select('*')
      .gte('created_at', `${currentYear}-01-01`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    transactions.value = data || [];
  } catch (e) {
    showToast("Erreur de synchronisation", "error");
  } finally {
    loading.value = false;
  }
};

const submitAccountingEntry = async () => {
  if (newEntry.value.amount <= 0) return showToast("Montant invalide", "error");
  
  try {
    const { error } = await supabase.from('finance_transactions').insert([{
      ...newEntry.value,
      user_id: userStore.user.id
    }]);

    if (error) throw error;
    showToast("Écriture comptable validée");
    showManualForm.value = false;
    fetchAccountingData();
    // Reset
    newEntry.value = { label: '', amount: 0, account_code: '601', category: 'expense', created_at: new Date().toISOString().slice(0, 10) };
  } catch (e) {
    showToast("Erreur lors de l'enregistrement", "error");
  }
};

const showToast = (msg, type = 'success') => {
  toast.value = { show: true, message: msg, type };
  setTimeout(() => toast.value.show = false, 3000);
};

onMounted(() => {
  fetchAccountingData(); 
  fetchBudgetSettings();
});
watch(selectedMonth, fetchAccountingData);

// Export Grand Livre (Mission Audit du DAF)
const exportGrandLivre = () => {
  const headers = "Date,Libelle,Compte,Debit,Credit\n";
  const rows = transactions.value.map(t => {
    const isCharge = t.account_code?.startsWith('6');
    return `${t.created_at},${t.label},${t.account_code},${isCharge ? t.amount : 0},${!isCharge ? t.amount : 0}`;
  }).join("\n");
  
  const blob = new Blob([headers + rows], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `Grand_Livre_${selectedMonth.value}.csv`);
  a.click();
};
</script>

<template>
  <div class="accounting-container">
    <Transition name="slide-fade">
      <div v-if="toast.show" :class="['toast-popup', toast.type]">{{ toast.message }}</div>
    </Transition>

    <header class="accounting-header">
      <div class="header-info">
        <h1>Supervision Comptable</h1>
        <p class="subtitle">Conformité OHADA & États Financiers</p>
      </div>
      <div class="header-actions">
        <div class="date-picker-wrapper">
          <label>Période d'analyse :</label>
          <input 
            type="date" 
            v-model="selectedMonth" 
            class="month-selector"
          />
        </div>
        <div class="btn-group">
          <button @click="showManualForm = true" class="btn-primary">+ Écriture Manuelle</button>
          <button @click="exportGrandLivre" class="btn-secondary">Exporter Grand Livre</button>
        </div>
      </div>
    </header>

    <section class="financial-status-grid">
      <div class="status-card result">
        <span class="label">Résultat Net (Produits - Charges)</span>
        <h2 :class="netResult >= 0 ? 'text-success' : 'text-danger'">
          {{ netResult.toLocaleString() }} <small>XAF</small>
        </h2>
        <div class="status-indicator" :style="{ width: '100%', background: netResult >= 0 ? '#10b981' : '#ef4444' }"></div>
      </div>

      <div class="status-card analytic">
        <span class="label">Capacité d'Autofinancement (CAF)</span>
        <h2 class="text-primary">{{ cafValue.toLocaleString() }} <small>XAF</small></h2>
        <p class="hint">Indicateur de survie économique</p>
      </div>
    </section>

    <section class="ohada-balance card-main">
      <h3>Ventilation par Classe OHADA</h3>
      <div class="classes-grid">
        <div v-for="cl in ohadaClasses" :key="cl.code" class="class-item">
          <div class="class-info">
            <span class="cl-code">Cl. {{ cl.code }}</span>
            <span class="cl-label">{{ cl.label }}</span>
          </div>
          <span class="cl-amount">{{ (classBreakdown[cl.code] || 0).toLocaleString() }} XAF</span>
        </div>
      </div>
    </section>

    <section class="budget-planning card-main">
      <div class="section-header">
        <div class="title-group">
          <h3>Budget de l'Exercice {{ currentYear }}</h3>
        </div>
        <button @click="Object.assign(tempBudget, budgetSettings); showBudgetModal = true" class="btn-config">
          ⚙️ Configurer les enveloppes
        </button>
      </div>

      <div class="budget-grid">
        <div v-for="item in budgetExecution" :key="item.key" class="budget-item-card">
          <div class="budget-info">
            <span class="budget-label">{{ item.label }}</span>
            <span class="budget-amounts">
              <strong>{{ item.spent.toLocaleString() }}</strong> / {{ item.limit.toLocaleString() }} XAF
            </span>
          </div>
          
          <div class="progress-track">
            <div 
              class="progress-fill" 
              :class="{ 'near-limit': item.percent > 80, 'over-limit': item.percent > 100 }"
              :style="{ width: Math.min(item.percent, 100) + '%' }"
            ></div>
          </div>
          
          <div class="budget-footer">
            <span :class="{ 'danger-text': item.remaining < 0 }">
              {{ item.remaining < 0 ? 'Dépassement' : 'Reste' }} : {{ Math.abs(item.remaining).toLocaleString() }} XAF
            </span>
            <span>{{ item.percent.toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </section>

    <div v-if="showBudgetModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Objectifs Budgétaires {{ currentYear }}</h3>
          <button @click="showBudgetModal = false" class="btn-close">&times;</button>
        </div>
        
        <form @submit.prevent="saveBudgetSettings" class="budget-form">
          <div v-for="(val, key) in tempBudget" :key="key" class="form-group">
            <label>{{ key.replace(/_/g, ' ') }} (XAF)</label>
            <input v-model.number="tempBudget[key]" type="number" />
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showBudgetModal = false" class="btn-secondary">Annuler</button>
            <button type="submit" class="btn-primary">Mettre à jour la base</button>
          </div>
        </form>
      </div>
    </div>

    <section class="journal-section card-main">
      <div class="section-header">
        <h3>Journal Général</h3>
        <div class="table-filters">
          <button :class="{ active: filterType === 'all' }" @click="filterType = 'all'">Tout</button>
          <button :class="{ active: filterType === 'charges' }" @click="filterType = 'charges'">Charges (Cl. 6)</button>
          <button :class="{ active: filterType === 'produits' }" @click="filterType = 'produits'">Produits (Cl. 7)</button>
        </div>
      </div>

      <div v-if="loading" class="loader-container">
        <Spinner />
        <p>Génération des écritures...</p>
      </div>

      <table v-else class="accounting-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Compte</th>
            <th>Libellé</th>
            <th>Débit (Charge)</th>
            <th>Crédit (Produit)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in filteredTransactions" :key="t.id">
            <td data-label="Date">{{ new Date(t.created_at).toLocaleDateString() }}</td>
            <td data-label="Compte"><span class="badge-code">{{ t.account_code || 'N/A' }}</span></td>
            <td data-label="Libellé">{{ t.label }}</td>
            <td data-label="Débit" class="text-danger">
              {{ t.account_code?.startsWith('6') ? t.amount.toLocaleString() : '-' }}
            </td>
            <td data-label="Crédit" class="text-success">
              {{ t.account_code?.startsWith('7') || t.account_code?.startsWith('1') ? t.amount.toLocaleString() : '-' }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="showManualForm" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Passer une écriture comptable</h3>
          <button @click="showManualForm = false" class="btn-close">&times;</button>
        </div>
        <form @submit.prevent="submitAccountingEntry">
          <div class="form-group">
            <label>Libellé de l'opération</label>
            <input v-model="newEntry.label" type="text" placeholder="Ex: Vente de marchandises, Salaire Mars..." required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Code OHADA</label>
              <select v-model="newEntry.account_code">
                <option value="601">601 - Achats de marchandises</option>
                <option value="661">661 - Rémunérations directes (Salaires)</option>
                <option value="701">701 - Ventes de marchandises</option>
                <option value="101">101 - Capital social</option>
                <option value="401">401 - Fournisseurs</option>
              </select>
            </div>
            <div class="form-group">
              <label>Montant (XAF)</label>
              <input v-model="newEntry.amount" type="number" required />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showManualForm = false" class="btn-secondary">Annuler</button>
            <button type="submit" class="btn-primary">Valider l'écriture</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- CONFIGURATION DE BASE --- */
.accounting-container {
  padding: 20px;
  background-color: #f1f5f9;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}

.card-main {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 25px;
}

/* --- EN-TÊTE --- */
.accounting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.subtitle { color: #64748b; font-size: 0.9rem; margin-top: 4px; }

/* --- ÉTATS FINANCIERS (KPI) --- */
.financial-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.status-card {
  background: white;
  padding: 25px;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.status-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  transition: width 0.3s ease;
}

.hint { font-size: 0.75rem; color: #94a3b8; margin-top: 8px; }

/* --- VENTILATION OHADA --- */
.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.class-item {
  background: #f8fafc;
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.class-info { display: flex; flex-direction: column; margin-bottom: 8px; }
.cl-code { font-weight: 800; color: #1e293b; font-size: 0.8rem; }
.cl-label { font-size: 0.75rem; color: #64748b; }
.cl-amount { font-weight: 700; color: #334155; }

/* --- FILTRES DU JOURNAL --- */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.table-filters {
  display: flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 8px;
}

.table-filters button {
  padding: 6px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 6px;
}

.table-filters button.active {
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  color: #3b82f6;
}

/* --- TABLEAU & RESPONSIVE (LOGIQUE CEDRIC) --- */
.accounting-table { width: 100%; border-collapse: collapse; }
.accounting-table th { text-align: left; padding: 12px; border-bottom: 2px solid #f1f5f9; color: #475569; font-size: 0.85rem; }
.accounting-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }

.badge-code { background: #334155; color: white; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.8rem; }

@media (max-width: 768px) {
  .accounting-table thead { display: none; }
  .accounting-table tr {
    display: block;
    background: white;
    margin-bottom: 12px;
    border-radius: 12px;
    padding: 15px;
    border: 1px solid #e2e8f0;
  }
  .accounting-table td {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border: none;
  }
  .accounting-table td::before {
    content: attr(data-label);
    font-weight: 700;
    color: #94a3b8;
    font-size: 0.8rem;
  }
  
  .header-actions { width: 100%; }
  .btn-group { display: grid; grid-template-columns: 1fr 1fr; width: 100%; gap: 10px; }
}

/* --- BOUTONS ET INPUTS --- */
.btn-primary { background: #1e293b; color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn-secondary { background: white; color: #1e293b; border: 1px solid #e2e8f0; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.month-selector { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; }

/* --- TEXT COLORS --- */
.text-success { color: #10b981; }
.text-danger { color: #ef4444; }
.text-primary { color: #3b82f6; }

/* --- MODAL --- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content { background: white; padding: 25px; border-radius: 16px; width: 90%; max-width: 500px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.form-group { display: flex; flex-direction: column; margin-bottom: 15px; }
.form-group label { font-size: 0.85rem; font-weight: 600; margin-bottom: 5px; }
input, select { padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; }

/* --- TOAST --- */
.toast-popup {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  z-index: 1100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.toast-popup.success { background: #10b981; }
.toast-popup.error { background: #ef4444; }
.date-picker-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-picker-wrapper label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}

.month-selector {
  padding: 10px 15px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-family: inherit;
  font-weight: 600;
  color: #1e293b;
  background: white;
  cursor: pointer;
}

.month-selector:focus {
  border-color: #3b82f6;
  outline: none;
}

.budget-planning {
  margin-top: 2rem;
  border-top: 4px solid #1e293b;
}

.btn-config {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
}

.budget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.budget-item-card {
  background: #ffffff;
  border: 1px solid #f1f5f9;
  padding: 15px;
  border-radius: 12px;
}

.progress-track {
  background: #f1f5f9;
  height: 10px;
  border-radius: 5px;
  margin: 10px 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #10b981;
  transition: width 0.6s ease;
}

.progress-fill.near-limit { background: #f59e0b; }
.progress-fill.over-limit { background: #ef4444; }

.budget-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.danger-text { color: #ef4444; }

.budget-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

@media (max-width: 600px) {
  .budget-form { grid-template-columns: 1fr; }
}
</style>
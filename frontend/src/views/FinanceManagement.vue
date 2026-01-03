<script setup>
import { ref, onMounted, computed } from 'vue';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';

const userStore = useUserStore();
const projects = ref([]);
const transactions = ref([]);
const loading = ref(true);

// Formulaire nouvelle transaction
const showModal = ref(false);
const newTransaction = ref({
  projectref: '',
  amount: 0,
  label: '',
  category: 'expense'
});

const fetchData = async () => {
  loading.value = true;
  // 1. Récupérer les projets pour le select
  const { data: projData } = await supabase
    .from('project')
    .select('projectref, projectname')
    .eq('userref', userStore.user.userref); // Ou filtre par companyref si vous l'avez ajouté
  projects.value = projData;

  // 2. Récupérer les transactions
  const { data: transData } = await supabase
    .from('finance_transactions')
    .select('*, project:project(projectname)')
    .eq('companyref', userStore.user.companyref)
    .order('created_at', { ascending: false });
  transactions.value = transData;
  
  loading.value = false;
};

const addTransaction = async () => {
  const tRef = 'TRANS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const { error } = await supabase
    .from('finance_transactions')
    .insert([{
      ...newTransaction.value,
      transaction_ref: tRef,
      companyref: userStore.user.companyref,
      created_by: userStore.user.userref
    }]);

  if (!error) {
    showModal.value = false;
    fetchData();
  }
};

const totalExpenses = computed(() => {
  return transactions.value
    .filter(t => t.category === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
});

onMounted(fetchData);
</script>

<template>
  <div class="finance-page">
    <div class="finance-header">
      <div class="stats-cards">
        <div class="card total">
          <span class="label">Total Dépenses</span>
          <span class="amount">{{ totalExpenses.toLocaleString() }} €</span>
        </div>
      </div>
      <button @click="showModal = true" class="btn-primary">+ Ajouter un frais / budget</button>
    </div>

    <div class="table-container">
      <h3>Historique des Transactions</h3>
      <table class="finance-table">
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
          <tr v-for="t in transactions" :key="t.id">
            <td>{{ new Date(t.created_at).toLocaleDateString() }}</td>
            <td>{{ t.label }}</td>
            <td>{{ t.project?.projectname }}</td>
            <td>
              <span :class="['badge', t.category]">
                {{ t.category === 'expense' ? 'Dépense' : 'Budget' }}
              </span>
            </td>
            <td :class="t.category === 'expense' ? 'text-red' : 'text-green'">
              {{ t.category === 'expense' ? '-' : '+' }} {{ t.amount.toLocaleString() }} €
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h3>Nouvelle opération</h3>
        <select v-model="newTransaction.projectref" class="input">
          <option value="">Choisir un projet</option>
          <option v-for="p in projects" :key="p.projectref" :value="p.projectref">{{ p.projectname }}</option>
        </select>
        <input v-model="newTransaction.label" placeholder="Libellé" class="input">
        <input v-model.number="newTransaction.amount" type="number" placeholder="Montant" class="input">
        <select v-model="newTransaction.category" class="input">
          <option value="expense">Dépense (Sortie)</option>
          <option value="budget_allocation">Allocation Budget (Entrée)</option>
        </select>
        <div class="actions">
          <button @click="showModal = false">Annuler</button>
          <button @click="addTransaction" class="btn-primary">Enregistrer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.finance-page { padding: 20px; }
.finance-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.stats-cards { display: flex; gap: 20px; }
.card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); min-width: 200px; }
.card .label { display: block; color: #64748b; font-size: 0.9rem; }
.card .amount { font-size: 1.8rem; font-weight: bold; color: #1e293b; }

.finance-table { width: 100%; background: white; border-radius: 12px; border-collapse: collapse; overflow: hidden; }
.finance-table th { background: #f8fafc; padding: 15px; text-align: left; color: #64748b; }
.finance-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; }

.badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
.expense { background: #fee2e2; color: #ef4444; }
.budget_allocation { background: #dcfce7; color: #22c55e; }
.text-red { color: #ef4444; font-weight: 600; }
.text-green { color: #22c55e; font-weight: 600; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; }
.modal { background: white; padding: 30px; border-radius: 15px; width: 400px; display: flex; flex-direction: column; gap: 15px; }
.input { padding: 10px; border: 1px solid #ddd; border-radius: 8px; }
.btn-primary { background: #2563eb; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; }
</style>
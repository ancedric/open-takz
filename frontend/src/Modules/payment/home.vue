<template>
  <div class="payment-container">
    <div class="payment-card">
      <div class="header">
        <i class="pi pi-credit-card icon-main"></i>
        <h2>Configuration du compte source</h2>
      </div>

      <div class="method-grid">
        <div 
          @click="selectedMethod = 'LOCAL'"
          :class="['method-tile', { 'active': selectedMethod === 'LOCAL' }]"
        >
          <div class="tile-header">
            <i class="pi pi-mobile"></i>
            <span>Paiement Local</span>
          </div>
          <p>Orange Money, MTN MoMo, Express Union.</p>
        </div>

        <div 
          @click="selectedMethod = 'INTL'"
          :class="['method-tile', { 'active': selectedMethod === 'INTL' }]"
        >
          <div class="tile-header">
            <i class="pi pi-globe"></i>
            <span>International & Cartes</span>
          </div>
          <p>Cartes Bancaires & Transferts SWIFT.</p>
        </div>
      </div>

      <div v-if="selectedMethod" class="config-form">
        <div class="input-group">
          <label>{{ selectedMethod === 'LOCAL' ? 'Numéro Mobile Money' : 'RIB / IBAN / Numéro de Carte' }}</label>
          <div class="p-input-wrapper">
            <span class="addon"><i :class="selectedMethod === 'LOCAL' ? 'pi pi-phone' : 'pi pi-id-card'"></i></span>
            <input 
              v-model="paymentConfig.identifier" 
              type="text" 
              placeholder="Saisir l'identifiant..." 
            />
          </div>
        </div>
        
        <button class="save-button" @click="saveConfig" :disabled="loading || !paymentConfig.identifier">
          <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
          {{ loading ? 'Enregistrement...' : 'Enregistrer la configuration' }}
        </button>
      </div>
    </div>

    <div class="history-card">
      <div class="header">
        <i class="pi pi-history icon-main"></i>
        <h2>Dernières transactions</h2>
      </div>
      
      <div class="transaction-list">
        <div v-for="tx in transactions" :key="tx.id" class="tx-item">
          <div class="tx-info">
            <span class="tx-date">{{ formatDate(tx.created_at) }}</span>
            <span class="tx-desc">{{ tx.description }}</span>
          </div>
          <div class="tx-amount">{{ tx.amount.toLocaleString() }} XAF</div>
          <span :class="['status-badge', getStatusClass(tx.status)]">
            {{ tx.status.toUpperCase() }}
          </span>
        </div>
        <div v-if="transactions.length === 0" class="empty-state">Aucune transaction récente.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import supabase from '../../services/supabaseConfig'; // Ajuste selon ton projet
import { useUserStore } from '../../store/index'; // Ajuste selon ton projet

const userStore = useUserStore();
const selectedMethod = ref(null);
const loading = ref(false);
const transactions = ref([]);
const paymentConfig = ref({ identifier: '' });

// 1. Charger la config au montage
onMounted(async () => {
  await loadCurrentConfig();
  await loadTransactions();
});

const loadCurrentConfig = async () => {
  const { data, error } = await supabase
    .from('company_payment_methods')
    .select('*')
    .eq('companyref', userStore.user.employe.companyref)
    .eq('is_primary', true)
    .single();
  
  if (data) {
    selectedMethod.value = data.method_type;
    paymentConfig.value.identifier = data.account_identifier;
  }
};

const loadTransactions = async () => {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('companyref', userStore.user.employe.companyref)
    .order('created_at', { ascending: false })
    .limit(5);
  if (data) transactions.value = data;
};

const saveConfig = async () => {
  loading.value = true;
  const companyref = userStore.user.employe.companyref;

  // On désactive les anciennes méthodes pour celle-ci
  await supabase.from('company_payment_methods').update({ is_primary: false }).eq('companyref', companyref);

  const { error } = await supabase
    .from('company_payment_methods')
    .upsert({
      companyref: companyref,
      method_type: selectedMethod.value,
      account_identifier: paymentConfig.value.identifier,
      is_primary: true
    }/*, { onConflict: 'companyref, is_primary' }*/);

  loading.value = false;
  if (!error) alert("Configuration mise à jour !");
};

const getStatusClass = (status) => {
  if (status === 'paid' || status === 'SUCCESS') return 'status-success';
  if (status === 'pending') return 'status-warning';
  return 'status-danger';
};

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();
</script>

<style scoped>
/* PUR CSS - Pas de Tailwind */
.payment-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.payment-card, .history-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.icon-main {
  font-size: 1.5rem;
  color: #3b82f6;
  margin-right: 0.75rem;
}

.method-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.method-tile {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.method-tile:hover {
  border-color: #3b82f6;
  background: #f0f7ff;
}

.method-tile.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.tile-header {
  display: flex;
  align-items: center;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.tile-header i {
  margin-right: 0.5rem;
  color: #3b82f6;
}

/* Formulaire */
.config-form {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.p-input-wrapper {
  display: flex;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  background: white;
}

.addon {
  background: #f3f4f6;
  padding: 0.75rem;
  border-right: 1px solid #d1d5db;
  color: #6b7280;
}

.p-input-wrapper input {
  border: none;
  padding: 0.75rem;
  flex: 1;
  outline: none;
}

.save-button {
  margin-top: 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.save-button:disabled {
  background: #9ca3af;
}

/* Historique */
.tx-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.tx-info {
  display: flex;
  flex-direction: column;
}

.tx-date {
  font-size: 0.8rem;
  color: #9ca3af;
}

.status-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
}

.status-success { background: #dcfce7; color: #166534; }
.status-warning { background: #fef9c3; color: #854d0e; }
.status-danger { background: #fee2e2; color: #991b1b; }
</style>
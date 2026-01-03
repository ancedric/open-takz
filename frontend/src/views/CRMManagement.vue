<script setup>
import { ref, onMounted } from 'vue';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';

const userStore = useUserStore();
const clients = ref([]);
const loading = ref(true);
const showModal = ref(false);

const newClient = ref({
  companyname: '',
  contact_name: '',
  contact_email: '',
  address: ''
});

const fetchClients = async () => {
  loading.value = true;
  const { data, error } = await supabase
    .from('client')
    .select('*')
    .eq('companyref_owner', userStore.user.companyref)
    .order('companyname', { ascending: true });
  
  if (!error) clients.value = data;
  loading.value = false;
};

const handleAddClient = async () => {
  const cRef = 'CLI-' + Math.random().toString(36).substr(2, 7).toUpperCase();
  const { error } = await supabase
    .from('client')
    .insert([{
      ...newClient.value,
      clientref: cRef,
      companyref_owner: userStore.user.companyref
    }]);

  if (!error) {
    showModal.value = false;
    newClient.value = { companyname: '', contact_name: '', contact_email: '', address: '' };
    fetchClients();
  }
};

onMounted(fetchClients);
</script>

<template>
  <div class="crm-page">
    <div class="crm-header">
      <h2>📇 Gestion des Clients (CRM)</h2>
      <button @click="showModal = true" class="btn-primary">+ Nouveau Client</button>
    </div>

    <div v-if="loading" class="loader">Chargement des clients...</div>

    <div v-else class="client-grid">
      <div v-for="client in clients" :key="client.clientref" class="client-card">
        <div class="client-icon">🏢</div>
        <h4>{{ client.companyname }}</h4>
        <p class="contact-name">👤 {{ client.contact_name }}</p>
        <p class="contact-email">📧 {{ client.contact_email }}</p>
        <div class="card-footer">
          <button class="btn-small">Voir Projets</button>
          <button class="btn-small outline">Modifier</button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal shadow">
        <h3>Ajouter un client</h3>
        <input v-model="newClient.companyname" placeholder="Nom de l'entreprise cliente" class="set-input">
        <input v-model="newClient.contact_name" placeholder="Nom du contact" class="set-input">
        <input v-model="newClient.contact_email" placeholder="Email contact" class="set-input">
        <textarea v-model="newClient.address" placeholder="Adresse physique" class="set-input"></textarea>
        
        <div class="modal-actions">
          <button @click="showModal = false" class="btn-link">Annuler</button>
          <button @click="handleAddClient" class="btn-primary">Enregistrer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.crm-page { padding: 2rem; }
.crm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }

.client-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
  gap: 20px; 
}

.client-card { 
  background: white; 
  padding: 1.5rem; 
  border-radius: 12px; 
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #f1f5f9;
}

.client-icon { font-size: 2rem; margin-bottom: 10px; }
.client-card h4 { margin: 0 0 10px 0; color: #1e293b; }
.client-card p { font-size: 0.9rem; color: #64748b; margin: 5px 0; }

.card-footer { display: flex; gap: 10px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #f1f5f9; }

.btn-primary { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
.btn-small { padding: 5px 10px; border-radius: 5px; font-size: 0.8rem; cursor: pointer; border: 1px solid #3b82f6; background: #3b82f6; color: white; }
.btn-small.outline { background: white; color: #3b82f6; }

/* Modal styles standards pour l'ERP */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 100; }
.modal { background: white; padding: 2rem; border-radius: 15px; width: 400px; display: flex; flex-direction: column; gap: 1rem; }
.set-input { padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-family: inherit; }
</style>
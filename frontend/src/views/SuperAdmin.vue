<template>
  <div class="admin-dashboard">
    <header class="admin-header">
      <h1>Console SuperAdmin 🛡️</h1>
      <div class="stats-bar">
        <div class="stat-card">Utilisateurs en ligne : <span>{{ onlineUsers }}</span></div>
        <div class="stat-card">Demandes en attente : <span>{{ pendingRenewals.length }}</span></div>
      </div>
    </header>
    <div class="live-monitor-card">
        <div class="monitor-header">
            <div class="pulse-icon"></div>
            <h3>Utilisateurs en direct</h3>
            <span class="counter">{{ onlineUsersCount }}</span>
        </div>
        
        <div class="user-list">
            <div v-for="user in onlineUsersList" :key="user.user_id" class="user-item">
            <div class="user-avatar">{{ user.name.charAt(0) }}</div>
            <div class="user-info">
                <p class="user-name">{{ user.name }}</p>
                <p class="user-time">Connecté à {{ new Date(user.online_at).toLocaleTimeString() }}</p>
            </div>
            </div>
            <p v-if="onlineUsersCount === 0" class="empty-msg">Aucun utilisateur actif pour le moment.</p>
        </div>
    </div>

    <AdminChart />

    <nav class="admin-nav">
      <button @click="currentTab = 'renewals'" :class="{ active: currentTab === 'renewals' }">Abonnements</button>
      <button @click="currentTab = 'feedbacks'" :class="{ active: currentTab === 'feedbacks' }">Retours Utilisateurs</button>
    </nav>

    <section v-if="currentTab === 'renewals'" class="tab-content">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Entreprise</th>
            <th>Plan</th>
            <th>Preuve</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="req in pendingRenewals" :key="req.id">
            <td>{{ req.companyname }}</td>
            <td><span class="plan-tag">{{ req.userplan }}</span></td>
            <td>
              <a :href="getPublicUrl(req.capture)" target="_blank" class="view-proof">Voir le reçu</a>
            </td>
            <td>
              <button @click="approve(req.id)" class="btn-approve">Approuver</button>
              <button @click="reject(req.id)" class="btn-reject">Refuser</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-else class="tab-content">
      <div class="feedback-grid">
        <div v-for="f in feedbacks" :key="f.id" class="feedback-card">
          <div class="card-header">
            <span class="stars">{{ '⭐'.repeat(f.rating) }}</span>
            <span class="category-tag">{{ f.category }}</span>
          </div>
          <p>"{{ f.comment }}"</p>
          <div class="card-footer">
            <small>Par {{ f.employeref }} ({{ f.companyref }})</small>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import supabase from '../services/supabaseConfig';
import AdminChart from '../components/AdminChart.vue';

const currentTab = ref('renewals');
const pendingRenewals = ref([]);
const feedbacks = ref([]);
const onlineUsers = ref(0);

const fetchData = async () => {
  // Récupérer les renouvellements en attente
  const { data: renewals } = await supabase
    .from('subscription_renewals')
    .select('*, company(name)')
    .eq('status', 'pending');
  pendingRenewals.value = renewals || [];

  // Récupérer les feedbacks
  const { data: fb } = await supabase
    .from('app_feedbacks')
    .select('*')
    .order('createdat', { ascending: false });
  feedbacks.value = fb || [];
};

const approve = async (id) => {
  const { error } = await supabase
    .from('subscription_renewals')
    .update({ status: 'approved' })
    .eq('id', id);
  
  if (!error) {
    alert("Abonnement activé ! Le trigger SQL a mis à jour la date d'expiration.");
    fetchData();
  }
};

const onlineUsersCount = ref(0);
const onlineUsersList = ref([]); // Pour voir les noms des gens en ligne

let presenceChannel = null;

const setupRealtime = () => {
  // On crée un canal nommé 'opentask-online'
  presenceChannel = supabase.channel('opentask-online');

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      // Cette fonction s'exécute dès que quelqu'un arrive ou part
      const newState = presenceChannel.presenceState();
      
      // On transforme l'objet de présence en une liste facile à lire
      const users = [];
      for (const id in newState) {
        users.push(newState[id][0]);
      }
      
      onlineUsersList.value = users;
      onlineUsersCount.value = users.length;
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // En tant qu'admin, on signale aussi notre présence
        await presenceChannel.track({
          user_id: 'SUPER_ADMIN',
          name: 'Toi (Admin)',
          online_at: new Date().toISOString(),
        });
      }
    });
};

onMounted(() => {
    fetchData();
    setupRealtime();
});

// Important : On ferme le canal quand on quitte le dashboard
onUnmounted(() => {
    if (presenceChannel) presenceChannel.unsubscribe();
});

</script>

<style scoped>
.admin-dashboard { padding: 30px; background: #f0f2f5; min-height: 100vh; }
.admin-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
.stats-bar { display: flex; gap: 20px; }
.stat-card { background: white; padding: 15px 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.stat-card span { font-weight: bold; color: #2563eb; font-size: 1.2em; }

.admin-nav { margin-bottom: 20px; border-bottom: 1px solid #ddd; }
.admin-nav button { padding: 10px 20px; border: none; background: none; cursor: pointer; }
.admin-nav button.active { border-bottom: 3px solid #2563eb; color: #2563eb; font-weight: bold; }

.admin-table { width: 100%; background: white; border-collapse: collapse; border-radius: 12px; overflow: hidden; }
.admin-table th, .admin-table td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }

.feedback-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.feedback-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.category-tag { background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; }
.btn-approve { background: #10b981; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; margin-right: 5px; }
.btn-reject { background: #ef4444; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; }

.live-monitor-card {
  background: #1e293b; /* Fond sombre pour faire ressortir le live */
  color: white;
  padding: 20px;
  border-radius: 16px;
  margin-top: 20px;
}

.monitor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  border-bottom: 1px solid #334155;
  padding-bottom: 15px;
}

.pulse-icon {
  width: 12px;
  height: 12px;
  background: #ef4444;
  border-radius: 50%;
  box-shadow: 0 0 0 rgba(239, 68, 68, 0.4);
  animation: pulse-red 2s infinite;
}

.counter {
  margin-left: auto;
  font-size: 24px;
  font-weight: bold;
  color: #10b981;
}

.user-list {
  max-height: 200px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.user-avatar {
  width: 30px;
  height: 30px;
  background: #334155;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

@keyframes pulse-red {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
</style>
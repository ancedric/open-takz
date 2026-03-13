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
      <button @click="currentTab = 'companies'" :class="{ active: currentTab === 'companies' }">Entreprises</button>
      <button @click="currentTab = 'newsletter'" :class="{ active: currentTab === 'newsletter' }">Marketing & News</button>
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

    <section v-else-if="currentTab === 'feedbacks'" class="tab-content">
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
    <section v-else-if="currentTab === 'companies'" class="tab-content">
      <div class="admin-section">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Entreprise</th>
              <th>Modules Actifs</th> <th>Employés</th>
              <th>Fin d'abonnement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="comp in companies" :key="comp.companyref">
              <td>
                <div class="comp-info">
                  <span class="comp-name">{{ comp.companyname }}</span>
                  <small>{{ comp.companyref }}</small>
                </div>
              </td>
              
              <td>
                <div class="module-toggles">
                  <label v-for="mod in ['inventory', 'hr', 'finance']" :key="mod" class="mod-pill" :class="{ active: comp.active_modules?.includes(mod) }">
                    <input 
                      type="checkbox" 
                      :checked="comp.active_modules?.includes(mod)" 
                      @change="toggleModule(comp, mod)"
                      hidden
                    />
                    {{ mod === 'inventory' ? '📦 Stock' : mod === 'hr' ? '👥 RH' : '💰 Fin' }}
                  </label>
                </div>
              </td>

              <td>{{ comp.employe_count[0]?.count || 0 }}</td>
              <td>
                <span :class="getExpiryClass(comp.expiry_date)">
                  {{ comp.expiry_date }}
                </span>
              </td>
              <td>
                <button @click="extendTrial(comp.companyref)" class="btn-tool">🎁 +3j</button>
                <button @click="viewDetails(comp)" class="btn-tool">👁️ Détails</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <section v-else-if="currentTab === 'users'" class="tab-content">
      <div class="admin-section">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Entreprise</th>
              <th>Modules Actifs</th> <th>Employés</th>
              <th>Fin d'abonnement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="comp in companies" :key="comp.companyref">
              <td>
                <div class="comp-info">
                  <span class="comp-name">{{ comp.companyname }}</span>
                  <small>{{ comp.companyref }}</small>
                </div>
              </td>
              
              <td>
                <div class="module-toggles">
                  <label v-for="mod in ['inventory', 'hr', 'finance']" :key="mod" class="mod-pill" :class="{ active: comp.active_modules?.includes(mod) }">
                    <input 
                      type="checkbox" 
                      :checked="comp.active_modules?.includes(mod)" 
                      @change="toggleModule(comp, mod)"
                      hidden
                    />
                    {{ mod === 'inventory' ? '📦 Stock' : mod === 'hr' ? '👥 RH' : '💰 Fin' }}
                  </label>
                </div>
              </td>

              <td>{{ comp.employe_count[0]?.count || 0 }}</td>
              <td>
                <span :class="getExpiryClass(comp.expiry_date)">
                  {{ comp.expiry_date }}
                </span>
              </td>
              <td>
                <button @click="extendTrial(comp.companyref)" class="btn-tool">🎁 +3j</button>
                <button @click="viewDetails(comp)" class="btn-tool">👁️ Détails</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <section v-else>
      <div class="newsletter-section">
        <div class="card">
          <div class="card-header">
            <h3>📢 Diffuser une mise à jour</h3>
            <p>Envoyez une annonce à toutes les entreprises enregistrées ({{ companies.length }} destinataires)</p>
          </div>

          <div class="form-group">
            <label>Sujet de l'email</label>
            <input v-model="emailForm.subject" placeholder="Ex: Nouveau module de stock disponible !" class="admin-input" />
          </div>

          <div class="form-group">
            <label>Message (HTML supporté)</label>
            <textarea v-model="emailForm.body" placeholder="Bonjour à tous, nous avons le plaisir de vous annoncer..." class="admin-textarea"></textarea>
          </div>

          <div class="admin-actions">
            <button @click="sendToAll" :disabled="isSending" class="btn-primary">
              <span v-if="!isSending">🚀 Envoyer la newsletter</span>
              <span v-else>Envoi en cours...</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import supabase from '../services/supabaseConfig';
import AdminChart from '../components/AdminChart.vue';

const currentTab = ref('renewals');
const pendingRenewals = ref([]);
const feedbacks = ref([]);
const onlineUsers = ref(0);
const companies = ref([]);
const users = ref([]);
const search = ref('');
const onlineUsersCount = ref(0);
const onlineUsersList = ref([]); 

const isSending = ref(false);
const emailForm = reactive({
  subject: '',
  body: ''
});

let presenceChannel = null;

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

const fetchCompanies = async () => {
  const { data } = await supabase
    .from('company')
    .select(`
      *,
      employe_count:employe(count)
    `)
    .order('createdat', { ascending: false });
  console.log("Données des entreprises récupérées :", data);
  companies.value = data || [];
  console.log(companies.value);
};
const fetchUsers = async () => {
  const { data } = await supabase
    .from('user')
    .select(`
      *
    `)
    .order('createdat', { ascending: false });
  console.log("Données des utilisateurs récupérées :", data);
  users.value = data || [];
  console.log(users.value);
};

const extendTrial = async (ref) => {
  // Petite fonction pour offrir 3 jours gratuitement directement depuis le dashboard
  const { error } = await supabase.rpc('extend_company_subscription', { 
    target_ref: ref, 
    days_to_add: 3 
  });
  if(!error) fetchCompanies();
};

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

const sendToAll = async () => {
  if (!emailForm.subject || !emailForm.body) return alert("Champs vides !");
  
  isSending.value = true;
  
  // Construction du template HTML pro
  const finalHtml = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <tr>
                  <td style="background-color: #2563eb; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">OpenTask Update</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px; color: #334155; line-height: 1.6; font-size: 16px;">
                    <div style="margin-bottom: 20px;">
                      ${emailForm.body.replace(/\n/g, '<br>')} 
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
                    <p style="margin: 0;">Vous recevez cet email car votre entreprise est enregistrée sur OpenTask.</p>
                    <p style="margin: 5px 0 0 0;">&copy; 2026 OpenTask ERP - Tous droits réservés.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const { data: companies } = await supabase.from('company').select('email');
    const emailList = companies.map(c => c.email).filter(e => e);

    // On envoie le HTML final au service
    const { data, error } = await supabase.functions.invoke('send-bulk-email', {
      body: { 
        to: emailList, 
        subject: emailForm.subject, 
        html: finalHtml 
      },
      headers: {
        // Cela transmet ton JWT (token) à la fonction pour prouver que tu es admin
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (error) throw error;
    alert("Newsletter envoyée avec succès !");
  } catch (err) {
    alert("Erreur : " + err.message);
  } finally {
    isSending.value = false;
  }
};

const toggleModule = async (company, moduleName) => {
  // On récupère la liste actuelle ou un tableau vide
  let currentModules = company.active_modules || [];
  
  if (currentModules.includes(moduleName)) {
    // Si déjà présent, on le retire
    currentModules = currentModules.filter(m => m !== moduleName);
  } else {
    // Sinon, on l'ajoute
    currentModules.push(moduleName);
  }

  // Mise à jour dans Supabase
  const { error } = await supabase
    .from('company')
    .update({ active_modules: currentModules })
    .eq('id', company.id);

  if (!error) {
    // Mise à jour locale pour éviter de recharger toute la liste
    company.active_modules = currentModules;
  } else {
    alert("Erreur lors de la mise à jour des modules : " + error.message);
  }
};

const getExpiryClass = (date) => {
  // Ajoute ici ta logique de couleur pour les dates d'expiration
  const today = new Date();
  const expiry = new Date(date);
  const diffInDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffInDays < 0) return 'date-expired';
  if (diffInDays < 30) return 'date-warning';
  return 'date-normal';
};

onMounted(() => {
    fetchData();
    fetchCompanies()
    fetchUsers()
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

.module-toggles {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.mod-pill {
  font-size: 0.7rem;
  padding: 4px 8px;
  border-radius: 20px;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
  user-select: none;
}

.mod-pill:hover {
  border-color: #2563eb;
}

.mod-pill.active {
  background: #dbeafe;
  color: #1e40af;
  border-color: #bfdbfe;
  font-weight: 600;
}
.date-expired {
  color: #ef4444;
  font-weight: bold;
}
.date-warning {
  color: #f59e0b;
  font-weight: bold;
}
.date-normal {
  color: #10b981;
}
</style>
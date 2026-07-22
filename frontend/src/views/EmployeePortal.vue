<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { api } from '../services/api.js';
import QrcodeVue from 'qrcode.vue';
import { useUserStore } from '../store/index';
import { downloadContract, downloadPaySlip } from '../services/pdfGenerator'; 
import AppIcon from '../components/AppIcon.vue';
import { triggerToast } from '../services/toast.js';

const userStore = useUserStore();
const myPayroll = ref([]);
const loading = ref(true);
const attendanceRecord = ref(null);
const currentTime = ref(new Date().toLocaleTimeString());

// Nouvelles références
const myTasks = ref([]);
const myProjects = ref([]);
const myContracts = ref([]);
const companyInfo = ref(userStore.user.company);
const requestLeaveOpen = ref(false);
const isSubmittingLeave = ref(false);
const leaveRequest = ref({
  type: '',
  startDate: '',
  endDate: '',
  reason: ''
});
const attendanceSubscription = ref(null);

// Fonction pour écouter les changements de présence en temps réel
/*const subscribeToAttendance = () => {
  const empId = userStore.user.employe.id;

  attendanceSubscription.value = supabase
    .channel('public:attendance')
    .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'attendance', 
        filter: `employee_id=eq.${empId}` 
      }, 
      (payload) => {
        console.log('Changement détecté:', payload);
        // Si c'est une nouvelle insertion ou une mise à jour (départ)
        attendanceRecord.value = payload.new;
      }
    )
    .subscribe();
};*/

setInterval(() => {
  currentTime.value = new Date().toLocaleTimeString();
}, 1000);

const fetchMyData = async () => {
  loading.value = true;
  const empref = userStore.user.employe.empref;
  const company = userStore.user.company;
  const userRef = userStore.user.user.userref;

  try {
    let teamMemberships;
    // 1. Paie
    const payResponse = await api.get(`/payroll/get-my-history/${empref}`)
    if(payResponse.data.success === true){
      const collabResponse = await api.get(`/collaborator/get-collab-user/${userRef}`) 

      if(collabResponse.data.success === true) {
        const collaborations = collabResponse.data.data.map(async (col) => {
          const projectRef = col.projectref
          const teamResponse = await api.get(`/team/project/${projectRef}`)
          if(teamResponse.data.success === true){
            teamMemberships = {
              userref: userRef,
              role: col.role,
              team: teamResponse
            }
          }
        })
      }
    }

    if (teamMemberships && teamMemberships.length > 0) {
      const projectRefs = teamMemberships.map(t => ({projectref: t.team.projectref, role: t.role}));

      const projects = projectRefs.map(async(p) => {
        const projectResponse = await api.get(`/project/`)
        if(projectReponse.data.success === false)
          return {}
        return projectResponse.data.data
      })

      // 3. Fusionner : on ajoute le rôle correspondant à chaque projet
      myProjects.value = projectsData.map(proj => {
        const membership = teamMemberships.find(t => ({projectref: t.projectref, role: t.role}));
        return {
          ...proj,
          myRole: membership ? membership.role : 'Membre'
        };
      });
    }

    // 3.3. Mes Tâches (filtrées par userref)
    const assignResponse = await api.get(`/assignment/get-user-assignments/${userStore.user.user.userref}`)
    if(assignResponse.data.success ===true ){
      const assignments = assignResponse.data.data;
      assignments.map(async(ass) =>{
        const taskRes = await api.get(`/task/get-tasks/${ass.projectref}`)
        if(taskRes.data.success === false)
          return [];
        return taskRes.data.data;
      })
    }

  } catch (err) {
    console.error("Erreur portail:", err.message);
  } finally {
    loading.value = false;
  }
};

// Logique d'alerte pour les tâches
const getTaskStatus = (task) => {
  const today = new Date();
  const deadline = new Date(task.deadline);
  if (task.progress < 100 && deadline < today) return 'retard';
  if (task.progress < 100 && (deadline - today) < 172800000) return 'urgent'; // < 48h
  return 'normal';
};

const checkTodayAttendance = async () => {
  const empref = userStore.user.employe?.empref;
  if (!empref) return;

const today = new Date().toISOString().split('T')[0];
const response = await api.get(`/attendance/check-today-attendance/${empref}/${today}`)

  if (response.data.success === false) attendanceRecord.value = [];
  attendanceRecord.value = response.data.data;
};

const submitLeaveRequest = async () => {
  try{
    isSubmittingLeave.value = true;

    const response = await api.post('/leave/new-request', {
      employee_id: userStore.user.employe.id,
      employee_name: `${userStore.user.user.firstname} ${userStore.user.user.lastname}`,
      companyref: userStore.user.company.companyref,
      type: leaveRequest.type,
      start_date: leaveRequest.value.startDate,
      end_date: leaveRequest.value.endDate,
      duration_days: Math.ceil((new Date(leaveRequest.value.endDate) - new Date(leaveRequest.value.startDate)) / (1000 * 60 * 60 * 24)) + 1,
      reason: leaveRequest.value.reason,
      status: 'pending'
    })
    if(response.data.success){
      triggerToast("Demande envoyée", "success");
      requestLeaveOpen.value = false;
      // Réinitialiser le formulaire
      leaveRequest.value = {
        type: '',
        startDate: '',
        endDate: '',
        reason: ''
      };
    } else {
      triggerToast(response.data.message, "error");
    }
  }catch(e){
    console.error("Erreur lors de la soumission de la demande de congé:", e);
    triggerToast(e, "error");
    isSubmittingLeave.value = false;
  }
};

const handlePunch = async () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (!attendanceRecord.value) {
    const limitTime = 8;
    const isLate = now.getHours() >= limitTime && now.getMinutes() > 0;

    const response = await api.post('/attendance/new', {
      employee_id: userStore.user.employe.id,
      companyref: userStore.user.employe.companyref,
      date: today,
      check_in: now.toISOString(),
      status: isLate ? 'retard' : 'present'
    })
    
    if (response.data.sucess === true)attendanceRecord.value = response.data.data;
  } else {    
    const response = await api.put(`/attendance/check-out/${attendanceRecord.value.id}`,{ check_out: now.toISOString() } )
    if (response.data.success === true) attendanceRecord.value = data;

    if (attendanceRecord.value.check_out) return triggerToast("Journée terminée!", "success");
  }
};

onMounted(() => {
    fetchMyData();
    checkTodayAttendance();
    //subscribeToAttendance();
});

onUnmounted(() => {
    if (attendanceSubscription.value) {
        supabase.removeChannel(attendanceSubscription.value);
    }
});
</script>

<template>
  <div class="modal" v-if="requestLeaveOpen" @click.self="requestLeaveOpen = false">
    <div class="request-leave-form">
      <label for="type">Type de congé:</label>
      <select id="type" v-model="leaveRequest.type">
        <option value="annuel">Congé annuel</option>
        <option value="maladie">Congé maladie</option>
        <option value="autre">Autre</option>
      </select>
      <label for="startDate">Date de début:</label>
      <input type="date" id="startDate" v-model="leaveRequest.startDate">
      <label for="enddate">Date de fin:</label>
      <input type="date" id="enddate" v-model="leaveRequest.endDate">
      <label for="reason">Motif:</label>
      <textarea id="reason" v-model="leaveRequest.reason"></textarea>
      <button @click="submitLeaveRequest" class="btn-submit">{{ isSubmittingLeave ? 'Soumission en cours...' : 'Soumettre la demande' }}</button>
    </div>
  </div>
  
  <div class="portal-container">
    <header class="portal-header card">
      <div class="header-main">
        <h1>Bienvenue, {{ userStore.user.user.firstname }}</h1>
        <p class="job-title"> <AppIcon name="COMPANY" size="20" /> {{ userStore.user.employe.position }} | {{ companyInfo?.companyname }}</p>
      </div>
      <div class="company-mini-details" v-if="companyInfo">
        <span> <AppIcon name="MAP_PIN" size="20" /> {{ companyInfo.address }}</span>
        <span> <AppIcon name="PHONE" size="20" /> {{ companyInfo.phone }}</span>
      </div>
    </header>

    <div class="portal-layout">
      <div class="left-col">
        <section class="attendance-card card">
    <div class="clock-display">
        <span class="live-time">{{ currentTime }}</span>
        <p>{{ new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) }}</p>
    </div>

    <div class="punch-actions">
        <div v-if="!attendanceRecord" class="qr-container">
            <qrcode-vue 
                :value="userStore.user.company.companyref" 
                :size="180" 
                level="H" 
                render-as="svg"
                class="qr-code"
            />
            <p class="qr-hint">Scannez ce code pour pointer votre arrivée</p>
        </div>

        <button v-else-if="!attendanceRecord.check_out" @click="handlePunch" class="btn-punch out">
            <AppIcon name="LOCK" size="20" /> Enregistrer mon Départ
        </button>

        <div v-else class="day-completed">
            <div class="success-icon">
                <AppIcon name="CHECK" size="40" />
            </div>
            <p>Journée terminée. À demain !</p>
        </div>

        <div class="btn-leave-request" @click="requestLeaveOpen = !requestLeaveOpen">
            <AppIcon name="CALENDAR" size="20" /> Demander un congé
        </div>
    </div>
</section>

        <section class="projects-section card">
          <h3><AppIcon name="PROJECTS" size="20" /> Mes Projets en cours</h3>
          <div class="project-list">
            <div v-for="proj in myProjects" :key="proj.id" class="mini-project-card">
              <div class="proj-header">
                <strong>{{ proj.projectname }}</strong>
                <span class="role-badge">{{ proj.myRole }}</span>
              </div>
              <div class="proj-footer">
                <span class="status-dot" :class="proj.status"></span>
                <small>Statut: {{ proj.status }}</small>
              </div>
            </div>
            <p v-if="myTasks.length === 0" class="empty-msg">Aucun projet assigné pour le moment.</p>
          </div>
        </section>
        <section class="tasks-section card">
          <h3><AppIcon name="CLIPBOARD" size="20" /> Mes Missions & Alertes</h3>
          <div class="task-list">
            <div v-for="task in myTasks" :key="task.taskref" :class="['task-item', getTaskStatus(task)]">
              <div class="task-info">
                <strong>{{ task.tasks.taskname }}</strong>
                <small>{{ task.tasks.project?.projectname }}</small>
              </div>
              <div class="task-meta">
                <span class="due-date"><AppIcon name="CALENDAR" size="20" /> {{ task.tasks.enddate.split('T')[0] }}</span>
                <div class="progress-bar-mini">
                  <div class="progress" :style="{backgroundColor: task.tasks.status === 'pending' ? '#f59e0b' : task.tasks.status === 'completed' ? '#10b981' : '#ef4444'}"></div>
                </div>
              </div>
              <span v-if="getTaskStatus(task) === 'retard'" class="alert-tag">RETARD</span>
            </div>
            <p v-if="myTasks.length === 0" class="empty-msg">Aucune tâche assignée.</p>
          </div>
        </section>
      </div>

      <div class="right-col">
        <div class="stats-overview">
          <div class="card mini">
            <span>Dernier salaire</span>
            <strong>{{ myPayroll[0]?.net_salary.toLocaleString() || 0 }} XAF</strong>
          </div>
          <div class="card mini">
            <span>Projets actifs</span>
            <strong>{{ myProjects.length }}</strong>
          </div>
        </div>

        <section class="payroll-list card">
          <h3>Mes Bulletins de Paie</h3>
          <div v-if="loading" class="loader">Chargement...</div>
          <div v-else class="table-wrapper">
            <table class="portal-table">
              <thead>
                <tr>
                  <th>Période</th>
                  <th>Net perçu</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="pay in myPayroll.slice(0, 5)" :key="pay.id">
                  <td><strong>{{ pay.month }}</strong></td>
                  <td>{{ pay.net_salary.toLocaleString() }}</td>
                  <td><button @click="downloadPaySlip(pay, userStore.user.company)" class="btn-pdf-icon"><AppIcon name="IMPORT" size="20" /></button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section class="contracts-list card">
          <h3>Mes Contrats de travail</h3>
          <div v-if="loading" class="loader">Chargement...</div>
          <div v-else class="table-wrapper">
            <table class="portal-table">
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Type de contrat</th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="contract in myContracts.slice(0, 5)" :key="contract.id">
                  <td><strong>{{ contract.company }}</strong></td>
                  <td>{{ contract.type_contrat }}</td>
                  <td>{{ contract.start_period }}</td>
                  <td>{{ contract.end_period }}</td>
                  <td><button @click="downloadContract(userStore.user.employe)" class="btn-pdf-icon"><AppIcon name="IMPORT" size="20" /></button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal{
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.request-leave-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.request-leave-form label {
  font-weight: 600;
}
.request-leave-form input,
.request-leave-form select,
.request-leave-form textarea {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px; 
}
.request-leave-form .btn-submit {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
}
.request-leave-form .btn-submit:hover {
  background: #2563eb;
}
.portal-container { padding: 2rem; padding-top: 70px; max-width: 1200px; margin: 0 auto; background: #f8fafc; }
.portal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; margin-bottom: 2rem; border-top: 5px solid #1e293b; }
.job-title { color: #64748b; font-weight: 500; }

.portal-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }

.card { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 1.5rem; }

/* Styles Tâches */
.task-list { margin-top: 1rem; }
.task-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #f1f5f9; position: relative; }
.task-item.retard { background: #fef2f2; border-left: 4px solid #ef4444; }
.task-item.urgent { border-left: 4px solid #f59e0b; }
.task-info strong { display: block; font-size: 0.95rem; }
.task-info small { color: #94a3b8; font-size: 0.8rem; }

.progress-bar-mini { width: 60px; height: 6px; background: #e2e8f0; border-radius: 10px; margin-top: 5px; }
.progress { height: 100%; background: #3b82f6; border-radius: 10px; }

.alert-tag { background: #ef4444; color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; }

/* Pointage existant adapté */
.live-time { font-size: 2rem; font-weight: 800; color: #1e293b; }
.btn-punch { width: 100%; padding: 0.8rem; border-radius: 8px; cursor: pointer; font-weight: bold; border: none; transition: 0.3s; }
.btn-punch.in { background: #10b981; color: white; }
.btn-punch.out { background: #ef4444; color: white; }

.stats-overview { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.btn-pdf-icon { background: #f1f5f9; border: none; border-radius: 4px; cursor: pointer; padding: 5px 10px; }

@media (max-width: 900px) {
  .portal-layout { grid-template-columns: 1fr; }
}
.mini-project-card {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 10px;
  background: #fff;
}

.proj-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.role-badge {
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.proj-footer {
  display: flex;
  align-items: center;
  gap: 6px;
}

.proj-footer small { color: #94a3b8; font-size: 0.8rem; }

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.actif { background: #10b981; }
.status-dot.en_pause { background: #f59e0b; }
.status-dot.termine { background: #64748b; }
.qr-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 12px;
    border: 2px dashed #cbd5e1;
    margin-bottom: 1rem;
}

.qr-code {
    background: white;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.qr-hint {
    margin-top: 1rem;
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 500;
    text-align: center;
}

.day-completed {
    text-align: center;
    padding: 1.5rem;
    color: #10b981;
    font-weight: bold;
}

.success-icon {
    margin-bottom: 10px;
    color: #10b981;
}

.btn-leave-request {
    margin-top: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    color: #2a2f4f;
    font-size: 0.9rem;
    font-weight: 600;
    text-decoration: underline;
}
</style>
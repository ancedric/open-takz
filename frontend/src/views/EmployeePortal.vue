<script setup>
import { ref, onMounted, computed } from 'vue';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';
import { downloadPaySlip } from '../services/pdfGenerator'; 
import AppIcon from '../components/AppIcon.vue';

const userStore = useUserStore();
const myPayroll = ref([]);
const loading = ref(true);
const attendanceRecord = ref(null);
const currentTime = ref(new Date().toLocaleTimeString());

// Nouvelles références
const myTasks = ref([]);
const myProjects = ref([]);
const companyInfo = ref(null);

setInterval(() => {
  currentTime.value = new Date().toLocaleTimeString();
}, 1000);

const fetchMyData = async () => {
  loading.value = true;
  const empId = userStore.user.employe.id;
  const companyRef = userStore.user.company.companyref;
  const userRef = userStore.user.user.userref;

  try {
    // 1. Paie
    const { data: payroll } = await supabase
      .from('payroll_history')
      .select('*')
      .eq('employee_id', empId)
      .order('created_at', { ascending: false });
    myPayroll.value = payroll || [];

    // 2. Infos Entreprise
    const { data: comp } = await supabase
      .from('company') // Assure-toi que le nom de la table est 'companies'
      .select('*')
      .eq('companyref', companyRef)
      .single();
    companyInfo.value = comp;

    // 3. Projets (où l'employé est dans l'équipe)
    const { data: teamMemberships, error: teamErr } = await supabase
      .from('team')
      .select('projectref, role')
      .eq('userref', userRef);

    if (teamErr) throw teamErr;

    if (teamMemberships && teamMemberships.length > 0) {
      const projectRefs = teamMemberships.map(t => t.projectref);

      // 2. Récupérer les projets
      const { data: projectsData, error: projErr } = await supabase
        .from('project')
        .select('*')
        .in('projectref', projectRefs);

      if (projErr) throw projErr;

      // 3. Fusionner : on ajoute le rôle correspondant à chaque projet
      myProjects.value = projectsData.map(proj => {
        const membership = teamMemberships.find(t => t.projectref === proj.projectref);
        return {
          ...proj,
          myRole: membership ? membership.role : 'Membre'
        };
      });
    }

    // 3.3. Mes Tâches (filtrées par userref)
    // Note : Vérifie si dans ta table 'task' le champ est 'assigned_to' ou 'userref'
    const { data: tasks, error: taskErr } = await supabase
      .from('assignments')
      .select('*, tasks:taskref(*, project: projectref(projectname))')
      .eq('userref', userStore.user.user.userref) 

    if (taskErr) console.error("Erreur Tâches:", taskErr.message);
    myTasks.value = tasks || [];
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
  const empId = userStore.user.employe?.id;
  if (!empId) return;

const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', empId)
    .eq('date', today)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') console.error(error);
  if (data) attendanceRecord.value = data;
};

const handlePunch = async () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (!attendanceRecord.value) {
    const limitTime = 8;
    const isLate = now.getHours() >= limitTime && now.getMinutes() > 0;
    const { data, error } = await supabase.from('attendance').insert([{
      employee_id: userStore.user.employe.id,
      companyref: userStore.user.employe.companyref,
      date: today,
      check_in: now.toISOString(),
      status: isLate ? 'retard' : 'present'
    }]).select().single();
    if (!error)attendanceRecord.value = data;
  } else {
    if (attendanceRecord.value.check_out) return triggerToast("Journée terminée!", "success");
    const { data, error } = await supabase.from('attendance')
      .update({ check_out: now.toISOString() })
      .eq('id', attendanceRecord.value.id)
      .select().single();
    if (!error) attendanceRecord.value = data;
  }
};

onMounted(() => {
    fetchMyData();
    checkTodayAttendance();
});
</script>

<template>
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
                <button v-if="!attendanceRecord" @click="handlePunch" class="btn-punch in"> <AppIcon name="MAP_PIN" size="20" /> Arrivée</button>
                <button v-else-if="!attendanceRecord.check_out" @click="handlePunch" class="btn-punch out"> <AppIcon name="LOCK" size="20" /> Départ</button>
                <div v-else class="day-completed"> <AppIcon name="CHECK" size="20" /> Journée terminée</div>
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
            <p v-if="myProjects.length === 0" class="empty-msg">Aucun projet assigné pour le moment.</p>
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
                  <td><button @click="downloadPaySlip(pay)" class="btn-pdf-icon"><AppIcon name="IMPORT" size="20" /></button></td>
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
</style>
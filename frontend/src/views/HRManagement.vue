<script setup>
import { ref, onMounted } from 'vue';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

// États
const employees = ref([]);
const departments = ref([]);
const loading = ref(true);
const newDeptName = ref('');
const isCreatingDept = ref(false);

// 1. SÉCURITÉ : Vérification des accès
const checkAccess = () => {
  const role = userStore.user.privilege;
  if (role !== 'owner' && role !== 'hr') {
    alert("Accès refusé : Vous n'avez pas les droits RH.");
    router.push('/home');
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    // Récupérer les départements
    const { data: deptData } = await supabase
      .from('department')
      .select('*')
      .eq('companyref', userStore.user.companyref);
    departments.value = deptData;

    // Récupérer les employés
    const { data: userData } = await supabase
      .from('user')
      .select('*')
      .eq('companyref', userStore.user.companyref)
      .order('lastname', { ascending: true });
    employees.value = userData;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 2. FONCTION : Créer un département
const handleCreateDept = async () => {
  if (!newDeptName.value.trim()) return;
  isCreatingDept.value = true;
  
  const dRef = 'DEPT-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  
  const { error } = await supabase
    .from('department')
    .insert([{
      deptref: dRef,
      deptname: newDeptName.value,
      companyref: userStore.user.companyref
    }]);

  if (!error) {
    newDeptName.value = '';
    await fetchData(); // Actualise la liste et les menus déroulants
  }
  isCreatingDept.value = false;
};

// 3. ACTIONS : Mise à jour employés
const updateRole = async (userRef, newRole) => {
  await supabase.from('user').update({ privilege: newRole }).eq('userref', userRef);
};

const updateDept = async (userRef, deptRef) => {
  await supabase.from('user').update({ deptref: deptRef }).eq('userref', userRef);
};

onMounted(() => {
  checkAccess();
  fetchData();
});
</script>

<template>
  <div class="hr-page">
    <div class="hr-card">
      <div class="header">
        <h2>👥 Gestion RH - {{ userStore.user.companyname }}</h2>
        <button @click="fetchData" class="btn-refresh">🔄</button>
      </div>

      <div class="dept-creation-zone">
        <h4>Ajouter un nouveau département</h4>
        <div class="dept-form">
          <input 
            v-model="newDeptName" 
            placeholder="Nom du service (ex: Marketing, IT...)" 
            class="dept-input"
            @keyup.enter="handleCreateDept"
          >
          <button @click="handleCreateDept" :disabled="isCreatingDept" class="btn-add">
            {{ isCreatingDept ? '...' : '+ Créer' }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="loader">Synchronisation avec Supabase...</div>

      <table v-else class="emp-table">
        <thead>
          <tr>
            <th>Collaborateur</th>
            <th>Département</th>
            <th>Rôle ERP</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="emp in employees" :key="emp.userref">
            <td>
              <div class="user-info">
                <img :src="emp.profilephotourl || '/default-avatar.png'" class="avatar">
                <div>
                  <div class="name">{{ emp.firstname }} {{ emp.lastname }}</div>
                  <div class="email">{{ emp.email }}</div>
                </div>
              </div>
            </td>
            <td>
              <select v-model="emp.deptref" @change="updateDept(emp.userref, emp.deptref)" class="table-select">
                <option :value="null">Aucun service</option>
                <option v-for="d in departments" :key="d.deptref" :value="d.deptref">
                  {{ d.deptname }}
                </option>
              </select>
            </td>
            <td>
              <select 
                v-model="emp.privilege" 
                @change="updateRole(emp.userref, emp.privilege)"
                :disabled="emp.userref === userStore.user.userref"
                class="table-select"
              >
                <option value="user">Employé</option>
                <option value="dept_manager">Manager</option>
                <option value="hr">RH Manager</option>
                <option value="owner">Propriétaire</option>
              </select>
            </td>
            <td>
              <button class="btn-icon">📁 Dossier</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.hr-page { padding: 2rem; }
.hr-card { background: white; border-radius: 15px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
.header { display: flex; justify-content: space-between; margin-bottom: 2rem; }

.dept-creation-zone { 
  background: #f8fafc; 
  padding: 1rem; 
  border-radius: 10px; 
  margin-bottom: 2rem;
  border: 1px dashed #cbd5e1;
}
.dept-form { display: flex; gap: 10px; margin-top: 10px; }
.dept-input { flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid #ddd; }
.btn-add { background: #1e293b; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; }

.emp-table { width: 100%; border-collapse: collapse; }
.emp-table th { text-align: left; padding: 12px; color: #64748b; border-bottom: 2px solid #f1f5f9; }
.emp-table td { padding: 15px 12px; border-bottom: 1px solid #f1f5f9; }

.user-info { display: flex; align-items: center; gap: 12px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.name { font-weight: 600; color: #1e293b; }
.email { font-size: 0.8rem; color: #94a3b8; }

.table-select { 
  padding: 6px; 
  border-radius: 6px; 
  border: 1px solid #e2e8f0; 
  background: #fff;
  font-size: 0.9rem;
}

.btn-icon { background: #f1f5f9; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
</style>
<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import supabase from '../services/supabaseConfig';
import downloadPaySlip from '../services/supabaseConfig';
import { useUserStore } from '../store/index';
import DefaultAvatar from '../assets/images/Default-avatar.png'
import { useRouter } from 'vue-router';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const userStore = useUserStore();
const router = useRouter();

// États
const employees = ref([]);
const departments = ref([]);
const payslips = ref([]);
const loading = ref(true);
const newDeptName = ref('');
const newEmpEmail = ref ('');
const isCreatingDept = ref(false);
const isCreatingEmp = ref(false);
const openEmpForm = ref(false);
const isProcessingPayment = ref(false);
const filterType = ref('employees');
const userResult = ref (null);
//Données de création d'un employé
const empRef = ref('');
const companyRef = ref(userStore.user.company.companyref)
const position = ref('');
const salary = ref('');
const paymentDay = ref('')
const privilege = ref('employe');
const legalForm = ref(''); // Récupéré depuis l'objet company
const companyData = ref(null);
const isProcessing = ref(false);
const showFileModal = ref(false);
const uploadingFile = ref(false);
const selectedEmployee = ref(null);
const selectedMonth = ref(new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' }));

const pendingLeaves = ref([]);
const attendanceToday = ref([]);
const allEmployees = ref([]);
const monthlySummary = ref([]);
const showPayConfirmModal = ref(false);
const processingEmp = ref(null);
const paySummary = ref({});
const showPayModal = ref(false);
const payDetails = ref(null);

const upcomingPayments = computed(() => {
  const today = new Date().getDate();
  return employees.value.filter(emp => {
    const payDay = parseInt(emp.paymentday);
    if (!payDay) return false;
    
    // Si la paie est entre aujourd'hui et J+5
    const diff = payDay - today;
    return diff >= 0 && diff <= 5;
  });
});

const openPayModal = (employee) => {
  const summary = monthlySummary.value.find(s => s.name === employee.user.firstname + ' ' + employee.user.lastname);
  const theoreticalDays = 22;
  const actualDays = summary ? (summary.presentDays + summary.leaveDays) : theoreticalDays;
  const missedDays = Math.max(0, theoreticalDays - actualDays);
  const dailyRate = employee.salary / theoreticalDays;
  const absenceDeduction = Math.round(dailyRate * missedDays);
  const adjustedBrut = employee.salary - absenceDeduction;
  const socialCharges = calculateCNPS(adjustedBrut);

  payDetails.value = {
    employee,
    missedDays,
    absenceDeduction,
    adjustedBrut,
    socialCharges,
    net: adjustedBrut - socialCharges
  };
  showPayModal.value = true;
};

// 1. SÉCURITÉ : Vérification des accès
const checkAccess = () => {
  const role = userStore.user.employe.privilege;
  if (role !== 'owner' && role !== 'hr') {
    alert("Accès refusé : Vous n'avez pas les droits RH.");
    router.push('/home');
  }
};

const openEmployeeFile = (emp) => {
  selectedEmployee.value = emp;
  showFileModal.value = true;
};

const closeFileModal = () => {
  showFileModal.value = false;
  selectedEmployee.value = null;
};

const uploadDoc = async (event, type, empId) => {
  const file = event.target.files[0];
  if (!file) return;

  uploadingFile.value = true;
  const fileExt = file.name.split('.').pop();
  const filePath = `docs/${empId}/${type}_${Date.now()}.${fileExt}`;

  try {
    // 1. Upload vers le bucket 'opentasks_bucket'
    const { error: uploadError } = await supabase.storage
      .from('opentasks_bucket')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('opentasks_bucket')
      .getPublicUrl(filePath);

    // 3. Mettre à jour la table employe
    const updateData = {};
    updateData[type === 'contract' ? 'contract_url' : 'medical_cert_url'] = urlData.publicUrl;

    const { error: dbError } = await supabase
      .from('employe')
      .update(updateData)
      .eq('userref', empId);

    if (dbError) throw dbError;

    // Mettre à jour l'affichage local
    selectedEmployee.value[type === 'contract' ? 'contract_url' : 'medical_cert_url'] = urlData.publicUrl;
    alert("Document mis à jour avec succès !");
  } catch (err) {
    alert("Erreur lors de l'envoi : " + err.message);
  } finally {
    uploadingFile.value = false;
  }
};

// Fonction pour ouvrir le document dans un nouvel onglet
const viewDoc = (url) => {
  if (url) window.open(url, '_blank');
};
const fetchPayslips = async () => {
  try {
    const { data, error } = await supabase
      .from('payslip')
      .select(`
        *,
        employe:employe (
          position,
          user:user (firstname, lastname, email)
        )
      `)
      .eq('company_ref', userStore.user.company.companyref)
      .order('generated_at', { ascending: false });

    if (error) throw error;
    payslips.value = data;
  } catch (err) {
    console.error("Erreur payslips:", err);
  }
};

const handlePayAll = async () => {
  if (!confirm("Voulez-vous marquer tous les bulletins de ce mois comme 'Payés' ?")) return;
  
  isProcessingPayment.value = true;
  try {
    const { error } = await supabase
      .from('payslip')
      .update({ status: 'paid' })
      .eq('company_ref', userStore.user.company.companyref)
      .eq('status', 'draft');

    if (error) throw error;

    alert("Paiements validés avec succès !");
    await fetchPayslips(); 
  } catch (err) {
    console.error("Erreur lors de la validation des paiements:", err);
    alert("Une erreur est survenue.");
  } finally {
    isProcessingPayment.value = false;
  }
};

const calculateCNPS = (baseSalary) => {
  const PLAFOND_CNPS = 750000;
  const TAUX_SALARIAL = 0.042; // 4,2%

  // L'assiette de cotisation est le salaire de base, mais limitée au plafond
  const assiette = Math.min(baseSalary, PLAFOND_CNPS);
  
  return Math.round(assiette * TAUX_SALARIAL);
};

const preparePayroll = (employee) => {
  const summary = monthlySummary.value.find(s => s.name === `${employee.user.firstname} ${employee.user.lastname}`);
  const theoreticalDays = 22;
  const actualDays = summary ? (summary.presentDays + summary.leaveDays) : theoreticalDays;
  const missedDays = Math.max(0, theoreticalDays - actualDays);
  const absenceDeduction = Math.round((employee.salary / theoreticalDays) * missedDays);
  const adjustedBrut = employee.salary - absenceDeduction;
  const socialCharges = calculateCNPS(adjustedBrut);

  paySummary.value = {
    employee,
    missedDays,
    absenceDeduction,
    adjustedBrut,
    socialCharges,
    netToPay: adjustedBrut - socialCharges
  };
  
  processingEmp.value = employee;
  showPayConfirmModal.value = true;
};

const validatePayroll = async (employee) => {
  // 0. Vérification anti-doublon
  const isAlreadyPaid = await checkExistingPayroll(employee.id, selectedMonth.value);
  if (isAlreadyPaid) {
    alert(`La paie de ${employee.user.firstname} ${employee.user.lastname} pour ${selectedMonth.value} a déjà été validée.`);
    return;
  }

  // 1. Récupérer le bilan d'assiduité
  const summary = monthlySummary.value.find(s => s.name === employee.user.firstname + ' ' + employee.user.lastname);
  
  // --- CALCUL DU TEMPS ---
  const theoreticalDays = 22;
  const actualDays = Math.min(theoreticalDays, (summary ? summary.presentDays + summary.leaveDays : theoreticalDays));
  const missedDays = Math.max(0, theoreticalDays - actualDays);

  // --- CALCUL DU BRUT APRÈS ABSENCES ---
  const dailyRate = employee.salary / theoreticalDays;
  const absenceDeduction = Math.round(dailyRate * missedDays);
  const adjustedBrut = employee.salary - absenceDeduction;

  // --- CALCUL DES CHARGES SOCIALES (CNPS) ---
  const socialCharges = calculateCNPS(adjustedBrut);
  
  // --- CALCUL FINAL ---
  // Note: Pour une précision totale, il faudrait soustraire l'IRPP, 
  // la Taxe Communale et le Crédit Foncier, mais restons sur la CNPS pour l'instant.
  const finalNet = adjustedBrut - socialCharges;

  // 3. Dialogue de confirmation détaillé (Pratique pour le RH)
  const confirmMsg = `SYNTHÈSE DE PAIE : ${employee.user.firstname} ${employee.user.lastname}\n` +
    `-----------------------------------\n` +
    `Période : ${selectedMonth.value}\n` +
    `Jours Absence : ${missedDays} j\n` +
    `Retenue : -${Math.round(absenceDeduction).toLocaleString()} XAF\n
    -----------------------------------------
    Salaire de Base : ${employee.salary.toLocaleString()} XAF
    Retenue Absence (${missedDays}j) : -${absenceDeduction.toLocaleString()} XAF
    -----------------------------------------
    BRUT TAXABLE : ${adjustedBrut.toLocaleString()} XAF
    Retenue CNPS (4,2%) : -${socialCharges.toLocaleString()} XAF
    -----------------------------------------
    NET À PAYER : ${Math.round(finalNet).toLocaleString()} XAF`;
    `-----------------------------------\n` +
    `NET À VIRER : ${finalNet.toLocaleString()} XAF\n\n` +
    `Confirmer l'enregistrement et l'envoi en comptabilité ?`;

  if (!confirm(confirmMsg)) return;

  // 4. Insertion avec toutes les métadonnées
  // Insertion dans Supabase...
  const { error } = await supabase
    .from('payroll_history')
    .insert([{
      employee_id: employee.id,
      companyref: userStore.user.employe.companyref,
      employee_name: employee.user.firstname + ' ' + employee.user.lastname,
      month: selectedMonth.value,
      base_salary: employee.salary,
      net_salary: Math.round(finalNet),
      absences_count: missedDays,
      absence_deduction: absenceDeduction,
      social_charges: socialCharges // Pense à ajouter cette colonne en SQL
    }]);

  if (!error) {
    alert("Succès : Bulletin archivé et flux financier créé.");
    // Optionnel : rafraîchir la liste pour griser le bouton valider
    fetchMonthlySummary(); 
  } else {
    alert("Erreur lors de la validation : " + error.message);
  }
};

// Fonction utilitaire pour éviter les doublons
const checkExistingPayroll = async (empId, month) => {
  const { data } = await supabase
    .from('payroll_history')
    .select('id')
    .eq('employee_id', empId)
    .eq('month', month)
    .maybeSingle();
  return !!data;
};

const fetchData = async () => {
  if (!userStore.user) {
        console.log("En attente des données utilisateur...");
        return; 
    }
  loading.value = true;
  try {
    //Récupérer l'entreprise
    const { data: compData } = await supabase
      .from('company')
      .select('legal_form, companyname')
      .eq('companyref', userStore.user.company.companyref)
      .single();
      
    companyData.value = compData;
    legalForm.value = compData.legal_form;
    // Récupérer les départements
    const { data: deptData, error: deptError } = await supabase
      .from('department')
      .select('*')
      .eq('companyref', userStore.user.company.companyref);
      if(deptError) console.error("erreur lors de la récupération des départements: ", deptError)
    departments.value = deptData;

    // Récupérer les employés
    const { data: userData } = await supabase
      .from('employe')
      .select('*')
      .eq('companyref', userStore.user.company.companyref)
      
    employees.value = userData;
    const { data: empData, error: empError } = await supabase
      .from('employe')
      .select(`
        *,
        user:user(*) 
      `)
      .eq('companyref', userStore.user.company.companyref);

    if (empError) throw empError;

    employees.value = empData;

    await fetchPayslips()
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Calcul du coût total (Simulation de paie)
const calculateTotalCost = (baseSalary, isOwner) => {
  let taxRate = 0.22; // Taux par défaut employé (22%)
  let patronalRate = 0.45; // Taux patronal par défaut

  // Logique selon la forme juridique
  if (isOwner) {
    if (legalForm.value === 'SARL') {
      // Gérant Majoritaire (TNS) : Pas de fiche de paie classique
      taxRate = 0.45; 
      patronalRate = 0; // Inclus dans les 45%
    } else if (legalForm.value === 'SAS') {
      // Président (Assimilé-Salarié) : Charges très élevées
      taxRate = 0.28;
      patronalRate = 0.54;
    }
  }

  const netNet = baseSalary * (1 - taxRate);
  const totalCost = baseSalary * (1 + patronalRate);

  return { netNet, totalCost };
};

const downloadPDF = (slip) => {
  const doc = new jsPDF();
  const title = `Bulletin de paie - ${slip.month_year}`;
  
  // Design du PDF
  doc.setFontSize(20);
  doc.text(userStore.user.company.companyname, 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(title, 105, 30, { align: 'center' });
  
  doc.line(20, 35, 190, 35);

  // Infos Employé
  doc.setFont(undefined, 'bold');
  doc.text(`Employé: ${slip.employe.user.firstname} ${slip.employe.user.lastname}`, 20, 50);
  doc.setFont(undefined, 'normal');
  doc.text(`Poste: ${slip.employe.position}`, 20, 56);
  doc.text(`Période: ${slip.month_year}`, 20, 62);

  // Tableau des montants
  doc.autoTable({
    startY: 75,
    head: [['Description', 'Montant (XAF)']],
    body: [
      ['Salaire de base (Brut)', slip.gross_salary.toLocaleString()],
      ['Cotisations sociales (est.)', `-${(slip.gross_salary - slip.net_salary).toLocaleString()}`],
      ['NET À PAYER', { content: slip.net_salary.toLocaleString(), styles: { fontStyle: 'bold' } }],
    ],
    theme: 'striped'
  });

  doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 20, doc.lastAutoTable.finalY + 20);
  
  // Téléchargement
  doc.save(`Fiche_Paie_${slip.employe.user.lastname}_${slip.month_year}.pdf`);
};

const handleSearchUser = async (email) => {
  try{
    const {data, error} = await supabase
      .from('user')
      .select("*")
      .eq("email", email)

      if(error) console.log("Utilisateur non trouvé!")
      else{
        const {data: emplData, error: emplError} = await supabase
          .from('employe')
          .select('*')
          .eq('userref', data[0].userref)

          console.log(emplData)
          if(emplError) console.log('employé non trouvé')
          else{
            userResult.value = [{user:data[0], employe:emplData[0]}]
            console.log('user result: ', userResult.value)}}
  } catch(err){
    console.error("Une erreur s'est produite lors de la recherche de l'utilisateur", err)
  }
}
const handleAddEmploye = async () =>{
  try{
    const userRef = userResult.value
    console.log(userRef)
    const {data, error} = await supabase
      .from('employe')
      .update([{
        companyref: companyRef.value,
        position: position.value,
        salary: salary.value,
        paymentday: paymentDay.value,
        privilege: privilege.value
      }])
      .eq('userref', userRef[0].user.userref)

      if(error) throw error
      openEmpForm.value = false
  } catch(err){
    console.error("Une erreur s'est produite lors de l'ajout de l'employé", err)
  }
}
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
      companyref: userStore.user.company.companyref
    }]);

  if (!error) {
    newDeptName.value = '';
    await fetchData(); // Actualise la liste et les menus déroulants
  }
  isCreatingDept.value = false;
};

// 3. ACTIONS : Mise à jour employés
const updateRole = async (userRef, newRole) => {
  await supabase.from('employe').update({ privilege: newRole }).eq('userref', userRef);
};

const updateDept = async (userRef, deptRef) => {
  await supabase.from('employe').update({ deptref: deptRef }).eq('userref', userRef);
}; 

const fetchAttendanceAndLeaves = async () => {
  const companyRef = userStore.user.employe.companyref;
  const today = new Date().toISOString().split('T')[0];

  // 1. Charger les pointages du jour
  const { data: attData } = await supabase
    .from('attendance')
    .select('*, employe(name, job_title)')
    .eq('companyref', companyRef)
    .eq('date', today);
  attendanceToday.value = attData || [];

  // 2. Charger les demandes de congés en attente
  const { data: leaveData } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('companyref', companyRef)
    .eq('status', 'en_attente');
  pendingLeaves.value = leaveData || [];
};

// Action pour approuver ou refuser un congé
const updateLeaveStatus = async (id, newStatus) => {
  const { error } = await supabase
    .from('leave_requests')
    .update({ status: newStatus })
    .eq('id', id);

  if (!error) {
    alert(`Demande ${newStatus} avec succès`);
    fetchAttendanceAndLeaves(); // Rafraîchir la liste
  }
};

const fetchMonthlySummary = async () => {
  const companyRef = userStore.user.employe.companyref;
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

  // 1. Récupérer tous les pointages du mois
  const { data: attendances } = await supabase
    .from('attendance')
    .select('employee_id, status')
    .eq('companyref', companyRef)
    .gte('date', firstDay)
    .lte('date', lastDay);

  // 2. Récupérer les congés approuvés du mois
  const { data: leaves } = await supabase
    .from('leave_requests')
    .select('employee_id, duration_days')
    .eq('companyref', companyRef)
    .eq('status', 'approuvé');

  // 3. Calculer par employé
  monthlySummary.value = employees.value.map(emp => {
    const empAtt = attendances?.filter(a => a.employee_id === emp.id) || [];
    const empLeaves = leaves?.filter(l => l.employee_id === emp.id) || [];
    
    return {
      name: emp.user.firstname + ' ' + emp.user.lastname,
      presentDays: empAtt.filter(a => a.status === 'present' || a.status === 'retard').length,
      lateCount: empAtt.filter(a => a.status === 'retard').length,
      leaveDays: empLeaves.reduce((acc, curr) => acc + curr.duration_days, 0),
    };
  });
};

watch(filterType, (newVal) => {
  if (newVal === 'attendances') {
    fetchAttendanceAndLeaves();
    fetchMonthlySummary();
  }
});
// Appeler cette fonction quand filterType devient 'attendances'
watch(filterType, (newVal) => {
  if (newVal === 'attendances') fetchAttendanceAndLeaves();
});
watch(filterType, (newVal) => {
  if (newVal === 'salaries') fetchPayslips();
});



onMounted(() => {
  checkAccess();
  fetchData();
});
</script>

<template>
  <div class="hr-page">
    <div class="hr-card">
      <div class="header">
        <h2>👥 Gestion RH - {{ userStore.user.company.companyname }}</h2>
        <button @click="fetchData" class="btn-refresh">🔄</button>
      </div>
      <div class="table-controls">
        <div class="filters">
          <button :class="{ active: filterType === 'employees' }" @click="filterType = 'employees'">Employés</button>
          <button :class="{ active: filterType === 'departments' }" @click="filterType = 'departments'">Departements</button>
          <button :class="{ active: filterType === 'salaries' }" @click="filterType = 'salaries'">Salaires</button>
          <button :class="{ active: filterType === 'attendances' }" @click="filterType = 'attendances'">Présences</button>
        </div>
      </div>
      
      <div class="dept-creation-zone" v-if="filterType === 'employees'">
        <h4>Ajouter un nouvel employé</h4>
        <div class="dept-form">
          <input 
            v-model="newEmpEmail" 
            placeholder="Adresse email de l'utilisateur(example@email.com)" 
            class="dept-input"
            @keyup.enter="handleSearchUser(newEmpEmail)"
          >
          <button @click="handleSearchUser(newEmpEmail)" :disabled="isCreatingEmp" class="btn-add">
            {{ isCreatingEmp ? '...' : '+ Cherher' }}
          </button>
        </div>
      </div>

      <div class="dept-creation-zone" v-if="userResult">
        <table class="emp-table">
          <thead>
            <tr>
              <th>Prénom</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in userResult" :key="u.userref">
              <td>
                <div class="user-info">
                  <img :src="u.user.profilephotourl || DefaultAvatar" class="avatar">
                  <div>
                    <div class="email">{{ u.user.firstname }}</div>
                  </div>
                </div>
              </td>
              <td>
                  <div class="email">{{ u.user.lastname }}</div>
              </td>
              <td>
                <div class="email">{{ u.user.email }}</div>
              </td>
              <td>
                <button @click="openEmpForm = true" class="btn-add">Ajouter</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="dept-creation-zone" v-if="filterType === 'departments'"">
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
      <div class="payroll-action-card">
        <div class="month-selector">
          <label>Période de paie :</label>
          <input type="text" v-model="selectedMonth" placeholder="Ex: Janvier 2026">
        </div>

        <table class="emp-table">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Salaire de Base</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in upcomingPayments" :key="emp.empref">
              <td>{{ emp.user.firstname }} {{ emp.user.lastname }}</td>
              <td>{{ emp.salary }} XAF</td>
              <td>
                <button 
                  @click="validatePayroll(emp)" 
                  class="btn-validate"
                  :disabled="isProcessing"
                >
                  ✅ Valider la paie
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="loading" class="loader">Synchronisation avec la base de données...</div>
      
      <table v-else-if="filterType ==='employees'" class="emp-table">
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
                <img :src="emp.user.profilephotourl || DefaultAvatar" class="avatar">
                <div>
                  <div class="name">{{ emp.user.firstname }} {{ emp.user.lastname }}</div>
                  <div class="email">{{ emp.user.email }}</div>
                </div>
              </div>
            </td>
            <td>
              <select v-model="emp.deptref" @change="updateDept(emp.user.userref, emp.deptref)" class="table-select">
                <option value="" disabled selected>Aucun service</option>
                <option v-for="d in departments" :key="d.deptref" :value="d.deptref">
                  {{ d.deptname }}
                </option>
              </select>
            </td>
            <td>
              <select 
                v-model="emp.privilege" 
                @change="updateRole(emp.userref, emp.privilege)"
                :disabled="emp.userref === userStore.user.user.userref"
                class="table-select"
              >
                <option value="user">Employé</option>
                <option value="admin">Manager</option>
                <option value="hr">RH Manager</option>
                <option value="owner">Propriétaire</option>
              </select>
            </td>
            <td>
              <button @click="openEmployeeFile(emp)" class="btn-icon">
                📁 Dossier
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <table v-else-if="filterType ==='departments'" class="emp-table">
        <thead>
          <tr>
            <th>Département</th>
            <th>Responsable</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dpt in departments" :key="dpt.deptref">
            <td>
              <div class="user-info">
                <div>
                  <div class="name">{{ dpt.deptname }}</div>
                </div>
              </div>
            </td>
            <td>  
              <div class="user-info">
                <div>
                  <div class="name">{{ employees.filter(emp => emp.userref === dpt.manager_ref)[0].user.firstname }} {{ employees.filter(emp => emp.userref === dpt.manager_ref)[0].user.lastname }}</div>
                </div>
              </div>
            </td>
            <td>
              <router-link :to="dpt.deptname === 'Ressources humaines' ? 'hr' : dpt.deptname === 'Comptabilité' ?'accounting' : dpt.deptname === 'Finances' ? 'finance' : dpt.deptname === 'Marketing' ? 'crm': `${dpt.deptname}/${dpt.deptref}`" class="btn-icon">Voir</router-link>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filterType === 'salaries'" class="salary-actions">
        <div class="stats-mini">
          <span>Total à payer : <strong>{{ payslips.reduce((acc, s) => acc + s.net_salary, 0).toLocaleString() }} XAF</strong></span>
        </div>
        <button 
          @click="handlePayAll" 
          :disabled="isProcessingPayment || payslips.filter(s => s.status === 'draft').length === 0"
          class="btn-pay-all"
        >
          {{ isProcessingPayment ? 'Traitement...' : '✅ Tout marquer comme payé' }}
        </button>
        
        <button @click="downloadPaySlip(report)" class="btn-download">
          📄 Télécharger Bulletin
        </button>
      </div>
      <table v-else-if="filterType === 'salaries'" class="emp-table">
        <thead>
          <tr>
            <th>Collaborateur</th>
            <th>Période</th>
            <th>Salaire Brut</th>
            <th>Net à payer</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="slip in payslips" :key="slip.payslip_id">
            <td>
              <div class="user-info">
                <div class="name">{{ slip.employe.user.firstname }} {{ slip.employe.user.lastname }}</div>
              </div>
            </td>
            <td>{{ slip.month_year }}</td>
            <td>{{ slip.gross_salary.toLocaleString() }} XAF</td>
            <td style="font-weight: bold; color: #2ecc71;">{{ slip.net_salary.toLocaleString() }} XAF</td>
            <td>
              <span :class="'status-badge ' + slip.status">{{ slip.status }}</span>
            </td>
            <td>
              <button @click="downloadPDF(slip)" class="btn-icon">📥 PDF</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="management-container" v-if="filterType==='attendances'">
        <div class="quick-stats-bar">
          <span class="badge present">{{ attendanceToday.length }} Présents</span>
          <span class="badge pending">{{ pendingLeaves.length }} Congés en attente</span>
        </div>

        <section class="attendance-today">
          <h3>📊 Présences du jour ({{ new Date().toLocaleDateString() }})</h3>
          <section class="monthly-overview card">
            <div class="section-header">
              <h3>📈 Récapitulatif Mensuel ({{ selectedMonth }})</h3>
              <small>Calculé automatiquement pour la préparation de la paie</small>
            </div>

            <div class="summary-table-wrapper">
              <table class="summary-table">
                <thead>
                  <tr>
                    <th>Employé</th>
                    <th>Jours Présents</th>
                    <th>Retards</th>
                    <th>Congés Payés</th>
                    <th>Score Assiduité</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in monthlySummary" :key="item.name">
                    <td><strong>{{ item.name }}</strong></td>
                    <td>{{ item.presentDays }} j</td>
                    <td>
                      <span :class="item.lateCount > 3 ? 'text-danger fw-bold' : ''">
                        {{ item.lateCount }}
                      </span>
                    </td>
                    <td>{{ item.leaveDays }} j</td>
                    <td>
                      <div class="progress-bar">
                        <div class="progress" :style="{ width: (item.presentDays * 5) + '%' }"></div>
                      </div>
                    </td>
                    <td :class="{ 'warning-row': item.lateCount >= 3 }">
                      {{ item.lateCount }}
                      <span v-if="item.lateCount >= 3" title="Seuil de discipline atteint">⚠️</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <div class="table-wrapper">
            <table class="mini-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Arrivée</th>
                  <th>Statut</th>
                  <th>Départ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="att in attendanceToday" :key="att.id">
                  <td>{{ att.employe?.name }}</td>
                  <td>{{ new Date(att.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</td>
                  <td>
                    <span :class="['status-dot', att.status]"></span>
                    {{ att.status === 'retard' ? 'En retard' : 'À l\'heure' }}
                  </td>
                  <td>{{ att.check_out ? new Date(att.check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'En poste' }}</td>
                </tr>
                <tr v-if="attendanceToday.length === 0">
                  <td colspan="4" class="empty-msg">Aucun pointage pour le moment aujourd'hui.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="leave-validation">
          <h3>⏳ Demandes de congés à valider</h3>
          <div class="leaves-grid">
            <div v-for="req in pendingLeaves" :key="req.id" class="leave-card">
              <div class="leave-info">
                <span class="emp-name">{{ req.employee_name }}</span>
                <span class="leave-type">{{ req.type }}</span>
                <p class="leave-dates">Du {{ req.start_date }} au {{ req.end_date }}</p>
                <p class="leave-reason">"{{ req.reason }}"</p>
              </div>
              <div class="actions">
                <button @click="updateLeaveStatus(req.id, 'approuvé')" class="btn-approve">Approuver</button>
                <button @click="updateLeaveStatus(req.id, 'refusé')" class="btn-reject">Refuser</button>
              </div>
            </div>
            <div v-if="pendingLeaves.length === 0" class="empty-state">
              Bravo ! Toutes les demandes sont traitées.
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
  <div class="recruit" v-if="openEmpForm">
    <div class="emp-creation-zone" >
        <h4>Création d'un nouvel employé</h4>
        <h3>{{userResult[0].firstname}} {{userResult[0].lastname}}</h3>
        <p>{{userResult[0].email}}</p>
        <div class="dept-form">
          <label>Type de contrat</label>
          <select v-model="privilege" class="dept-input">
            <option value="user">Salarié Standard</option>
            <option value="admin">chef de Département</option>
            <option value="hr">RH Manager</option>
            <option value="owner">Dirigeant / Associé</option>
          </select>
          <label>Poste</label>
          <input 
            v-model="position" 
            placeholder="Le poste que l'employé occupera (ex: sécrétaire de direction...)" 
            class="dept-input"
          >
        </div>
        <div class="dept-form">
          <label>Salaire</label>
          <input 
            v-model="salary" 
            placeholder="Le salaire mensuel de l'employé (ex: 50 000 XAF...)" 
            class="dept-input"
          >
        </div>
        <div class="dept-form">
          <label>Jour de paie</label>
          <input 
            type='day'
            v-model="paymentDay" 
            placeholder="Le jour où l'employé l'employé doit être payé chaque mois (ex: 05)" 
            class="dept-input"
          >
        </div>
        <div v-if="salary > 0" class="payroll-preview">
          <p>Estimation pour une <strong>{{ legalForm }}</strong> :</p>
          <span>Salaire Net estimé : {{ (salary * 0.75).toLocaleString() }} XAF</span><br>
          <span>Coût Total Entreprise : {{ (salary * 1.45).toLocaleString() }} XAF</span>
        </div>
          <button @click="handleAddEmploye" :disabled="isCreatingEmp" class="btn-add">
            {{ isCreatingEmp ? '...' : '+ Recruter' }}
          </button>
          <button @click="openEmpForm = false" class="btn-close">
            Annuler
          </button>
      </div>
    </div>
    <div v-if="showFileModal" class="modal-overlay" @click.self="closeFileModal">
      <div class="employee-file-card">
        <header class="file-header">
          <div class="user-main">
            <img :src="selectedEmployee.user.profilephotourl || DefaultAvatar" class="large-avatar">
            <div>
              <h2>{{ selectedEmployee.user.firstname }} {{ selectedEmployee.user.lastname }}</h2>
              <span class="badge-role">{{ selectedEmployee.privilege }}</span>
            </div>
          </div>
          <button @click="closeFileModal" class="btn-close">&times;</button>
        </header>

        <div class="file-content">
          <div class="info-grid">
            <div class="info-group">
              <label>Informations Personnelles</label>
              <p>📧 {{ selectedEmployee.user.email }}</p>
              <p>📞 {{ selectedEmployee.user.phone || 'Non renseigné' }}</p>
              <p>📍 {{ selectedEmployee.user.city }}, {{ selectedEmployee.user.country }}</p>
            </div>
            
            <div class="info-group">
              <label>Détails Professionnels</label>
              <p><strong>Matricule:</strong> {{ selectedEmployee.empref }}</p>
              <p><strong>Poste:</strong> {{ selectedEmployee.position }}</p>
              <p><strong>Département:</strong> {{ selectedEmployee.deptname || 'Non assigné' }}</p>
            </div>
          </div>

          <div class="file-actions">
            <div class="doc-control">
              <label>Contrat de travail</label>
              <div class="btn-group">
                <button v-if="selectedEmployee.contract_url" 
                        @click="viewDoc(selectedEmployee.contract_url)" 
                        class="btn-view">👁️ Voir</button>
                <label class="btn-upload">
                  {{ selectedEmployee.contract_url ? '🔄 Changer' : '📤 Charger' }}
                  <input type="file" @change="uploadDoc($event, 'contract', selectedEmployee.userref)" hidden>
                </label>
              </div>
            </div>

            <div class="doc-control">
              <label>Certificat Médical</label>
              <div class="btn-group">
                <button v-if="selectedEmployee.medical_cert_url" 
                        @click="viewDoc(selectedEmployee.medical_cert_url)" 
                        class="btn-view">👁️ Voir</button>
                <label class="btn-upload">
                  {{ selectedEmployee.medical_cert_url ? '🔄 Changer' : '📤 Charger' }}
                  <input type="file" @change="uploadDoc($event, 'medical', selectedEmployee.userref)" hidden>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showPayModal" class="modal-overlay">
      <div class="pay-confirmation-card">
        <h3>Confirmer la Paie - {{ selectedMonth }}</h3>
        <div class="pay-body">
          <div class="pay-row"><span>Salaire de base</span> <span>{{ payDetails.employee.salary.toLocaleString() }} XAF</span></div>
          <div class="pay-row text-red"><span>Absences ({{ payDetails.missedDays }}j)</span> <span>-{{ payDetails.absenceDeduction.toLocaleString() }} XAF</span></div>
          <hr>
          <div class="pay-row"><span>Brut Taxable</span> <span>{{ payDetails.adjustedBrut.toLocaleString() }} XAF</span></div>
          <div class="pay-row text-red"><span>Retenue CNPS (4,2%)</span> <span>-{{ payDetails.socialCharges.toLocaleString() }} XAF</span></div>
          <div class="pay-total">
            <span>NET À PAYER</span>
            <span>{{ payDetails.net.toLocaleString() }} XAF</span>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showPayModal = false" class="btn-cancel">Annuler</button>
          <button @click="confirmAndRecordPay" class="btn-confirm">✅ Enregistrer & Payer</button>
        </div>
      </div>
    </div>
</template>

<style scoped>
.hr-page { 
  padding: 2rem; 
  padding-top: 60px;
}
.hr-card { background: white; border-radius: 15px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
.header { display: flex; justify-content: space-between; margin-bottom: 2rem; }

.filters { display: flex; gap: 10px; margin-bottom: 1.5rem; }
.filters button { 
  padding: 8px 16px; border-radius: 20px; border: 1px solid #e2e8f0; 
  background: white; cursor: pointer; transition: 0.3s;
}
.filters button.active { background: #1e293b; color: white; border-color: #1e293b; }
.salary-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f1f5f9;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.stats-mini {
  color: #475569;
  font-size: 0.95rem;
}

.btn-pay-all {
  background: #059669; /* Vert émeraude */
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-pay-all:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
}

.btn-pay-all:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.7;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  text-transform: uppercase;
}
.status-badge.draft { background: #fef3c7; color: #92400e; }
.status-badge.paid { background: #d1fae5; color: #065f46; font-weight: bold;}

.btn-icon:hover {
  background: #e2e8f0;
  color: #2563eb;
}

.recruit{
  position: absolute;
  top: 50%;
  left: 60%;
  transform: translate( -50%, -50%);
  background-color: #eee;
  border-radius: 12px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);
  width: 60%;
  height: 60%;
  padding: 20px;
}
.dept-creation-zone { 
  background: #f8fafc; 
  padding: 1rem; 
  border-radius: 10px; 
  margin-bottom: 2rem;
  border: 1px dashed #cbd5e1;
}
.payroll-action-card {
  background: white;
  padding: 1.5rem;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.btn-validate {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
  font-weight: 600;
}

.btn-validate:hover {
  background-color: #059669;
  transform: translateY(-2px);
}

.btn-validate:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}
.dept-form { display: flex; gap: 10px; margin-top: 10px; }
.dept-input { flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid #ddd; }
.btn-add { background: #1e293b; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; margin: 10px;}
.btn-close { background: #ffffffff; color: #1e293b; border: 1px solid #1e293b; padding: 8px 15px; border-radius: 6px; cursor: pointer; margin: 10px; }

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
.quick-stats-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.badge { padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
.badge.present { background: #dcfce7; color: #166534; }
.badge.pending { background: #fef3c7; color: #92400e; }

.mini-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9rem; }
.mini-table th { text-align: left; padding: 10px; background: #f8fafc; color: #64748b; }
.mini-table td { padding: 10px; border-bottom: 1px solid #f1f5f9; }

.status-dot { height: 8px; width: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; }
.status-dot.present { background: #10b981; }
.status-dot.retard { background: #f59e0b; }

.leaves-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
.leave-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem; }
.emp-name { font-weight: bold; display: block; }
.leave-type { font-size: 0.8rem; color: #3b82f6; font-weight: 600; }
.leave-dates { font-size: 0.85rem; margin: 5px 0; color: #64748b; }
.leave-reason { font-style: italic; font-size: 0.8rem; color: #94a3b8; }

.actions { display: flex; gap: 10px; margin-top: 1rem; }
.btn-approve { flex: 1; background: #10b981; color: white; border: none; padding: 8px; border-radius: 5px; cursor: pointer; }
.btn-reject { flex: 1; background: #ef4444; color: white; border: none; padding: 8px; border-radius: 5px; cursor: pointer; }
.monthly-overview {
  margin-bottom: 2.5rem;
  border-top: 4px solid #3b82f6;
  background: #ffffff;
}

.section-header { margin-bottom: 1rem; }
.section-header small { color: #64748b; }

.summary-table {
  width: 100%;
  border-collapse: collapse;
}

.summary-table th {
  background: #f1f5f9;
  padding: 12px;
  text-align: left;
  font-size: 0.85rem;
  color: #475569;
}

.summary-table td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
}

/* Barre de progression pour le score d'assiduité */
.progress-bar {
  width: 100px;
  height: 8px;
  background: #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #10b981;
  transition: width 0.5s ease;
}

.fw-bold { font-weight: bold; }
.warning-row {
  color: #b91c1c;
  background-color: #fef2f2;
  font-weight: bold;
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}

.employee-file-card {
  background: white;
  width: 90%; max-width: 600px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.file-header {
  background: #1e293b; color: white;
  padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;
}

.user-main { display: flex; align-items: center; gap: 1rem; }
.large-avatar { width: 70px; height: 70px; border-radius: 50%; border: 3px solid #334155; object-fit: cover; }

.badge-role {
  background: #3b82f6; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;
}

.file-content { padding: 2rem; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }

.info-group label {
  display: block; font-size: 0.8rem; font-weight: bold; color: #64748b;
  text-transform: uppercase; margin-bottom: 0.5rem; border-bottom: 1px solid #f1f5f9;
}

.info-group p { margin: 8px 0; font-size: 0.95rem; }

.file-actions { display: flex; gap: 1rem; border-top: 1px solid #f1f5f9; padding-top: 1.5rem; }
.btn-secondary {
  flex: 1; padding: 10px; border: 1px solid #e2e8f0; background: #f8fafc;
  border-radius: 6px; cursor: pointer; font-size: 0.85rem;
}
.btn-secondary:hover { background: #f1f5f9; }

.btn-close { background: transparent; border: none; color: white; font-size: 2rem; cursor: pointer; }
.doc-control {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.doc-control label {
  font-size: 0.75rem;
  font-weight: bold;
  color: #64748b;
}

.btn-group {
  display: flex;
  gap: 5px;
}

.btn-view {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-upload {
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  text-align: center;
  transition: 0.2s;
}

.btn-upload:hover {
  background: #e2e8f0;
}

.file-actions {
  display: flex;
  gap: 20px;
  border-top: 1px solid #f1f5f9;
  padding-top: 1.5rem;
}
.pay-confirmation-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  width: 450px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
}
.pay-body { margin: 20px 0; }
.pay-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 0.95rem; }
.pay-total { 
  display: flex; justify-content: space-between; 
  margin-top: 15px; padding-top: 15px; border-top: 2px solid #f1f5f9;
  font-weight: 800; font-size: 1.2rem; color: #166534;
}
.modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.btn-confirm { background: #22c55e; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold; }
.btn-cancel { background: #f1f5f9; color: #64748b; border: none; padding: 12px; border-radius: 8px; cursor: pointer; }
</style>
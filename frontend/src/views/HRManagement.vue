<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import supabase from '../services/supabaseConfig';
import downloadPaySlip from '../services/supabaseConfig';
import { useUserStore } from '../store/index';
import DefaultAvatar from '../assets/images/Default-avatar.png'
import { useRouter } from 'vue-router';
import { jsPDF } from "jspdf";
import "jspdf-autotable";


const toast = ref({ show: false, message: '', type: 'success' });

  function triggerToast(message, type = 'success') {
      toast.value = { show: true, message, type };
      setTimeout(() => {
          toast.value.show = false;
      }, 4000); // Disparaît après 4 secondes
  };

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
const privilege = ref('employee');
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
const applications = ref([]);
const uploadProgress = ref(0);
const selectedFile = ref(null);

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

const newJob = ref({
    title: '',
    type: 'recrutement',
    description: '',
    location: '',
    deadline: ''
});

// 1. SÉCURITÉ : Vérification des accès
const checkAccess = () => {
  const role = userStore.user.employe.privilege;
  if (role !== 'owner' && role !== 'hr') {
    alert("Accès refusé : Vous n'avez pas les droits RH.", "error");
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
    alert("Document mis à jour avec succès !", "success");
  } catch (err) {
    aleret("Erreur lors de l'envoi : " + err.message, "error");
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

// Récupérer les candidatures
const fetchApplications = async () => {
    const { data, error } = await supabase
        .from('applications')
        .select('*, job:jobref(title)')
        .order('applied_at', { ascending: false });

    if (error) {
      console.error("Erreur applications:", error);
      const enhancedApplications = data.map(async (app) => {
        const { data: appData, error: appError} = await supabase
          .from('employe')
          .select('companyref')
          .eq('email', app.email)
          .maybeSingle();
        
        return { ...app, candidate_info: appData || null };
      });
      applications.value = enhancedApplications;
    } else {
      applications.value = data;
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

    alert("Paiements validés avec succès !", "success");
    await fetchPayslips(); 
  } catch (err) {
    console.error("Erreur lors de la validation des paiements:", err);
    alert("Une erreur est survenue.", "error");
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
    alert(`La paie de ${employee.user.firstname} ${employee.user.lastname} pour ${selectedMonth.value} a déjà été validée.`, "error");
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
    alert("Succès : Bulletin archivé et flux financier créé.", "success");
    // Optionnel : rafraîchir la liste pour griser le bouton valider
    fetchMonthlySummary(); 
  } else {
    alert("Erreur lors de la validation : " + error.message, "error");
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

          if(emplError) console.log('employé non trouvé')
          else{
            userResult.value = [{user:data[0], employe:emplData[0]}]
          }
      }
  } catch(err){
    console.error("Une erreur s'est produite lors de la recherche de l'utilisateur", err)
  }
}

const updateAppStatus = async (application, newStatus) => {
    try {
      console.log(application, 'statut:', newStatus)
        // 1. Mise à jour du statut dans la table 'applications'
        const { data, error } = await supabase
            .from('applications')
            .update({ status: newStatus })
            .eq('appref', application.appref);

        if (error) {
          console.log(error);
          throw error;
        }
        // 2. Si le RH a cliqué sur "Accepter"
        if (newStatus === 'accepted') {
            userResult.value = [{
                user: {
                    userref: application.candidate_ref,
                    firstname: application.firstname,
                    lastname: application.lastname,
                    email: application.email
                },
                employe: { userref: application.candidate_ref }
            }];
            openEmpForm.value = true;
        } else {
            triggerToast(`Candidature ${newStatus}`, "info");
            fetchApplications(); 
        }
    } catch (err) {
        triggerToast("Erreur lors du changement de statut", "error");
    }
};

const handleAddEmploye = async () => {
    if (!salary.value || !position.value) {
        triggerToast("Veuillez remplir tous les champs", "error");
        return;
    }

    isCreatingEmp.value = true;
    try {
      const cleanSalary = Number(salary.value.toString().replace(/\s+/g, ''));

      if (isNaN(cleanSalary)) {
        triggerToast("Le salaire doit être un nombre valide", "error");
        return;
      }
        // Accès aux données selon TA structure : userResult.value[0].user
        const selectedUser = userResult.value[0].user; 
        const userRef = selectedUser.userref;

        // 1. Mise à jour de la fiche employe existante
        const { error: empError } = await supabase
            .from('employe')
            .update({
                companyref: userStore.user.company.companyref,
                position: position.value,
                salary: cleanSalary,
                paymentday: paymentDay.value,
                privilege: privilege.value,
                hired_at: new Date().toISOString()
            })
            .eq('userref', userRef);

        if (empError) throw empError;

        // 2. Génération et Sauvegarde du contrat
        const doc = new jsPDF();
        const date = new Date().toLocaleDateString();

        // --- Ton Design de Contrat ---
        doc.setFontSize(20);
        doc.text("CONTRAT DE TRAVAIL", 105, 20, { align: "center" });
        doc.setFontSize(12);
        doc.text(`L'employeur : ${userStore.user.company.companyname}`, 20, 65);
        doc.text(`Le salarié : ${selectedUser.firstname} ${selectedUser.lastname}`, 20, 75);
        doc.text(`Poste : ${position.value} | Salaire : ${salary.value} XAF`, 20, 105);
        // -----------------------------

        // SAUVEGARDE SUR SUPABASE STORAGE
        const pdfBlob = doc.output('blob');
        const fileName = `contrat_${userRef}_${Date.now()}.pdf`;
        const filePath = `${userStore.user.company.companyref}/${fileName}`;

        const { error: storageError } = await supabase.storage
            .from('contracts')
            .upload(filePath, pdfBlob, { contentType: 'application/pdf' });

        if (storageError) throw storageError;

        // Enregistrement de l'URL dans la table employe
        const { data: urlData, error } = supabase.storage.from('contracts').getPublicUrl(filePath);
        await supabase
            .from('employe')
            .update({ contract_url: urlData.publicUrl })
            .eq('userref', userRef);
            
            if (error) {
              console.log(error);
              throw error;
            }
        // 3. Téléchargement local pour le RH
        doc.save(fileName);

        openEmpForm.value = false;
        triggerToast("Candidat recruté et contrat archivé !", "success");
        
        if (typeof fetchApplications === 'function') fetchApplications();

    } catch (err) {
        console.error("Erreur recrutement:", err);
        triggerToast("Erreur lors de la validation", "error");
    } finally {
        isCreatingEmp.value = false;
    }
};

const generateAndSaveContract = async (candidate) => {
    const doc = new jsPDF();
    // ... (Ton code de design du contrat ici) ...
    doc.text(`CONTRAT DE TRAVAIL : ${candidate.firstname} ${candidate.lastname}`, 20, 20);
    // ...

    // Conversion en Blob pour Supabase
    const pdfBlob = doc.output('blob');
    const fileName = `contrat_${candidate.userref}_${Date.now()}.pdf`;
    const filePath = `${userStore.user.company.companyref}/${fileName}`;

    // Upload vers le bucket 'contracts'
    const { data, error } = await supabase.storage
        .from('contracts')
        .upload(filePath, pdfBlob, { contentType: 'application/pdf' });

    if (error) throw error;

    // Optionnel : Enregistrer l'URL du contrat dans la table employe
    const { data: urlData } = supabase.storage.from('contracts').getPublicUrl(filePath);
    
    await supabase
        .from('employe')
        .update({ contract_url: urlData.publicUrl })
        .eq('userref', candidate.userref);

    doc.save(fileName); // Téléchargement local pour le RH
    return urlData.publicUrl;
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
      companyref: userStore.user.company.companyref
    }]);

  if (!error) {
    newDeptName.value = '';
    await fetchData(); // Actualise la liste et les menus déroulants
  }
  isCreatingDept.value = false;
  triggerToast("Département créé avec succès!", "success")
};

// 3. ACTIONS : Mise à jour employés
const updateRole = async (userRef, newRole) => {
  await supabase.from('employe').update({ privilege: newRole }).eq('userref', userRef);
};

const updateDept = async (userRef, deptRef) => {
  await supabase.from('employe').update({ deptref: deptRef }).eq('userref', userRef);
  if(deptRef) {
    const dept = departments.value.find(d => d.deptref === deptRef);
    triggerToast(`L'employé a été affecté au département : ${dept.deptname}`, "success");
  }
}; 

const updateManager = async (deptRef, newManagerRef) => {
  try {
    const { error } = await supabase
      .from('department')
      .update({ manager_ref: newManagerRef })
      .eq('deptref', deptRef);

    if (error) throw error;
    
    // Notification de succès optionnelle
    console.log("Responsable mis à jour avec succès");
  } catch (err) {
    console.error("Erreur lors de la mise à jour du responsable:", err);
    alert("Impossible de modifier le responsable.", "error");
    // Optionnel : recharger fetchData() pour annuler visuellement le changement en cas d'erreur
    await fetchData();
  }
};

// Capturer le fichier lors de la sélection
const handleFileUpload = (event) => {
    selectedFile.value = event.target.files[0];
};

// Fonction principale pour uploader vers Supabase Storage
const uploadToStorage = async (file) => {
    try {
        // Validation basique avant l'envoi
        if (file.size > 5 * 1024 * 1024) { // Limite à 5Mo
            throw new Error("Le fichier est trop volumineux (max 5Mo)");
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `announcements/${fileName}`;

        const { data, error } = await supabase.storage
            .from('recruitment')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            // Ici, l'erreur vient souvent du Bucket (nom mal orthographié ou pas public)
            throw error;
        }

        const { data: publicUrlData } = supabase.storage
            .from('recruitment')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    } catch (error) {
        // On remonte l'erreur pour qu'elle soit captée par publishAnnounce
        throw error; 
    }
};
// Mise à jour de la fonction de publication
const publishAnnounce = async () => {
    try {
        let fileUrl = null;

        if (selectedFile.value) {
            
            fileUrl = await uploadToStorage(selectedFile.value);
            
            if (!fileUrl) throw new Error("Impossible de générer l'URL du fichier");
        }

        const jobRef = 'JOB-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        const { error: dbError } = await supabase.from('jobs').insert({
            jobref: jobRef,
            title: newJob.value.title,
            description: newJob.value.description,
            type: newJob.value.type,
            location: newJob.value.location,
            deadline: newJob.value.deadline,
            file_url: fileUrl, 
            companyref: userStore.user.company.companyref,
            created_by: userStore.user.user.userref
        });

        if (dbError) throw dbError;

        triggerToast("L'annonce a été publiée avec succès !", "success");
        resetForm();

    } catch (err) {
        // C'est ici qu'on t'informe du problème réel
        console.error("Détails de l'erreur:", err);
        triggerToast(`Erreur : ${err.message || "Problème lors de la publication"}`, "error");
    }
};

const resetForm = () => {
    newJob.value = {
        title: '',
        type: 'recrutement',
        description: '',
        location: '',
        deadline: ''
    };
    selectedFile.value = null;
}

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
    alert(`Demande ${newStatus} avec succès`, "success");
    fetchAttendanceAndLeaves(); 
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
  }
  if (newVal === 'salaries') fetchPayslips();
    fetchMonthlySummary();
    fetchApplications();
});

onMounted(() => {
  checkAccess();
  fetchData();
});
</script>

<template>
  <transition name="toast-fade">
    <div v-if="toast.show" :class="['toast-popup', toast.type]">
        <div class="toast-content">
            <img v-if="toast.type === 'success'" src="../assets/icons/checked.png" class="icon">
            <p>{{ toast.message }}</p>
        </div>
        <div class="progress-bar"></div>
    </div>
  </transition>
  <div class="hr-page">
    <div class="hr-card">
      <div class="header">
        <h2><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Gestion RH - {{ userStore.user.company.companyname }}</h2>
        <button @click="fetchData" class="btn-refresh"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg></button>
      </div>
      <div class="table-controls">
        <div class="filters">
          <button :class="{ active: filterType === 'employees' }" @click="filterType = 'employees'">Employés</button>
          <button :class="{ active: filterType === 'departments' }" @click="filterType = 'departments'">Departements</button>
          <button :class="{ active: filterType === 'salaries' }" @click="filterType = 'salaries'">Salaires</button>
          <button :class="{ active: filterType === 'attendances' }" @click="filterType = 'attendances'">Présences</button>
          <button :class="{ active: filterType === 'recruitment' }" @click="filterType = 'recruitment'">Recrutement</button>
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

      <div class="dept-creation-zone" v-if="userResult && filterType==='employees'">
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

      <div class="dept-creation-zone" v-show="filterType === 'departments'">
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
      <div class="payroll-action-card" v-show="filterType === 'salaries' && upcomingPayments.length > 0">
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Valider la paie
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
                :disabled="emp.userref === userStore.user.user.userref || emp.privilege === 'owner'"
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
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg> Dossier
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <table v-show="filterType ==='departments'" class="emp-table">
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
                <select 
                  v-model="dpt.manager_ref" 
                  @change="updateManager(dpt.deptref, dpt.manager_ref)"
                  class="table-select manager-select"
                >
                  <option value="" disabled>Sélectionner un responsable</option>
                  <option v-for="emp in employees" :key="emp.user.userref" :value="emp.user.userref">
                    {{ emp.user.firstname }} {{ emp.user.lastname }}
                  </option>
                </select>
              </div>
            </td>
            <td>
              <router-link :to="dpt.deptname === 'Ressources humaines' ? 'hr' : dpt.deptname === 'Comptabilité' ?'accounting' : dpt.deptname === 'Finances' ? 'finance' : dpt.deptname === 'Marketing' ? 'crm': `${dpt.deptname}/${dpt.deptref}`" class="btn-icon">Voir</router-link>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-show="filterType === 'salaries'" class="salary-actions">
        <div class="stats-mini">
          <span>Total à payer : <strong>{{ payslips.reduce((acc, s) => acc + s.net_salary, 0).toLocaleString() }} XAF</strong></span>
        </div>
        <button 
          @click="handlePayAll" 
          :disabled="isProcessingPayment || payslips.filter(s => s.status === 'draft').length === 0"
          class="btn-pay-all"
        ><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          {{ isProcessingPayment ? 'Traitement...' : 'Tout marquer comme payé' }}
        </button>
        
        <button @click="downloadPaySlip(report)" class="btn-download">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> Télécharger Bulletin
        </button>
      </div>
      <table v-show="filterType === 'salaries'" class="emp-table">
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
              <button @click="downloadPDF(slip)" class="btn-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 10 12 13 9 10"></polyline><line x1="12" y1="3" x2="12" y2="13"></line><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg> PDF</button>
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
          <h3><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> Présences du jour ({{ new Date().toLocaleDateString() }})</h3>
          <section class="monthly-overview card">
            <div class="section-header">
              <h3><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> Récapitulatif Mensuel ({{ selectedMonth }})</h3>
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
                      <span v-if="item.lateCount >= 3" title="Seuil de discipline atteint">⚠️<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></span>
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
      <div class="recruitment-module" v-show="filterType === 'recruitment'">
        <div class="main-ctn announce-form-section">
            <div class="proj-header">
                <h3><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> Publier une annonce</h3>
                <p>Recrutement ou Événement d'entreprise</p>
            </div>
            
            <form @submit.prevent="publishAnnounce" class="announce-form">
                <div class="form-row">
                    <div class="input-group">
                        <label>Titre de l'annonce</label>
                        <input type="text" v-model="newJob.title" placeholder="Ex: Développeur Fullstack" required>
                    </div>
                    <div class="input-group">
                        <label>Type d'annonce</label>
                        <select v-model="newJob.type">
                            <option value="recrutement">Recrutement</option>
                            <option value="evenement">Événement</option>
                        </select>
                    </div>
                </div>

                <div class="input-group">
                    <label>Description détaillée</label>
                    <textarea v-model="newJob.description" placeholder="Missions, profil recherché, détails de l'événement..."></textarea>
                </div>

                <div class="form-row">
                    <div class="input-group">
                        <label>Lieu</label>
                        <input type="text" v-model="newJob.location" placeholder="Ex: Douala, Hybride...">
                    </div>
                    <div class="input-group">
                        <label>Date limite / Date de l'événement</label>
                        <input type="date" v-model="newJob.deadline">
                    </div>
                </div>

                <div class="input-group">
                  <label>Document descriptif (Optionnel - PDF/Image)</label>
                  <input type="file" @change="handleFileUpload" accept=".pdf,.jpg,.png,.docx" class="file-input">
                  <progress v-if="uploadProgress > 0" :value="uploadProgress" max="100"></progress>
                </div>
                <div class="btn-ctn">
                    <button type="submit" class="btn-add">Publier l'annonce</button>
                </div>
            </form>
        </div>

        <div class="main-ctn applications-section">
            <div class="proj-header">
                <h3><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> Candidatures & Réponses</h3>
            </div>

            <div class="table-container">
                <table class="emp-table">
                    <thead>
                        <tr>
                            <th>Candidat</th>
                            <th>Poste visé</th>
                            <th>Date</th>
                            <th>CV / Document</th>
                            <th>Statut</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="app in applications" :key="app.appref">
                            <td>
                              <div class="user-info">
                                <div>
                                  <div class="name">{{ app.firstname }} {{ app.lastname }}</div>
                                  <div class="email">{{ app.email }}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div class="user-info">  
                                <div>
                                  <div class="name">{{ app.job?.title }}</div>
                                </div>
                              </div></td>
                            <td> 
                              <div class="user-info">
                                <div>
                                  <div class="name">{{ new Date(app.applied_at).toLocaleDateString() }}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div v-if="app.resume_url" class="user-info">
                                <div>
                                  <div class="name"><a  :href="app.resume_url" target="_blank" class="btn-view"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> Voir le CV</a> </div>
                                </div>
                                
                              </div>
                              <div v-else class="user-info">
                                <div class="name" x>Aucun document</div>
                              </div>
                            </td>
                            <td>
                                <span class="status-badge unavailable" v-if="app.candidate_infos && app.candidate_infos !== userStore.user.employe.companyref">Plus disponible</span>
                                <span v-else :class="['status-badge', app.status]">{{ app.status }}</span>
                            </td>
                            <td>
                                <select @change="updateAppStatus(app, $event.target.value)" class="status-select" 
                                :disabled="((app.status === 'accepted' || app.status === 'rejected') && userStore.user.employe.privilege !== 'owner') 
                                || (app.candidate_infos && app.candidate_infos !== userStore.user.employe.companyref)">
                                    <option value="pending" :selected="app.status === 'pending'">En attente</option>
                                    <option value="accepted" :selected="app.status === 'accepted'">Accepter</option>
                                    <option value="rejected" :selected="app.status === 'rejected'">Refuser</option>
                                </select>
                            </td>
                        </tr>
                        <tr v-if="applications.length === 0">
                            <td colspan="6" class="text-center">Aucune candidature reçue pour le moment.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
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
            <option value="employee">Salarié Standard</option>
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
          <button @click="handleAddEmploye()" :disabled="isCreatingEmp" class="btn-add">
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
              <p><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg> {{ selectedEmployee.user.email }}</p>
              <p><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> {{ selectedEmployee.user.phone || 'Non renseigné' }}</p>
              <p><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> {{ selectedEmployee.user.city }}, {{ selectedEmployee.user.country }}</p>
            </div>
            
            <div class="info-group">
              <label>Détails Professionnels</label>
              <p><strong>Matricule:</strong> {{ selectedEmployee.empref }}</p>
              <p><strong>Poste:</strong> {{ selectedEmployee.position }}</p>
              <p><strong>Département:</strong> {{ departments.filter(d => d.deptref=== selectedEmployee.deptref)[0]?.deptname || 'Non assigné' }}</p>
            </div>
          </div>

          <div class="file-actions">
            <div class="doc-control">
              <label>Contrat de travail</label>
              <div class="btn-group">
                <button v-if="selectedEmployee.contract_url" 
                        @click="viewDoc(selectedEmployee.contract_url)" 
                        class="btn-view"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Voir</button>
                <label class="btn-upload">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 10 12 13 9 10"></polyline><line x1="12" y1="3" x2="12" y2="13"></line><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>
                  {{ selectedEmployee.contract_url ? 'Changer' : 'Charger' }}
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 10 12 13 9 10"></polyline><line x1="12" y1="3" x2="12" y2="13"></line><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>
                  {{ selectedEmployee.medical_cert_url ? ' Changer' : 'Charger' }}
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
          <button @click="confirmAndRecordPay" class="btn-confirm"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Enregistrer & Payer</button>
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
.header button {height: 2rem; width: 2rem;}

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

  .stats-mini {
    color: #475569;
    font-size: 0.95rem;
  }

  .btn-pay-all {
    background: #059669;
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

/* L'overlay qui couvre tout l'écran */
.recruit {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999; /* Au-dessus de tout */
    padding: 20px;

    /* La boîte modale elle-même */
    .emp-creation-zone {
        background: #ffffff;
        width: 100%;
        max-width: 550px;
        max-height: 90vh; /* Ne dépasse jamais l'écran */
        overflow-y: auto; /* Scroll interne si nécessaire */
        border-radius: 16px;
        padding: 30px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        position: relative;
        animation: modalIn 0.3s ease-out;
    }

    @keyframes modalIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* En-tête de la modale */
    .emp-creation-zone h4 {
        color: #004581;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 5px;
    }

    .emp-creation-zone h3 {
        font-size: 1.6rem;
        color: #1e293b;
        margin: 0;
    }

    .emp-creation-zone p {
        color: #64748b;
        font-size: 0.9rem;
        margin-bottom: 25px;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 15px;
    }

    /* Formulaire */
    .dept-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 20px;
    }

    .dept-form label {
        font-weight: 700;
        font-size: 0.85rem;
        color: #475569;
    }

    .dept-input {
        padding: 12px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.2s;
    }

    .dept-input:focus {
        border-color: #004581;
        outline: none;
    }

    /* Zone de calcul */
    .payroll-preview {
        background: #f1f5f9;
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 25px;
        font-size: 0.9rem;
    }

    .payroll-preview strong {
        color: #004581;
    }

    /* Boutons */
    .btn-add {
        width: 100%;
        background: #004581;
        color: white;
        border: none;
        padding: 15px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        margin-bottom: 10px;
        transition: opacity 0.2s;
    }

    .btn-add:hover {
        opacity: 0.9;
    }

    .btn-close {
        width: 100%;
        background: #f1f5f9;
        color: #64748b;
        border: none;
        padding: 12px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
    }

    .btn-close:hover {
        background: #e2e8f0;
    }
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
  margin: 1.5rem 0;
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
.manager-select {
  border: 1px solid transparent;
  background: transparent;
  padding: 5px;
  cursor: pointer;
  font-weight: 500;
  color: #1e293b;
  border-radius: 4px;
  width: 100%;
  transition: all 0.2s;
}

.manager-select:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.manager-select:focus {
  outline: none;
  background: white;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.announce-form-section {
    margin-bottom: 30px;
}

.announce-form {
    padding: 0 10px;
}

.form-row {
    display: flex;
    gap: 20px;
    margin-bottom: 15px;
}

.input-group {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.input-group label {
    font-size: 0.85rem;
    font-weight: bold;
    color: #505181;
    margin-bottom: 5px;
}

.input-group input, .input-group select, .input-group textarea {
    padding: 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
}

.status-badge {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: bold;
}

.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.accepted { background: #dcfce7; color: #166534; }
.status-badge.rejected { background: #fee2e2; color: #991b1b; }

.status-select {
    padding: 5px;
    border-radius: 5px;
    font-size: 0.8rem;
}

.file-link {
    color: #004581;
    text-decoration: underline;
    font-size: 0.85rem;
}

.file-input {
    border: 1px dashed #505181;
    padding: 20px;
    background: #f8fafc;
    cursor: pointer;
    text-align: center;
}

.file-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #c2dff8;
    color: #004581;
    padding: 6px 12px;
    border-radius: 6px;
    text-decoration: none;
    font-size: 0.8rem;
    font-weight: bold;
    transition: 0.3s;
}

.file-btn:hover {
    background-color: #a0cff8;
}

.mini-icon {
    width: 16px;
    height: 16px;
}

.progress {
    width: 100%;
    height: 10px;
    margin-top: 5px;
    accent-color: #004581;
}
.toast-popup {
    position: fixed;
    top: 20px;
    right: 20px;
    min-width: 300px;
    background: white;
    padding: 16px;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    z-index: 9999;
    border-left: 5px solid #004581;
    overflow: hidden;
}

.toast-popup.success { border-left-color: #2ecc71; }
.toast-popup.error { border-left-color: #e74c3c; }

.toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.toast-content p {
    margin: 0;
    font-size: 0.9rem;
    color: #333;
    font-weight: 500;
}

.progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: rgba(0,0,0,0.1);
    animation: progress 4s linear forwards;
}

@keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
}

/* Animation Vue.js */
.toast-fade-enter-active, .toast-fade-leave-active {
    transition: all 0.4s ease;
}
.toast-fade-enter-from {
    transform: translateX(100%);
    opacity: 0;
}
.toast-fade-leave-to {
    transform: translateX(100%);
    opacity: 0;
}
</style>
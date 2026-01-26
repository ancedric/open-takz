<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';
import { Chart, registerables } from 'chart.js';
import Header from '../components/Header.vue';

Chart.register(...registerables);

const userStore = useUserStore();
const projects = ref([]);
const transactions = ref([]);
const loading = ref(true);
const chartCanvas = ref(null);
let financeChart = null;
const activeTab = ref('transactions'); // 'transactions' ou 'invoices'
const invoices = ref([]);
const invoiceModal = ref(false);
const isClosing = ref(false);
const selectedMonth = ref(new Date().toISOString().slice(0, 7)); // Ex: 2026-01
const totalIncome = computed(() => {
  return transactions.value
    .filter(t => t.category === 'income' || t.category === 'budget_allocation')
    .reduce((sum, t) => sum + t.amount, 0);
});

// Formulaire nouvelle transaction
const showModal = ref(false);
const newTransaction = ref({
  projectref: '',
  amount: 0,
  label: '',
  category: 'expense'
});

const toast = ref({ show: false, message: '', type: 'success' });

const generateMonthlyReport = computed(() => {
  // 1. Calcul des agrégats
  const capital = transactions.value
    .filter(t => t.account_code?.startsWith('1'))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRevenue = transactions.value
    .filter(t => t.account_code?.startsWith('7'))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions.value
    .filter(t => t.account_code?.startsWith('6'))
    .reduce((sum, t) => sum + t.amount, 0);

  const netResult = totalRevenue - totalExpenses;
  
  // 2. Trésorerie nette (Ce qui reste en caisse/banque)
  const cashOnHand = (capital + totalRevenue) - totalExpenses;

  return {
    capital,
    totalRevenue,
    totalExpenses,
    netResult,
    cashOnHand,
    margin: totalRevenue > 0 ? Math.round((netResult / totalRevenue) * 100) : 0
  };
});

const closeCurrentMonth = async () => {
  // 1. Vérification de sécurité
  if (transactions.value.length === 0) {
    return showNotification("Aucune transaction à clôturer.", "error");
  }

  const confirmMsg = `Voulez-vous vraiment clôturer le mois de ${selectedMonth.value} ? Cette action est irréversible.`;
  if (!confirm(confirmMsg)) return;

  isClosing.value = true;

  try {
    // 2. Préparation de l'objet de clôture (Snapshot)
    const closingData = {
      companyref: userStore.user.company.companyref,
      closing_month: selectedMonth.value,
      total_income: totalIncome.value,
      total_expense: totalExpense.value,
      net_profit: balance.value,
      closed_by: userStore.user.user.userref
    };

    // 3. Envoi à Supabase
    const { error } = await supabase
      .from('monthly_closings')
      .insert([closingData]);

    if (error) {
      if (error.code === '23505') throw new Error("Ce mois est déjà clôturé.");
      throw error;
    }

    // 4. Succès
    showNotification(`Le mois de ${selectedMonth.value} a été sécurisé ! 🔒`);
    
    // On peut aussi déclencher l'impression du rapport ici
    // window.print(); 

  } catch (err) {
    console.error("Erreur clôture:", err.message);
    showNotification(err.message, "error");
  } finally {
    isClosing.value = false;
  }
};

const showNotification = (msg, type = 'success') => {
  toast.value = { show: true, message: msg, type };
  // Disparition automatique après 3 secondes
  setTimeout(() => {
    toast.value.show = false;
  }, 3000);
};

const netBalance = computed(() => {
  const incomes = transactions.value
    .filter(t => t.category === 'income' || t.category === 'budget_allocation')
    .reduce((sum, t) => sum + t.amount, 0);
  return incomes - totalExpenses.value;
});

const fetchData = async () => {
  if (!userStore.user) {
        console.log("En attente des données utilisateur...");
        return; 
    }
  loading.value = true;
  // 1. Récupérer les projets pour le select
  const { data: projData } = await supabase
    .from('project')
    .select('projectref, projectname')
    .eq('userref', userStore.user.user.userref); // Ou filtre par companyref si vous l'avez ajouté
  projects.value = projData;

  // 2. Récupérer les transactions
  const { data: transData } = await supabase
    .from('finance_transactions')
    .select('*')
    .eq('companyref', userStore.user.company.companyref)
    .order('created_at', { ascending: false });
  transactions.value = transData;
  
  loading.value = false;
};

const generateFinanceRef = (type = 'EXP') => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, ''); // Format YYYYMMDD
  const timePart = now.getTime().toString().slice(-4); // 4 derniers chiffres du timestamp
  return `${type}-${datePart}-${timePart}`;
};

const addTransaction = async () => {
  if (newTransaction.value.amount <= 0 || !newTransaction.value.label) {
    return showNotification("Veuillez remplir tous les champs obligatoires.", 'error');
  }

  loading.value = true;
  // Déterminer le préfixe selon la catégorie
  const prefix = newTransaction.value.category === 'expense' ? 'EXP' : 'BUD';
  const tRef = generateFinanceRef(prefix);

  try {
    const { error } = await supabase
      .from('finance_transactions')
      .insert([{
        transaction_ref: tRef,
        companyref: userStore.user.company.companyref, // Structure corrigée
        projectref: newTransaction.value.projectref || null,
        amount: newTransaction.value.amount,
        label: newTransaction.value.label,
        category: newTransaction.value.category,
        created_by: userStore.user.user.userref, // Lien vers l'employé qui saisit
        account_code: newTransaction.value.category === 'expense' ? '601' : '101'
      }]);

    if (error) throw error;

    showModal.value = false;
    // Reset du formulaire
    newTransaction.value = { projectref: '', amount: 0, label: '', category: 'expense' };
    await fetchData(); 
    showNotification("Dépense enregistrée avec succès !");
    
  } catch (err) {
    console.error("Erreur transaction:", err.message);
    showNotification("Erreur lors de l'enregistrement.", 'error');
  } finally {
    loading.value = false;
  }
};

const totalExpenses = computed(() => {
  return transactions.value
    .filter(t => t.category === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
});

const updateChart = async () => {
  await nextTick();
  
  if (!chartCanvas.value) {
    console.warn("Canvas non trouvé");
    return;
  }

  if (financeChart) financeChart.destroy();

  const totalOut = totalExpenses.value;
  const totalIn = totalIncome.value;

  // Si aucune donnée, on ne dessine pas ou on met des données vides
  if (totalOut === 0 && totalIn === 0) return;

  financeChart = new Chart(chartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: ['Dépenses', 'Entrées'],
      datasets: [{
        data: [totalOut, totalIn],
        backgroundColor: ['#ef4444', '#10b981'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      cutout: '70%'
    }
  });
};

const exportToCSV = () => {
  if (transactions.value.length === 0) return alert("Aucune donnée à exporter");

  // 1. Définir les entêtes du fichier
  const headers = ["Date", "Libelle", "Projet", "Categorie", "Montant (XAF)", "Reference"];
  
  // 2. Transformer les transactions en lignes CSV
  const rows = transactions.value.map(t => [
    new Date(t.created_at).toLocaleDateString(),
    t.label,
    t.project?.projectname || "Hors projet",
    t.category === 'expense' ? 'Depense' : 'Budget',
    t.amount,
    t.transaction_ref
  ]);

  // 3. Construire le contenu (CSV utilise souvent le point-virgule pour Excel France/Afrique)
  let csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(";") + "\n" 
    + rows.map(e => e.join(";")).join("\n");

  // 4. Créer un lien de téléchargement invisible
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const fileName = `Export_Finance_${userStore.user.company.companyname}_${new Date().toLocaleDateString()}.csv`;
  link.setAttribute("download", fileName);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const newInvoice = ref({
  client_name: '',
  project_ref: '',
  due_date: '',
  items: [{ description: '', quantity: 1, unit_price: 0 }]
});

// Ajouter une ligne d'article
const addLine = () => {
  newInvoice.value.items.push({ description: '', quantity: 1, unit_price: 0 });
};

// Récupérer les factures
const fetchInvoices = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('company_ref', userStore.user.companyref)
    .order('created_at', { ascending: false });
  
  if (!error) invoices.value = data;
};

// Marquer comme payée (Le trigger SQL fera le reste en finance)
const isProcessing = ref(null); // Stocke l'invoice_id en cours de paiement

const markAsPaid = async (inv) => {
  if (inv.status === 'paid' || isProcessing.value === inv.invoice_id) return;

  isProcessing.value = inv.invoice_id; // Active le chargement

  try {
    const paymentRef = `PAY-${inv.invoice_number}`;

    // Insertion de la transaction
    const { error: transError } = await supabase
      .from('finance_transactions')
      .insert([{
        transaction_ref: paymentRef,
        companyref: userStore.user.company.companyref,
        projectref: inv.project_ref,
        amount: inv.total_ttc,
        label: `Encaissement Facture ${inv.invoice_number}`,
        category: 'income',
        account_code: '701'
      }]);

    if (transError && transError.code === '23505') {
      showNotification("Cette facture a déjà été marquée comme payée.", 'error');
    } else if (transError) throw transError;

    // Update facture
    const { error: invError } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('invoice_id', inv.invoice_id);

    if (invError) throw invError;

    await fetchInvoices();
    await fetchData();

  } catch (err) {
    console.error(err);
    showNotification("Erreur lors de la mise à jour du statut de la facture.", 'error');
  } finally {
    isProcessing.value = null; // Désactive le chargement
  }
};

const saveInvoice = async () => {
  // 1. Validation de base
  if (!newInvoice.value.client_name || newInvoice.value.items[0].description === '') {
    showNotification("Veuillez remplir au moins le nom du client et une ligne d'article.", 'error');
    return;
  }

  try {
    // 2. Calcul des montants
    const ht = newInvoice.value.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tvaRate = 0.1925; // 19.25% (TVA Cameroun par exemple)
    const ttc = ht * (1 + tvaRate);
    
    // Génération d'un numéro de facture unique
    const invNumber = `INV-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // 3. Insertion de l'entête de la facture
    const { data: invData, error: invErr } = await supabase
      .from('invoices')
      .insert([{
        invoice_number: invNumber,
        company_ref: userStore.user.company.companyref,
        client_name: newInvoice.value.client_name,
        project_ref: newInvoice.value.project_ref || null,
        due_date: newInvoice.value.due_date,
        total_ht: ht,
        total_ttc: ttc,
        status: 'sent' // Par défaut, on considère qu'elle est envoyée dès création
      }])
      .select()
      .single();

    if (invErr) throw invErr;

    // 4. Préparation et insertion des lignes d'articles
    const itemsToInsert = newInvoice.value.items.map(item => ({
      invoice_id: invData.invoice_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price
    }));

    const { error: itemsErr } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);

    if (itemsErr) throw itemsErr;

    // 5. Finalisation
    showNotification("Facture créée avec succès !");
    invoiceModal.value = false;
    resetInvoiceForm();
    await fetchInvoices(); // Rafraîchir la liste des factures

  } catch (err) {
    console.error("Erreur lors de la création de la facture:", err);
    alert("Impossible de créer la facture. Vérifiez votre connexion.");
  }
};

// Fonction de réinitialisation du formulaire
const resetInvoiceForm = () => {
  newInvoice.value = {
    client_name: '',
    project_ref: '',
    due_date: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }]
  };
};

const calculateHT = () => {
  return newInvoice.value.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
};

const generateInvoicePDF = async (inv) => {
  // 1. Récupérer les items de cette facture spécifique
  const { data: items, error } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', inv.invoice_id);

  if (error) return alert("Erreur lors de la récupération des détails.");

  const doc = new jsPDF();
  const company = userStore.user.company;

  // --- EN-TÊTE ---
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235); // Bleu primaire
  doc.text("FACTURE", 190, 20, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont(undefined, 'bold');
  doc.text(company.companyname, 20, 20);
  doc.setFont(undefined, 'normal');
  doc.text("Cameroun, Douala", 20, 26); // À dynamiser selon tes données
  
  // --- INFOS CLIENT & FACTURE ---
  doc.setDrawColor(230);
  doc.line(20, 35, 190, 35);

  doc.text("Facturer à :", 20, 45);
  doc.setFont(undefined, 'bold');
  doc.text(inv.client_name, 20, 51);
  
  doc.setFont(undefined, 'normal');
  doc.text(`N° Facture : ${inv.invoice_number}`, 190, 45, { align: 'right' });
  doc.text(`Date : ${new Date(inv.created_at).toLocaleDateString()}`, 190, 51, { align: 'right' });
  doc.text(`Échéance : ${inv.due_date || 'Immédiate'}`, 190, 57, { align: 'right' });

  // --- TABLEAU DES ARTICLES ---
  const tableRows = items.map(item => [
    item.description,
    item.quantity.toString(),
    item.unit_price.toLocaleString() + " XAF",
    (item.quantity * item.unit_price).toLocaleString() + " XAF"
  ]);

  doc.autoTable({
    startY: 70,
    head: [['Désignation', 'Qté', 'Prix Unitaire', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillGray: [37, 99, 235], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 5 }
  });

  // --- CALCULS FINAUX ---
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.text("Total HT :", 140, finalY);
  doc.text(inv.total_ht.toLocaleString() + " XAF", 190, finalY, { align: 'right' });
  
  doc.text("TVA (19.25%) :", 140, finalY + 7);
  doc.text((inv.total_ttc - inv.total_ht).toLocaleString() + " XAF", 190, finalY + 7, { align: 'right' });

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text("TOTAL TTC :", 140, finalY + 16);
  doc.text(inv.total_ttc.toLocaleString() + " XAF", 190, finalY + 16, { align: 'right' });

  // --- PIED DE PAGE ---
  doc.setFontSize(9);
  doc.setFont(undefined, 'italic');
  doc.setTextColor(100);
  doc.text("Merci de votre confiance.", 105, 280, { align: 'center' });

  doc.save(`${inv.invoice_number}_${inv.client_name}.pdf`);
};

// On observe les transactions pour mettre à jour le graphique

watch(activeTab, (newTab) => {
  if (newTab === 'transactions') {
    updateChart();
  }
});
watch(loading, (newLoading) => {
  if (!newLoading && activeTab.value === 'transactions') {
    // Un petit délai de 100ms suffit souvent à laisser le DOM respirer
    setTimeout(() => {
      updateChart();
    }, 100);
  }
});

onMounted(async () => {
  await fetchData(); // Attend la fin du chargement des transactions
  await fetchInvoices();
  
  // Force le rendu si on est sur le bon onglet
  if (activeTab.value === 'transactions') {
    await nextTick();
    updateChart();
  }
});
</script>

<template>
  <Transition name="toast">
    <div v-if="toast.show" :class="['toast-notification', toast.type]">
      <div class="toast-content">
        <span v-if="toast.type === 'success'">✅</span>
        <span v-else>⚠️</span>
        <p>{{ toast.message }}</p>
      </div>
      <div class="toast-progress"></div>
    </div>
  </Transition>
  <div class="finance-page">
    <div class="tab-system">
      <button :class="{ active: activeTab === 'transactions' }" @click="activeTab = 'transactions'">
        📜 Historique Cash
      </button>
      <button :class="{ active: activeTab === 'invoices' }" @click="activeTab = 'invoices'">
        🧾 Factures Clients
      </button>
    </div>
    <div v-if="activeTab === 'transactions'" class="table-container">
      <div class="finance-header">
        <div class="stats-cards">
          <div class="card balance-card">
            <span class="label">Solde Actuel (Trésorerie)</span>
            <span class="amount" :class="netBalance >= 0 ? 'text-green' : 'text-red'">
              {{ netBalance.toLocaleString() }} XAF
            </span>
          </div>
          <div class="card total">
            <span class="label">Total Dépenses</span>
            <span class="amount text-red">{{ totalExpenses.toLocaleString() }} XAF</span>
          </div>
        </div>
        <div class="header-actions">
          <button @click="exportToCSV" class="btn-export">📥 Exporter (CSV)</button>
          <button @click="showModal = true" class="btn-primary">+ Ajouter un frais / budget</button>
        </div>
      </div>
      <div class="closing-action-bar">
        <div class="info">
          <h4>Statut de la période</h4>
          <p v-if="!isClosing">La période est actuellement <strong>Ouverte</strong> (Modifications autorisées).</p>
          <p v-else>Traitement de la clôture...</p>
        </div>
            
        <button 
          @click="closeCurrentMonth" 
          class="btn-lock" 
          :disabled="isClosing || (generateMonthlyReport && generateMonthlyReport.totalRevenue === 0)"
        >
          <span>{{ isClosing ? '⏳' : '🔒' }}</span>
          Clôturer le mois définitivement
        </button>
      </div>
      <div class="finance-overview">
        <div class="stats-cards">
          <div class="card total">
            <span class="label">Total Dépenses</span>
            <span class="amount">{{ totalExpenses.toLocaleString() }} XAF</span>
          </div>
          <div class="card payroll">
            <span class="label">Masse Salariale</span>
            <span class="amount" style="color: #6366f1;">
              {{ transactions.filter(t => t.transaction_ref?.startsWith('PAY-')).reduce((sum, t) => sum + t.amount, 0).toLocaleString() }} XAF
            </span>
          </div>
        </div>

        <div class="chart-container">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>
      <section class="report-section card">
        <div class="report-header">
          <h3>📊 Bilan de Performance Mensuel</h3>
          <button @click="window.print()" class="btn-text">🖨️ Imprimer le rapport</button>
        </div>

        <div class="report-grid">
          <div class="report-column">
            <h4>Structure du Capital</h4>
            <div class="report-row">
              <span>Capitaux Propres (Cl. 1)</span>
              <strong>{{ generateMonthlyReport.capital.toLocaleString() }} XAF</strong>
            </div>
            <div class="report-row">
              <span>Trésorerie Disponible</span>
              <strong class="text-green">{{ generateMonthlyReport.cashOnHand.toLocaleString() }} XAF</strong>
            </div>
          </div>

          <div class="report-column">
            <h4>Compte de Résultat</h4>
            <div class="report-row">
              <span>Chiffre d'Affaires (Cl. 7)</span>
              <strong>+ {{ generateMonthlyReport.totalRevenue.toLocaleString() }} XAF</strong>
            </div>
            <div class="report-row">
              <span>Total des Charges (Cl. 6)</span>
              <strong class="text-red">- {{ generateMonthlyReport.totalExpenses.toLocaleString() }} XAF</strong>
            </div>
            <hr>
            <div class="report-row highlight">
              <span>RÉSULTAT NET</span>
              <strong :class="generateMonthlyReport.netResult >= 0 ? 'text-green' : 'text-red'">
                {{ generateMonthlyReport.netResult.toLocaleString() }} XAF
              </strong>
            </div>
          </div>
        </div>

        <div class="report-footer">
          <div class="kpi-box">
            <span>Marge Net</span>
            <strong>{{ generateMonthlyReport.margin }} %</strong>
          </div>
          <p class="disclaimer">Document généré automatiquement par OpenTask Finance - Conforme principes OHADA.</p>
        </div>
      </section>
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
              <td>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-weight: 600;">{{ t.label }}</span>
                  <small v-if="t.transaction_ref.startsWith('PAY-')" style="color: #6366f1;">💰 Paiement Salaire</small>
                </div>
              </td>
              <td>
                <span v-if="t.project">{{ t.project.projectname }}</span>
                <span v-else style="color: #94a3b8; font-style: italic;">Hors projet / Frais fixes</span>
              </td>
              <td>
                <span :class="['badge', t.category]">
                  {{ t.category === 'expense' ? 'Dépense' : 'Budget' }}
                </span>
              </td>
              <td :class="t.category === 'expense' ? 'text-red' : 'text-green'">
                {{ t.category === 'expense' ? '-' : '+' }} {{ t.amount.toLocaleString() }} XAF
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
    <div v-if="activeTab === 'invoices'" class="table-container">
      <div class="flex-header">
        <h3>Factures Émises</h3>
        <button @click="invoiceModal = true" class="btn-primary">+ Créer une facture</button>
      </div>
      <table class="finance-table">
        <thead>
          <tr>
            <th>N° Facture</th>
            <th>Client</th>
            <th>Projet</th>
            <th>Total TTC</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inv in invoices" :key="inv.invoice_id">
            <td>{{ inv.invoice_number }}</td>
            <td>{{ inv.client_name }}</td>
            <td>{{ inv.project?.projectname || 'H.P' }}</td>
            <td class="text-green">{{ inv.total_ttc.toLocaleString() }} XAF</td>
            <td>
              <span :class="['badge', inv.status]">{{ inv.status }}</span>
            </td>
            <td>
              <button 
                v-if="inv.status !== 'paid'" 
                @click="markAsPaid(inv)" 
                class="btn-icon btn-pay"
                :disabled="isProcessing === inv.invoice_id"
              >
                <span v-if="isProcessing === inv.invoice_id" class="loader-mini"></span>
                <span v-else>✅ Payer</span>
              </button>
              
              <button @click="generateInvoicePDF(inv)" class="btn-icon">🖨️ PDF</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="invoiceModal" class="modal-overlay">
      <div class="modal invoice-modal">
        <h3>Nouvelle Facture</h3>
        <input v-model="newInvoice.client_name" placeholder="Nom du Client" class="input">
        
        <div class="items-list">
          <div v-for="(item, index) in newInvoice.items" :key="index" class="item-row">
            <input v-model="item.description" placeholder="Désignation" class="input flex-2">
            <input v-model.number="item.quantity" type="number" placeholder="Qté" class="input flex-1">
            <input v-model.number="item.unit_price" type="number" placeholder="PU" class="input flex-1">
          </div>
          <button @click="addLine" class="btn-text">+ Ajouter une ligne</button>
        </div>
        <div class="invoice-summary">
          <div class="summary-line">Total HT: <strong>{{ calculateHT().toLocaleString() }} XAF</strong></div>
          <div class="summary-line">TVA (19.25%): <span>{{ (calculateHT() * 0.1925).toLocaleString() }} XAF</span></div>
          <div class="summary-line total">TOTAL TTC: <strong>{{ (calculateHT() * 1.1925).toLocaleString() }} XAF</strong></div>
        </div>
        <div class="actions">
          <button @click="invoiceModal = false">Annuler</button>
          <button @click="saveInvoice" class="btn-primary">Générer la facture</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Conteneur principal */
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 300px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 16px;
  z-index: 9999;
  border-left: 5px solid #10b981; /* Vert par défaut */
  overflow: hidden;
}

.toast-notification.error {
  border-left-color: #ef4444;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toast-content p {
  margin: 0;
  color: #1e293b;
  font-weight: 500;
  font-size: 0.95rem;
}

/* Barre de progression qui s'écoule */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: #f1f5f9;
}

.toast-progress::after {
  content: "";
  position: absolute;
  left: 0;
  height: 100%;
  width: 100%;
  background: #10b981;
  animation: progress 3s linear forwards;
}

.toast-notification.error .toast-progress::after {
  background: #ef4444;
}

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}

/* Animations Vue (Transition) */
.toast-enter-active {
  animation: toast-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-leave-active {
  animation: toast-in 0.3s reverse ease-in;
}

@keyframes toast-in {
  from { transform: translateX(120%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
  .tab-system {
  display: flex;
  gap: 5px;
  background: #f1f5f9;
  padding: 5px;
  border-radius: 10px;
  margin-bottom: 20px;
  width: fit-content;
}

.tab-system button {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: #64748b;
  transition: 0.3s;
}

.tab-system button.active {
  background: white;
  color: #2563eb;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.flex-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }

/* Styles pour les badges de facture */
.badge.sent { background: #e0f2fe; color: #0369a1; }
.badge.paid { background: #dcfce7; color: #166534; }
.badge.draft { background: #f1f5f9; color: #475569; }

.item-row { display: flex; gap: 10px; margin-bottom: 10px; }
.flex-2 { flex: 2; }
.flex-1 { flex: 1; }
.finance-page { padding: 20px; }
.finance-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-top: 60px; }
.stats-cards { display: flex; gap: 20px; }
.card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); min-width: 200px; }
.card .label { display: block; color: #64748b; font-size: 0.9rem; }
.card .amount { font-size: 1.8rem; font-weight: bold; color: #1e293b; }
.finance-overview {
  display: grid;
  grid-template-columns: 1fr 300px; /* Stats à gauche, graphique à droite */
  gap: 20px;
  margin-bottom: 30px;
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  height: 250px;
  display: flex;
  justify-content: center;
}

.card.payroll {
  border-left: 4px solid #6366f1;
}

@media (max-width: 900px) {
  .finance-overview {
    grid-template-columns: 1fr;
  }
}
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
.btn-primary { background: #2563eb; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; }.header-actions {
  display: flex;
  gap: 12px;
}

.btn-export {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b;
}
.btn-pay {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
  padding: 6px 12px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-pay:hover:not(:disabled) {
  background-color: #bbf7d0;
}

.btn-pay:disabled {
  opacity: 0.7;
  cursor: wait;
}

/* Petit Spinner Animé */
.loader-mini {
  width: 14px;
  height: 14px;
  border: 2px solid #166534;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Style spécifique pour les boutons icônes */
.btn-icon {
  margin-right: 5px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
}
.report-section {
  background: #fff;
  padding: 2rem;
  margin-top: 30px;
  border-top: 4px solid #1e293b;
}

.report-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.report-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.report-column h4 {
  color: #64748b;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 15px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 5px;
}

.report-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 0.95rem;
}

.report-row.highlight {
  font-size: 1.1rem;
  font-weight: 800;
  margin-top: 10px;
}

.report-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px dashed #cbd5e1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-box {
  background: #f8fafc;
  padding: 10px 20px;
  border-radius: 8px;
  text-align: center;
}

.kpi-box span { display: block; font-size: 0.7rem; color: #64748b; }

.disclaimer { font-size: 0.75rem; color: #94a3b8; font-style: italic; }

@media print {
  body * { visibility: hidden; }
  .report-section, .report-section * { visibility: visible; }
  .report-section { position: absolute; left: 0; top: 0; width: 100%; border: none; }
  .btn-text { display: none; }
}
.closing-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff4e5; /* Couleur d'avertissement douce */
  border: 1px solid #ffcc91;
  padding: 1.5rem;
  border-radius: 12px;
  margin: 2rem 0;
}

.closing-action-bar .info h4 {
  margin: 0;
  color: #854d0e;
  font-size: 1rem;
}

.closing-action-bar .info p {
  margin: 5px 0 0;
  font-size: 0.85rem;
  color: #a16207;
}

.btn-lock {
  background: #1e293b;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;
}

.btn-lock:hover:not(:disabled) {
  background: #000;
  transform: scale(1.02);
}

.btn-lock:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
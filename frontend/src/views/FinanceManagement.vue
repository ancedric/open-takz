<script setup>
import { ref, onMounted, computed, watch } from 'vue';
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

// Formulaire nouvelle transaction
const showModal = ref(false);
const newTransaction = ref({
  projectref: '',
  amount: 0,
  label: '',
  category: 'expense'
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
    .eq('userref', userStore.user.userref); // Ou filtre par companyref si vous l'avez ajouté
  projects.value = projData;

  // 2. Récupérer les transactions
  const { data: transData } = await supabase
    .from('finance_transactions')
    .select('*, project:project(projectname)')
    .eq('companyref', userStore.user.companyref)
    .order('created_at', { ascending: false });
  transactions.value = transData;
  
  loading.value = false;
};

const addTransaction = async () => {
  const tRef = 'TRANS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const { error } = await supabase
    .from('finance_transactions')
    .insert([{
      ...newTransaction.value,
      transaction_ref: tRef,
      companyref: userStore.user.companyref,
      created_by: userStore.user.userref
    }]);

  if (!error) {
    showModal.value = false;
    fetchData();
  }
};

const totalExpenses = computed(() => {
  return transactions.value
    .filter(t => t.category === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
});

const updateChart = () => {
  if (financeChart) financeChart.destroy();
  if (!chartCanvas.value) return;

  // Calcul des données
  const payrollTotal = transactions.value
    .filter(t => t.transaction_ref?.startsWith('PAY-'))
    .reduce((sum, t) => sum + t.amount, 0);

  const projectExpenses = transactions.value
    .filter(t => t.category === 'expense' && !t.transaction_ref?.startsWith('PAY-'))
    .reduce((sum, t) => sum + t.amount, 0);

  financeChart = new Chart(chartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: ['Salaires (Frais Fixes)', 'Dépenses Projets'],
      datasets: [{
        data: [payrollTotal, projectExpenses],
        backgroundColor: ['#6366f1', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      },
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
    .select('*, project:project(projectname)')
    .eq('company_ref', userStore.user.companyref)
    .order('created_at', { ascending: false });
  
  if (!error) invoices.value = data;
};

// Marquer comme payée (Le trigger SQL fera le reste en finance)
const markAsPaid = async (inv) => {
  const { error } = await supabase
    .from('invoices')
    .update({ status: 'paid' })
    .eq('invoice_id', inv.invoice_id);

  if (!error) {
    alert("Facture marquée comme payée et enregistrée en finance !");
    fetchInvoices();
    fetchData(); // Rafraîchit aussi les transactions
  }
};

const saveInvoice = async () => {
  // 1. Validation de base
  if (!newInvoice.value.client_name || newInvoice.value.items[0].description === '') {
    alert("Veuillez remplir au moins le nom du client et une ligne d'article.");
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
    alert(`Facture ${invNumber} créée avec succès !`);
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
watch(transactions, () => {
  updateChart();
}, { deep: true });

onMounted(() => {
  fetchData();
  fetchInvoices();
});
</script>

<template>
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
          <div class="card total">
            <span class="label">Total Dépenses</span>
            <span class="amount">{{ totalExpenses.toLocaleString() }} XAF</span>
          </div>
        </div>
        <div class="header-actions">
          <button @click="exportToCSV" class="btn-export">📥 Exporter (CSV)</button>
          <button @click="showModal = true" class="btn-primary">+ Ajouter un frais / budget</button>
        </div>
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
              <button v-if="inv.status !== 'paid'" @click="markAsPaid(inv)" class="btn-icon">✅ Payer</button>
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
</style>
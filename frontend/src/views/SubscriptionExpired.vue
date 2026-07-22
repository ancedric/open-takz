<template>
  <div class="subscription-container">
    <div class="glass-card">
      <div class="icon-warning">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      </div>
      
      <h1>Session Suspendue</h1>
      <p class="subtitle">Votre accès à <strong>Corevia</strong> a expiré. Choisissez un plan pour continuer.</p>

      <!-- Grille des Plans -->
      <div class="plans-grid">
        <div v-for="plan in plans" :key="plan.id" class="plan-card" :class="{ 'popular': plan.id === 'pro' }">
          <div v-if="plan.badge" class="badge">{{ plan.badge }}</div>
          <h3>{{ plan.name }}</h3>
          <div class="price">{{ plan.price.toLocaleString() }}<span> €/mois</span></div>
          <ul>
            <li v-for="feat in plan.features" :key="feat" class="plan-feat">{{ feat }}</li>
          </ul>
          <button @click="openPaymentModal(plan)" class="btn-primary" :class="plan.btnClass">
            Choisir {{ plan.name }}
          </button>
        </div>
      </div>

      <!-- Modal de Paiement (Mobile Money / Carte / Manuel) -->
      <div v-if="showModal" class="modal-overlay">
        <div class="modal-content">
          <h3>Paiement : Plan {{ selectedPlan.name }}</h3>
          <p>Montant à régler : <strong>{{ selectedPlan.price.toLocaleString() }} XAF</strong></p>
          
          <div class="payment-methods">
            <button @click="paymentMethod = 'MOMO'" :class="{ active: paymentMethod === 'MOMO' }">MTN MoMo</button>
            <button @click="paymentMethod = 'OM'" :class="{ active: paymentMethod === 'OM' }">Orange Money</button>
            <button @click="paymentMethod = 'CARD'" :class="{ active: paymentMethod === 'CARD' }">Carte Bancaire</button>
            <button @click="paymentMethod = 'MANUAL'" :class="{ active: paymentMethod === 'MANUAL' }">Virement / Preuve</button>
          </div>

          <!-- Formulaire Mobile Money -->
          <div v-if="paymentMethod === 'MOMO' || paymentMethod === 'OM'" class="form-group">
            <input v-model="phoneNumber" type="tel" placeholder="Numéro de téléphone (6xxxxxxxx)" class="input-field" />
            <button @click="processDigitalPayment" :disabled="loading" class="btn-pay">
              {{ loading ? 'En attente du Push...' : 'Lancer le paiement' }}
            </button>
          </div>

          <!-- Formulaire Manuel (Votre logique précédente) -->
          <div v-if="paymentMethod === 'MANUAL'" class="form-group">
            <p class="info-text">Téléchargez la capture d'écran du virement ou reçu.</p>
            <input type="file" @change="handleFileUpload" accept="image/*" class="input-file" />
          </div>

          <button @click="showModal = false" class="btn-close">Annuler</button>
        </div>
      </div>

      <button @click="logout" class="btn-ghost">Se déconnecter</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '../store/index';
import { useRouter } from 'vue-router';
import supabase from '../services/supabaseConfig';
import { PaymentService } from '../services/paymentService';

const userStore = useUserStore();
const router = useRouter();

// États
const showModal = ref(false);
const loading = ref(false);
const selectedPlan = ref(null);
const paymentMethod = ref('MOMO');
const phoneNumber = ref('');

// Définition des nouveaux plans
const plans = [
  { id: 'free', name: 'Free', price: 0, features: ['1 Utilisateur (mode employé)', 'Aucune entreprise ou magasin', 'Support Communauté'], btnClass: 'btn-silver' },
  { id: 'starter', name: 'Starter', price: 10, features: ['1 Utilisateurs', '1 Magasin', 'Support Mail'], btnClass: 'btn-primary' },
  { id: 'pro', name: 'Pro', price: 20, features: ['Employés illimités', '1 entreprise + magasin', 'Accès limité aux modules', 'Support 24/7'], badge: 'Populaire', btnClass: 'btn-gold' },
  { id: 'premium', name: 'Premium', price: 45, features: ['Sur mesure', 'Multi-entreprises', 'Accès à tous les modules'], btnClass: 'btn-dark' }
];

const openPaymentModal = (plan) => {
  selectedPlan.value = plan;
  if (plan.price === 0) {
    handleFreePlan();
  } else {
    showModal.value = true;
  }
};

// --- LOGIQUE PAIEMENT DIGITAL (MOMO/OM/CARD) ---
const processDigitalPayment = async () => {
  loading.value = true;
  try {
    await PaymentService.processSubscription({
      companyRef: userStore.user.company.companyref,
      amount: selectedPlan.value.price,
      phone: phoneNumber.value,
      method: paymentMethod.value,
      planId: selectedPlan.value.id
    });
    
    alert("Paiement initié ! Validez sur votre téléphone.");
  } catch (err) {
    alert("Erreur : " + err.message);
  } finally {
    loading.value = false;
  }
};

// --- LOGIQUE MANUELLE (IMAGE) ---
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  loading.value = true;

  try {
    const companyRef = userStore.user.company.companyref;
    const fileName = `${companyRef}_${Date.now()}_${file.name}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from('renewals-captures')
      .upload(fileName, file);

    if (storageError) throw storageError;

    await supabase.from('subscription_renewals').insert({
      companyref: companyRef,
      userplan: selectedPlan.value.id,
      capture: storageData.path,
      status: 'pending'
    });

    alert("Preuve envoyée ! Validation en cours.");
    showModal.value = false;
  } catch (error) {
    alert("Erreur upload preuve.");
  } finally {
    loading.value = false;
  }
};

const handleFreePlan = () => { /* Logique pour passer au plan gratuit */ };
const logout = () => { userStore.logout(); router.push('/auth'); };
</script>

<style scoped>
    .subscription-container {
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8fafc;
        padding: 20px;
    }

    .glass-card {
        background: white;
        padding: 40px;
        border-radius: 24px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        text-align: center;
        max-width: 800px;
        width: 100%;
    }

    .plans-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 15px;
        margin: 30px 0;
    }

    .plan-card {
        border: 2px solid #e2e8f0;
        padding: 30px;
        border-radius: 16px;
        transition: all 0.3s ease;
    }

    .plan-card.popular {
        border-color: #f59e0b;
        position: relative;
        transform: scale(1.05);
    }

    .badge {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: #f59e0b;
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
    }

    .price {
        font-size: 32px;
        font-weight: 800;
        margin: 20px 0;
    }

    .price span {
        font-size: 16px;
        color: #64748b;
    }
    .btn-primary {
        background: #5a5cd4;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        width: 100%;
    }
    .btn-ghost {
        background: #fa6060;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        width: 100%;
    }
    .btn-gold {
        background: #f59e0b;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        width: 100%;
    }

.modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 30px;
    border-radius: 20px;
    width: 90%;
    max-width: 500px;
}

.payment-methods {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin: 20px 0;
}

.payment-methods button {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    flex: 1;
}

.payment-methods button.active {
    background: #5a5cd4;
    color: white;
    border-color: #5a5cd4;
}

.input-field {
    width: 100%;
    padding: 12px;
    margin: 15px 0;
    border: 1px solid #ccc;
    border-radius: 8px;
}

.btn-pay {
    background: #10b981;
    color: white;
    border: none;
    padding: 12px;
    width: 100%;
    border-radius: 8px;
    font-weight: bold;
}
.plan-card ul{
    padding: 0;
    margin: 20px 0;
}
.plan-feat {
    list-style-type: none;
    font-size: 0.7rem;
    color: #334155;
    text-align: left;
}
/* Styles des boutons de plans */
.btn-silver { background: #94a3b8; color: white; border: none; padding: 10px; border-radius: 8px; width: 100%; }
.btn-dark { background: #1e293b; color: white; border: none; padding: 10px; border-radius: 8px; width: 100%; }
.btn-close { background: #ef4444; color: white; border: none; padding: 10px; border-radius: 8px; width: 100%; margin-top: 20px; }
</style>
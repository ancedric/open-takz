<script setup>
import { ref } from 'vue';
import { api } from '../../services/api';
import { useUserStore } from '../../store/index';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Toast from '../../components/Toast.vue';
import { triggerToast } from '../../services/toast.js';

const {t} = useI18n();

const userStore = useUserStore();
const router = useRouter();
const companyName = ref('');
const logoFile = ref(null);
const legalForm = ref('');
const companyAddress = ref('')
const registeredNumber = ref('');
const companyEmail = ref('')
const companyPhone = ref('')
const companyCountry = ref(null)
const companyAbout = ref('');
const companyActivity = ref('');
const loading = ref(false);
const userref = router.currentRoute.value.params.userref;

const onFileChange = (e) => {
  logoFile.value = e.target.files[0];
};

const handleCreate = async () => {
  if (!companyName.value) return triggerToast("Nom requis", "error");
  loading.value = true;

  try {
    const response = await api.post('/company/new-company', {
      companyname: companyName.value,
      legal_form: legalForm.value,
      country: companyCountry.value,
      email: companyEmail.value,
      address: companyAddress.value,
      register_number: registeredNumber.value,
      phone: companyPhone.value,
      owner_ref: userref,
      about: companyAbout.value,
      activity: companyActivity.value
    });

    if(response.data.success !== true) {
      triggerToast("Erreur lors de la création de l'entreprise", "error")
      throw new Error("Erreur lors de la création de l'entreprise");
    }
    
    userStore.user.company = response.data.company;

    const deptResponse = await api.post('/department/create-default-departments', {
      companyref: response.data.company.companyref,
      userref: userref
    });

    if(deptResponse.data.success !== true) {
      triggerToast("Erreur lors de la création des départements", "error")
      console.error("Erreur lors de la création des départements", deptResponse.data.message);
      throw new Error("Erreur lors de la création des départements");
    }

    const updateEmpResponse = await api.put('/employe/update-privilege', {
      userref: userref,
      companyref: response.data.company.companyref,
      position : "CEO",
      privilege: 'owner'
    });
    if(updateEmpResponse.data.success !== true) {
      triggerToast("Erreur lors de la mise à jour de l'employé.", "error")
      throw new Error("Erreur lors de la mise à jour de l'employé");
    }

    triggerToast("Entreprise et départements créés avec succès !", "success");
    router.push('/home/');

  } catch (err) {
    console.error('Erreur détaillée:', err);
    triggerToast(err.response?.data.message || "Erreur serveur", "error");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <Toast />
  <div class="page setup-ctn">
    <div class="auth-ctn">
      <h3>{{ t('create_company.title') }}</h3>  
      <div class="input-ctn">
        <div class="label">{{ t('create_company.company_name') }}</div>
        <input v-model="companyName" class="set-input" required :placeholder="t('create_company.company_name')">
      </div>
      <div class="input-ctn">
        <div class="label">{{ t('create_company.logo') }}</div>
        <input type="file" @change="onFileChange" class="set-input">
      </div>
      <div class="input-ctn">
        <div class="label">{{ t('create_company.legal_form') }}</div>
        <select class="set-input" required v-model="legalForm">
          <option value="" disabled selected>{{ t('create_company.select_legal_form') }}</option>
          <option value="ETS">ETS/EI</option>
          <option value="SA">SA</option>
          <option value="SARL">SARL</option>
          <option value="SNC">SNC</option>
          <option value="SCS">SCS</option>
          <option value="SAS">SAS</option>
          <option value="GIE">GIE</option>
          <option value="EURL">EURL</option>
          <option value="SASU">SASU</option>
          <option value="SCI">SCI</option>
        </select>
      </div>
      <div class="input-ctn">
        <div class="label">{{ t('create_company.company_about') }}</div>
        <textarea v-model="companyAbout" class="set-input" :placeholder="t('create_company.company_about')"></textarea>
      </div>
      <div class="input-ctn">
        <div class="label">{{ t('create_company.company_activity') }}</div>
        <select class="set-input" required v-model="companyActivity">
          <option value="" disabled selected>{{ t('create_company.select_company_activity') }}</option>
            <option value="Aéronautique & spatial">{{ t('create_company.aeronautique_spatial') }}</option>
            <option value="Agroalimentaire">{{ t('create_company.agroalimentaire') }}</option>
            <option value="Assurances">{{ t('create_company.assurances') }}</option>
            <option value="Automobile">{{ t('create_company.automobile') }}</option>
            <option value="Banque">{{ t('create_company.banque') }}</option>
            <option value="Bâtiment et construction">{{ t('create_company.batiment_construction') }}</option>
            <option value="Bien-être">{{ t('create_company.bien_etre') }}</option>
            <option value="Commerce">{{ t('create_company.commerce') }}</option>
            <option value="Cosmétique">{{ t('create_company.cosmetique') }}</option>
            <option value="Education">{{ t('create_company.education') }}</option>
            <option value="Énergie">{{ t('create_company.energie') }}</option>
            <option value="Entretien & nettoyage">{{ t('create_company.entretien_nettoyage') }}</option>
            <option value="Esthétique & soins corporels">{{ t('create_company.esthetique_soins') }}</option>
            <option value="Finances & comptabilité">{{ t('create_company.finances_comptabilite') }}</option>
            <option value="Hôtellerie et Restauration">{{ t('create_company.hotellerie restauration') }}</option>
            <option value="Industrie">{{ t('create_company.industrie') }}</option>
            <option value="Informatique & Services IT">{{ t('create_company.informatique_services') }}</option>
            <option value="Juridique">{{ t('create_company.juridique') }}</option>
            <option value="Mines">{{ t('create_company.mines') }}</option>
            <option value="Pharmaceutique">{{ t('create_company.pharmaceutique') }}</option>
            <option value="Recherhe & développement">{{ t('create_company.recherche_developpement') }}</option>
            <option value="Ressources humaines">{{ t('create_company.ressources_humaines') }}</option>
            <option value="Santé">{{ t('create_company.sante') }}</option>
            <option value="Sécurité">{{ t('create_company.securite') }}</option>
            <option value="Services">{{ t('create_company.services') }}</option>
            <option value="Services publics">{{ t('create_company.services_publics') }}</option>
            <option value="Sport">{{ t('create_company.sport') }}</option>
            <option value="Télécommunictions">{{ t('create_company.telecommunications') }}</option>
            <option value="Tourisme">{{ t('create_company.tourisme') }}</option>
            <option value="Transport">{{ t('create_company.transport') }}</option>
          </select>
        </div>
        <div class="input-ctn">
          <div class="label">{{ t('create_company.country') }}</div>
          <select class="set-input" required v-model="companyCountry">
            <option value="" disabled selected>{{ t('create_company.select_country') }}</option>
            <option value="Algeria">{{ t('signup.algeria') }}</option>
            <option value="Angola">{{ t('signup.angola') }}</option>
            <option value="Argentina">{{ t('signup.argentina') }}</option>
            <option value="Australia">{{ t('signup.australia') }}</option>
            <option value="Austria">{{ t('signup.austria') }}</option>
            <option value="Belgium">{{ t('signup.belgium') }}</option>
            <option value="Benin">{{ t('signup.benin') }}</option>
            <option value="Botswana">{{ t('signup.botswana') }}</option>
            <option value="Brazil">{{ t('signup.brazil') }}</option>
            <option value="Burkina Faso">{{ t('signup.burkina_faso') }}</option>
            <option value="Burundi">{{ t('signup.burundi') }}</option>
            <option value="Cabo Verde">{{ t('signup.cabo_verde') }}</option>
            <option value="Canada">{{ t('signup.canada') }}</option>
            <option value="Cameroon">{{ t('signup.cameroon') }}</option>
            <option value="Central African Republic">{{ t('signup.central_african_republic') }}</option>
            <option value="Chad">{{ t('signup.chad') }}</option>
            <option value="Chile">{{ t('signup.chile') }}</option>
            <option value="China">{{ t('signup.china') }}</option>
            <option value="Colombia">{{ t('signup.colombia') }}</option>
            <option value="Congo">{{ t('signup.congo') }}</option>
            <option value="Comoros">{{ t('signup.comoros') }}</option>
            <option value="Congo">{{ t('signup.congo') }}</option>
            <option value="Côte d'Ivoire">{{ t('signup.cote_divoire') }}</option>
            <option value="Czech Republic">{{ t('signup.czech_republic') }}</option>
            <option value="Democratic Republic of the Congo">{{ t('signup.democratic_republic_of_the_congo') }}</option>
            <option value="Denmark">{{ t('signup.denmark') }}</option>
            <option value="Equatorial Guinea">{{ t('signup.equatorial_guinea') }}</option>
            <option value="Egypt">{{ t('signup.egypt') }}</option>
            <option value="Ethiopia">{{ t('signup.ethiopia') }}</option>
            <option value="France">{{ t('signup.france') }}</option>
            <option value="Gabon">{{ t('signup.gabon') }}</option>
            <option value="Ghana">{{ t('signup.ghana') }}</option>
            <option value="India">{{ t('signup.india') }}</option>
            <option value="Indonesia">{{ t('signup.indonesia') }}</option>
            <option value="Iran">{{ t('signup.iran') }}</option>
            <option value="Iraq">{{ t('signup.iraq') }}</option>
            <option value="Italy">{{ t('signup.italy') }}</option>
            <option value="Japan">{{ t('signup.japan') }}</option>
            <option value="Kenya">{{ t('signup.kenya') }}</option>
            <option value="Mexico">{{ t('signup.mexico') }}</option>
            <option value="Morocco">{{ t('signup.morocco') }}</option>
            <option value="Nigeria">{{ t('signup.nigeria') }}</option>
            <option value="Pakistan">{{ t('signup.pakistan') }}</option>
            <option value="Peru">{{ t('signup.peru') }}</option>
            <option value="Philippines">{{ t('signup.philippines') }}</option>
            <option value="Portugal">{{ t('signup.portugal') }}</option>
            <option value="Qatar">{{ t('signup.qatar') }}</option>
            <option value="Russia">{{ t('signup.russia') }}</option>
            <option value="Saudi Arabia">{{ t('signup.saudi_arabia') }}</option>
            <option value="South Africa">{{ t('signup.south_africa') }}</option>
            <option value="Spain">{{ t('signup.spain') }}</option>
            <option value="Sudan">{{ t('signup.sudan') }}</option>
            <option value="Sweden">{{ t('signup.sweden') }}</option>
            <option value="Switzerland">{{ t('signup.switzerland') }}</option>
            <option value="Thailand">{{ t('signup.thailand') }}</option>
            <option value="Turkey">{{ t('signup.turkey') }}</option>
            <option value="Ukraine">{{ t('signup.ukraine') }}</option>
            <option value="United Kingdom">{{ t('signup.united_kingdom') }}</option>
            <option value="United States">{{ t('signup.united_states') }}</option>
            <option value="Venezuela">{{ t('signup.venezuela') }}</option>
            <option value="Vietnam">{{ t('signup.vietnam') }}</option>
            <option value="Uganda">{{ t('signup.uganda') }}</option>
            <option value="Tanzania">{{ t('signup.tanzania') }}</option>
            <option value="Rwanda">{{ t('signup.rwanda') }}</option>
            <option value="Zambia">{{ t('signup.zambia') }}</option>
            <option value="Zimbabwe">{{ t('signup.zimbabwe') }}</option>
          </select>
        </div>
      <div class="input-ctn">
        <div class="label">{{ t('create_company.address') }}</div>
        <input type="text" v-model="companyAddress" class="set-input" required :placeholder="t('create_company.address_placeholder')">
      </div>
      <div class="input-ctn">
        <div class="label">{{ t('create_company.registered_number') }}</div>
        <input type="text" v-model="registeredNumber" class="set-input" required :placeholder="t('create_company.registered_number_placeholder') ">
      </div>
      <div class="input-ctn">
        <div class="label">{{ t('create_company.phone') }}</div>
        <input type="phone" v-model="companyPhone" class="set-input" required :placeholder="t('create_company.phone_placeholder') ">
      </div>
      <div class="input-ctn">
        <div class="label">{{ t('create_company.email') }}</div>
        <input type="email" v-model="companyEmail" class="set-input" required :placeholder="t('create_company.email_placeholder') ">
      </div>
      <button @click="handleCreate" class="auth-btn" :disabled="loading">
        {{ loading ? `${t('create_company.creating_company')}` : `${t('create_company.submit')}` }}
      </button>
    </div>
  </div>
</template>
<style scoped>

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
.page.setup-ctn {
    display: flex;
    justify-content: center;
    align-items: flex-start; /* Permet le scroll naturel si le formulaire est long */
    min-height: 100vh;
    padding: 20px 0;
    background-color: #f8f9fa; /* Léger fond pour détacher le formulaire */
}

.auth-ctn {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 600px; /* Plus étroit pour une meilleure lecture */
    margin: 0 auto;
    padding: 30px 20px;
    background-color: #fff;
    border-radius: 20px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    box-sizing: border-box;
}

/* Titre du formulaire */
h3 {
    color: #2a2f4f;
    margin-bottom: 30px;
    text-align: center;
    font-family: 'Poppins', sans-serif;
}

/* Conteneur de chaque champ */
.input-ctn {
    width: 100%;
    margin-bottom: 25px; /* Espace entre les blocs */
    position: relative;
}

/* Style commun pour Inputs, Selects et Textarea */
.auth-ctn .set-input {
    height: 50px;
    width: 100%;
    border-radius: 10px;
    background-color: transparent;
    color: #2a2f4f;
    padding: 0 15px;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    border: 1px solid #9da6e0;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.3s;
}

/* Spécificité pour le Textarea */
textarea.set-input {
    height: 100px;
    padding: 15px;
    resize: vertical;
}

/* Focus state */
.auth-ctn .set-input:focus {
    border-color: #2a2f4f;
    border-width: 2px;
}

/* Le Label flottant */
.input-ctn .label {
    position: absolute;
    top: -10px;
    left: 15px;
    font-size: 0.75rem;
    background-color: #fff;
    padding: 0 5px;
    z-index: 1;
    color: #9da6e0;
    font-weight: 500;
}

/* Bouton d'action */
.auth-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50px;
    width: 100%;
    max-width: 280px;
    border: none;
    border-radius: 12px;
    background-color: #2a2f4f;
    color: #eee;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    margin-top: 20px;
    box-shadow: 0 4px 15px rgba(42, 47, 79, 0.2);
}

.auth-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

/* --- RESPONSIVE MOBILE (< 860px) --- */
@media screen and (max-width: 860px) {
    .auth-ctn {
        width: 95%;
        margin-left: 0;
        transform: none; /* Supprime le décalage desktop */
        padding: 20px 15px;
        border-radius: 0; /* Full width sur mobile */
        box-shadow: none;
        border: none;
    }

    .input-ctn {
        margin-bottom: 20px;
    }

    .auth-btn {
        max-width: 100%; /* Bouton large sur mobile pour le pouce */
    }

    h3 {
        font-size: 1.2rem;
        margin-bottom: 20px;
    }
}
</style>
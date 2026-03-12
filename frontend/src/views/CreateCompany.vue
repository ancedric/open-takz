<script setup>
import { ref } from 'vue';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();
const companyName = ref('');
const logoFile = ref(null);
const legalForm = ref('');
const companyAddress = ref('')
const registerdNumber = ref('');
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
  if (!companyName.value) return alert("Nom requis");
  loading.value = true;
  
  const companyRef = 'COMP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  let publicLogoUrl = null;

  try {
    // 1. Upload du Logo
    if (logoFile.value) {
      const fileExt = logoFile.value.name.split('.').pop();
      const fileName = `${companyRef}.${fileExt}`;
      const filePath = `company/logos/${fileName}`; 

      const { error: uploadError } = await supabase.storage
        .from('opentasks_bucket')
        .upload(filePath, logoFile.value);

      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage.from('opentasks_bucket').getPublicUrl(filePath);
      publicLogoUrl = urlData.publicUrl;
    }

    // 2. Création de l'entreprise
    const { error: compError } = await supabase
      .from('company')
      .insert([{ 
        companyref: companyRef, 
        companyname: companyName.value, 
        logo_url: publicLogoUrl,
        legal_form: legalForm.value,
        country: companyCountry.value,
        email: companyEmail.value,
        address: companyAddress.value,
        register_number: registerdNumber.value, 
        phone: companyPhone.value,
        owner_ref: userref,
        about: companyAbout.value,
        activity: companyActivity.value 
      }]);

    if (compError) throw compError;

    // 3. Promotion de l'utilisateur ET création des départements en PARALLÈLE
    // On regroupe les départements dans un seul insert pour économiser le réseau
    const departments = [
      { deptref: 'DPT-RH-' + Math.random().toString(36).substr(2, 4), deptname: 'Ressources humaines', companyref: companyRef, manager_ref: userref },
      { deptref: 'DPT-ACC-' + Math.random().toString(36).substr(2, 4), deptname: 'Comptabilité', companyref: companyRef, manager_ref: userref },
      { deptref: 'DPT-MKT-' + Math.random().toString(36).substr(2, 4), deptname: 'Marketing', companyref: companyRef, manager_ref: userref },
      { deptref: 'DPT-FIN-' + Math.random().toString(36).substr(2, 4), deptname: 'Finances', companyref: companyRef, manager_ref: userref }
    ];

    const [empRes, deptRes] = await Promise.all([
      supabase.from('employe').update({ companyref: companyRef, privilege: 'owner' }).eq('userref', userref),
      supabase.from('department').insert(departments)
    ]);

    if (empRes.error) throw empRes.error;
    if (deptRes.error) throw deptRes.error;

    alert("Entreprise et départements créés avec succès !");
    router.push('/auth');

  } catch (err) {
    console.error('Erreur détaillée:', err);
    alert("Erreur de connexion au serveur. Vérifiez votre accès internet ou la configuration Supabase.");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="page setup-ctn">
    <div class="auth-ctn">
      <h3>Enregistrez votre entreprise</h3>
      <div class="input-ctn">
        <div class="label">Nom de l'entreprise</div>
        <input v-model="companyName" class="set-input" required placeholder="Nom officiel">
      </div>
      <div class="input-ctn">
        <div class="label">Logo</div>
        <input type="file" @change="onFileChange" class="set-input">
      </div>
      <div class="input-ctn">
        <div class="label">Forme juridique</div>
        <select class="set-input" required v-model="legalForm">
          <option value="" disabled selected>>Choisissez une option</option>
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
        <div class="label">A propos</div>
        <textarea v-model="companyAbout" class="set-input" placeholder="Décrivez votre entreprise"></textarea>
      </div>
      <div class="input-ctn">
        <div class="label">Secteur 'activité'</div>
        <select class="set-input" required v-model="companyActivity">
          <option value="" disabled selected>>Choisissez une option</option>
            <option value="Aéronautique & spatial">Aéronautique & spatial</option>
            <option value="Agroalimentaire">Agroalimentaire</option>
            <option value="Assurances">Assurances</option>
            <option value="Automobile">Automobile</option>
            <option value="Banque">Banque</option>
            <option value="Bâtiment et construction">Bâtiment et construction</option>
            <option value="Bien-être">Bien-être</option>
            <option value="Commerce">Commerce</option>
            <option value="Cosmétique">Cosmétique</option>
            <option value="Education">Education</option>
            <option value="Énergie">Énergie</option>
            <option value="Entretien & nettoyage">Entretien & nettoyage</option>
            <option value="Esthétique & soins corporels">Esthétique & soins corporels</option>
            <option value="Finances & comptabilité">Finances & comptabilité</option>
            <option value="Hôtellerie et Restauration">Hôtellerie et Restauration</option>
            <option value="Industrie">Industrie</option>
            <option value="Informatique & Services IT">Informatique & Services IT</option>
            <option value="Juridique">Juridique</option>
            <option value="Mines">Mines</option>
            <option value="Pharmaceutique">Pharmaceutique</option>
            <option value="Recherhe & développement">Recherhe & développement</option>
            <option value="Ressources humaines">Ressources humaines</option>
            <option value="Santé">Santé</option>
            <option value="Sécurité">Sécurité</option>
            <option value="Services">Services</option>
            <option value="Services publics">Services publics</option>
            <option value="Sport">Sport</option>
            <option value="Télécommunictions">Télécommunictions</option>
            <option value="Tourisme">Tourisme</option>
            <option value="Transport">Transport</option>
          </select>
        </div>
        <div class="input-ctn">
          <div class="label">Country</div>
          <select class="set-input" required v-model="companyCountry">
            <option value="" disabled selected>>Choisissez un pays</option>
            <option value="Algeria">Algeria</option>
            <option value="Angola">Angola</option>
            <option value="Argentina">Argentina</option>
            <option value="Australia">Australia</option>
            <option value="Austria">Austria</option>
            <option value="Belgium">Belgium</option>
            <option value="Benin">Benin</option>
            <option value="Botswana">Botswana</option>
            <option value="Brazil">Brazil</option>
            <option value="Burkina Faso">Burkina Faso</option>
            <option value="Burundi">Burundi</option>
            <option value="Cabo Verde">Cabo Verde</option>
            <option value="Canada">Canada</option>
            <option value="Cameroon">Cameroon</option>
            <option value="Central African Republic">Central African Republic</option>
            <option value="Chad">Chad</option>
            <option value="Chile">Chile</option>
            <option value="China">China</option>
            <option value="Colombia">Colombia</option>
            <option value="Congo">Congo</option>
            <option value="Comoros">Comoros</option>
            <option value="Congo">Congo</option>
            <option value="Côte d'Ivoire">Côte d'Ivoire</option>
            <option value="Czech Republic">Czech Republic</option>
            <option value="Democratic Republic of the Congo">Democratic Republic of the Congo</option>
            <option value="Denmark">Denmark</option>
            <option value="Equatorial Guinea">Equatorial Guinea</option>
            <option value="Egypt">Egypt</option>
            <option value="Ethiopia">Ethiopia</option>
            <option value="France">France</option>
            <option value="Gabon">Gabon</option>
            <option value="Ghana">Ghana</option>
            <option value="India">India</option>
            <option value="Indonesia">Indonesia</option>
            <option value="Iran">Iran</option>
            <option value="Iraq">Iraq</option>
            <option value="Italy">Italy</option>
            <option value="Japan">Japan</option>
            <option value="Kenya">Kenya</option>
            <option value="Mexico">Mexico</option>
            <option value="Morocco">Morocco</option>
            <option value="Nigeria">Nigeria</option>
            <option value="Pakistan">Pakistan</option>
            <option value="Peru">Peru</option>
            <option value="Philippines">Philippines</option>
            <option value="Portugal">Portugal</option>
            <option value="Qatar">Qatar</option>
            <option value="Russia">Russia</option>
            <option value="Saudi Arabia">Saudi Arabia</option>
            <option value="South Africa">South Africa</option>
            <option value="Spain">Spain</option>
            <option value="Sudan">Sudan</option>
            <option value="Sweden">Sweden</option>
            <option value="Switzerland">Switzerland</option>
            <option value="Thailand">Thailand</option>
            <option value="Turkey">Turkey</option>
            <option value="Ukraine">Ukraine</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="United States">United States</option>
            <option value="Venezuela">Venezuela</option>
            <option value="Vietnam">Vietnam</option>
            <option value="Uganda">Uganda</option>
            <option value="Tanzania">Tanzania</option>
            <option value="Rwanda">Rwanda</option>
            <option value="Zambia">Zambia</option>
            <option value="Zimbabwe">Zimbabwe</option>
          </select>
        </div>
      <div class="input-ctn">
        <div class="label">Siège social</div>
        <input type="text" v-model="companyAddress" class="set-input" required placeholder="Adresse officielle">
      </div>
      <div class="input-ctn">
        <div class="label">Numéro du régistre</div>
        <input type="text" v-model="registerdNumber" class="set-input" required placeholder="Numéro du Régistre de Commerce">
      </div>
      <div class="input-ctn">
        <div class="label">Téléphone de l'entreprise</div>
        <input type="phone" v-model="companyPhone" class="set-input" required placeholder="Numéro de téléphone officiel">
      </div>
      <div class="input-ctn">
        <div class="label">Adresse email de l'entreprise</div>
        <input type="email" v-model="companyEmail" class="set-input" required placeholder="Adresse email officielle">
      </div>
      <button @click="handleCreate" class="auth-btn" :disabled="loading">
        {{ loading ? 'Création...' : 'Créer mon espace' }}
      </button>
    </div>
  </div>
</template>
<style scoped>
/*.page.setup-ctn {
  justify-content: center;
  align-items: center;

  .auth-ctn{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 70vw;
        margin-left: 50%;
        transform: translate(-50%, 5%);
        border-radius: 30px;
        overflow: hidden;
        @media screen and (max-width: 860px){
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            padding: 0;
        }
    }
    .auth-ctn form{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 20px;
        width: 700px;
        margin-top: 20px;
        border-radius: 15px;
        border: 2px solid #9da6e0;
    }
    .auth-ctn .input-ctn .set-input{
        height: 40px;
        width: 100%;
        border-radius: 10px;
        background-color: transparent;
        color: #9da6e0;
        padding-left: 10px;
        font-family: Poppins;
        margin-left: 0;
        border: 1px solid;
    }
    .auth-ctn form .input-ctn{
        height: 43px;
        width: 450px;
        color: #9da6e0;
        margin: 15px;
        padding-right: 25px;
        font-family: Poppins;
        position: relative;
    }
    .input-ctn .label{
        position: absolute;
        top: -5px;
        left: 30px;
        font-size: 0.8rem;
        background-color: #fff;
        padding-left: 5px;
        padding-right: 5px;
        z-index: 1;
    }
    .auth-btn{
        display: flex;
        justify-content: center;
        align-items: center;
        height: 40px;
        width: 200px;
        border: none;
        border-radius: 10px;
        background-color: #2a2f4f;
        color: #eee;
        font-family: Poppins;
        font-weight: 600;
        cursor: pointer;
        margin-top: 10px;
    }
}*/

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
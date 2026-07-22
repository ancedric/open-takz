<template>
  <div>
    <div class="auth-ctn">
      <h3>{{ t('signup.sign-up') }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="input-ctn">
          <div class="label">{{t('signup.account-type')}}</div>
          <select class="set-input" v-model="accountType">
            <option value="owner">{{t('signup.manager')}}</option>
            <option value="employee">{{t('signup.employee')}}</option>
          </select>
        </div>
        <div class="input-ctn">
          <div class="label">{{t('signup.first-name')}}</div>
          <input type="firstname" class="set-input" v-model="firstname" :placeholder="t('signup.first-name')">
        </div>
        <div class="input-ctn">
          <div class="label">{{t('signup.last-name')}}</div>
          <input type="lastname" class="set-input" v-model="lastname" :placeholder="t('signup.last-name')">
        </div>
        <div class="input-ctn">
          <div class="label">{{t('signup.email')}}</div>
          <input type="email" class="set-input" v-model="userEmail" :placeholder="t('signup.email')">
        </div>
        <div class="input-ctn">
          <div class="label">{{t('signup.password')}}</div>
          <input :type="showPassword ? 'text' : 'password'"  class="set-input" v-model="userPassword" :placeholder="t('signup.password')">
        </div>
        <div @click="showPassword = !showPassword" class="hideOrShow">
            {{ showPassword ? t('signup.hide-password') : t('signup.show-password') }}
        </div>
        <div class="input-ctn">
          <div class="label">{{t('signup.phone-number')}}</div>
          <input type="phone" class="set-input" v-model="phone" placeholder="+xxx xxxxxxxxx">
        </div>
        <div class="input-ctn">
          <div class="label">{{t('signup.country')}}</div>
          <select class="set-input" v-model="country">
            <option default>{{t('signup.choose-country')}}</option>
            <option value="Algeria">{{t('signup.algeria')}}</option>
            <option value="Angola">{{t('signup.angola')}}</option>
            <option value="Argentina">{{t('signup.argentina')}}</option>
            <option value="Australia">{{t('signup.australia')}}</option>
            <option value="Austria">{{t('signup.austria')}}</option>
            <option value="Belgium">{{t('signup.belgium')}}</option>
            <option value="Benin">{{t('signup.benin')}}</option>
            <option value="Botswana">{{t('signup.botswana')}}</option>
            <option value="Brazil">{{t('signup.brazil')}}</option>
            <option value="Burkina Faso">{{t('signup.burkina-faso')}}</option>
            <option value="Burundi">{{t('signup.burundi')}}</option>
            <option value="Cabo Verde">{{t('signup.cabo-verde')}}</option>
            <option value="Canada">{{t('signup.canada')}}</option>
            <option value="Cameroon">{{t('signup.cameroon')}}</option>
            <option value="Central African Republic">{{t('signup.central-african-republic')}}</option>
            <option value="Chad">{{t('signup.chad')}}</option>
            <option value="Chile">{{t('signup.chile')}}</option>
            <option value="China">{{t('signup.china')}}</option>
            <option value="Colombia">{{t('signup.colombia')}}</option>
            <option value="Congo">{{t('signup.congo')}}</option>
            <option value="Comoros">{{t('signup.comoros')}}</option>
            <option value="Congo">{{t('signup.congo')}}</option>
            <option value="Côte d'Ivoire">{{t('signup.côte-d-ivoire')}}</option>
            <option value="Czech Republic">{{t('signup.czech-republic')}}</option>
            <option value="Democratic Republic of the Congo">{{t('signup.democratic-republic-of-the-congo')}}</option>
            <option value="Denmark">{{t('signup.denmark')}}</option>
            <option value="Equatorial Guinea">{{t('signup.equatorial-guinea')}}</option>
            <option value="Egypt">{{t('signup.egypt')}}</option>
            <option value="Ethiopia">{{t('signup.ethiopia')}}</option>
            <option value="France">{{t('signup.france')}}</option>
            <option value="Gabon">{{t('signup.gabon')}}</option>
            <option value="Ghana">{{t('signup.ghana')}}</option>
            <option value="India">{{t('signup.india')}}</option>
            <option value="Indonesia">{{t('signup.indonesia')}}</option>
            <option value="Iran">{{t('signup.iran')}}</option>
            <option value="Iraq">{{t('signup.iraq')}}</option>
            <option value="Italy">{{t('signup.italy')}}</option>
            <option value="Japan">{{t('signup.japan')}}</option>
            <option value="Kenya">{{t('signup.kenya')}}</option>
            <option value="Mexico">{{t('signup.mexico')}}</option>
            <option value="Morocco">{{t('signup.morocco')}}</option>
            <option value="Nigeria">{{t('signup.nigeria')}}</option>
            <option value="Pakistan">{{t('signup.pakistan')}}</option>
            <option value="Peru">{{t('signup.peru')}}</option>
            <option value="Philippines">{{t('signup.philippines')}}</option>
            <option value="Portugal">{{t('signup.portugal')}}</option>
            <option value="Qatar">{{t('signup.qatar')}}</option>
            <option value="Russia">{{t('signup.russia')}}</option>
            <option value="Saudi Arabia">{{t('signup.saudi-arabia')}}</option>
            <option value="South Africa">{{t('signup.south-africa')}}</option>
            <option value="Spain">{{t('signup.spain')}}</option>
            <option value="Sudan">{{t('signup.sudan')}}</option>
            <option value="Sweden">{{t('signup.sweden')}}</option>
            <option value="Switzerland">{{t('signup.switzerland')}}</option>
            <option value="Thailand">{{t('signup.thailand')}}</option>
            <option value="Turkey">{{t('signup.turkey')}}</option>
            <option value="Ukraine">{{t('signup.ukraine')}}</option>
            <option value="United Kingdom">{{t('signup.united-kingdom')}}</option>
            <option value="United States">{{t('signup.united-states')}}</option>
            <option value="Venezuela">{{t('signup.venezuela')}}</option>
            <option value="Vietnam">{{t('signup.vietnam')}}</option>
            <option value="Uganda">{{t('signup.uganda')}}</option>
            <option value="Tanzania">{{t('signup.tanzania')}}</option>
            <option value="Rwanda">{{t('signup.rwanda')}}</option>
            <option value="Zambia">{{t('signup.zambia')}}</option>
            <option value="Zimbabwe">{{t('signup.zimbabwe')}}</option>
          </select>
        </div>
        <div class="input-ctn">
          <div class="label">{{t('signup.city')}}</div>
          <input type="city" class="set-input" v-model="city" :placeholder="t('signup.city')">
        </div>
        <div class="input-ctn">
          <div class="label">{{t('signup.profile-photo')}}</div>
          <input type="file" class="set-input" v-on:change="onFileChange" :placeholder="t('signup.choose-profile-photo')">
        </div>
        <button type="submit" class="auth-btn">{{ submitting ? t('signup.please-wait') : t('signup.sign-in') }}</button>
        <p class="switch">{{t('signup.already-have-account')}}<router-link to="/auth">{{t('signup.sign-in')}}</router-link></p>
        <p class="switch">{{ t('login.accept-terms') }} <router-link to="/users-conditions">{{ t('login.terms-of-use') }}</router-link></p>
      </form>
    </div>
    
  </div>
  <Alert type="danger" action="emptyField" v-if="notFilled"/>
  <Alert type="danger" action="error" v-if="errors"/>
  <Alert type="success" action="loggedIn" v-if="success"/>
</template>
  
  <script setup>
  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import supabase from '../services/supabaseConfig';
  import { useRouter } from 'vue-router';
  import Alert from '../components/Alert.vue';
  
  const {t} = useI18n();
 // User data
 const accountType = ref('');
const firstname = ref('');
const lastname = ref('');
const userEmail = ref('');
const userPassword = ref('');
const phone = ref('');
const country = ref('');
const city = ref('');
const profilePhoto = ref(null);
const profilePhotoPreview = ref('');
// UI states
const showPassword = ref(false);
const submitting = ref(false);
const notFilled = ref(false);
const errors = ref(false);
const success = ref(false);
const router = useRouter();

const onFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Vérification du type de fichier
    if (!file.type.match('image.*')) {
      errors.value = true;
      setTimeout(() => errors.value = false, 3000);
      return;
    }

    // Vérification de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.value = true;
      setTimeout(() => errors.value = false, 3000);
      return;
    }

    profilePhoto.value = file;
    // Création de l'URL de prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => {
      profilePhotoPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};


// Dans ton Register.vue, remplace handleSubmit par ceci :

const handleSubmit = async () => {
  if (!userEmail.value || !userPassword.value || !firstname.value || !lastname.value) {
    notFilled.value = true;
    setTimeout(() => (notFilled.value = false), 3000);
    return;
  }

  submitting.value = true;
  let publicProfileUrl = null;

  try {
    // ÉTAPE 1 : Créer d'abord le compte Auth (Indispensable pour avoir les droits d'upload)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userEmail.value,
      password: userPassword.value,
      options: {
        data: { firstname: firstname.value, lastname: lastname.value }
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      // ÉTAPE 2 : Maintenant qu'on est connecté, on upload la photo
      if (profilePhoto.value) {
        const file = profilePhoto.value;
        const fileExt = file.name.split('.').pop();
        // On utilise l'ID de l'user pour un nom unique et propre
        const filePath = `profiles/${authData.user.id}.${fileExt}`; 

        const { error: uploadError } = await supabase.storage
          .from('opentasks_bucket')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Détails erreur storage:', uploadError);
          // On ne bloque pas l'inscription si seule l'image échoue
        } else {
          const { data: urlData } = supabase.storage
            .from('opentasks_bucket')
            .getPublicUrl(filePath); // Utiliser filePath ici !
          publicProfileUrl = urlData.publicUrl;
        }
      }

      // ÉTAPE 3 : Insertion dans la table 'user'
      const { data: userData, error: dbError } = await supabase
        .from('user')
        .insert([
          {
            userref: authData.user.id,
            profilephotourl: publicProfileUrl,
            email: userEmail.value,
            firstname: firstname.value,
            lastname: lastname.value,
            phone: phone.value,     
            country: country.value,
            city: city.value,      
            privilege: accountType.value === 'owner' ? 'owner' : 'employee'
          }
        ])
        .select() 
        .single();

      if (dbError) throw dbError;

      // ÉTAPE 4 : Insertion dans 'employe'
      if (userData) {
        const empRef = 'EMP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const { error: empError } = await supabase
          .from('employe')
          .insert([{
            empref: empRef,
            userref: userData.userref,
            position: accountType.value === 'owner' ? 'owner' : 'A définir',
            privilege: accountType.value === 'owner' ? 'owner' : 'employee'
          }]);
        
        if (empError) throw empError;

        success.value = true;
        setTimeout(() => {
          /*if (accountType.value === 'owner') {
            router.push(`/create-company/${userData.userref}`);
          } else {*/
            router.push(`/auth`);
          //}
        }, 2000);
      }
    }
  } catch (err) {
    console.error('Erreur inscription:', err);
    errors.value = true;
    setTimeout(() => (errors.value = false), 3000);
  } finally {
    submitting.value = false;
  }
};
  </script>

  <style scoped>
    /*.auth-ctn{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 70vw;
        margin-left: 50%;
        transform: translate(-50%, 5%);
        overflow: hidden;
        @media screen and (max-width: 860px){
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
        }
    }
    .auth-ctn form{
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 20px;
      width: 700px;
      margin-top: 10px;
      padding: 15px;
      border-radius: 15px;
      border: 2px solid #9da6e0;
    }
    .auth-ctn form .input-ctn .set-input{ 
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
        margin: 0;
        padding-top: 10px;
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
    .hideOrShow{
      width: 450px;
      padding-top: 0;
      font-family: Poppins;
      font-size: 0.6rem;
      text-align: right;
      color: #9da6e0;
      cursor: pointer;
    }
    .switch{
      font-size: 0.8rem;
    }*/

    /* Conteneur principal - On centre tout proprement */
    .auth-ctn {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 800px;
        margin: 20px auto;
        padding: 10px;
        box-sizing: border-box;
    }

    /* Le Formulaire - On enlève les 700px fixes */
    .auth-ctn form {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 25px; /* Plus d'espace pour ne pas cliquer sur deux inputs en même temps */
        width: 100%;
        max-width: 500px;
        margin-top: 10px;
        padding: 30px 20px;
        border-radius: 15px;
        border: 2px solid #9da6e0;
        box-sizing: border-box;
    }

    /* Conteneur de l'input - On enlève les 450px fixes */
    .auth-ctn form .input-ctn {
        height: auto;
        width: 100%;
        color: #9da6e0;
        margin: 0;
        position: relative;
    }

    /* Champs de saisie et Selects */
    .auth-ctn form .input-ctn .set-input { 
        height: 50px; /* Confort tactile (Apple/Google standards) */
        width: 100%;
        border-radius: 10px;
        background-color: #fff;
        color: #2a2f4f;
        padding: 0 15px;
        font-family: 'Poppins', sans-serif;
        border: 1px solid #9da6e0;
        box-sizing: border-box;
        font-size: 1rem; /* Évite le zoom automatique sur iOS au focus */
    }

    /* Ajustement spécifique pour l'input file (photo) */
    input[type="file"].set-input {
        padding-top: 12px;
        font-size: 0.8rem;
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
    }

    /* Bouton d'inscription */
    .auth-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 50px;
        width: 100%;
        max-width: 250px;
        border: none;
        border-radius: 10px;
        background-color: #2a2f4f;
        color: #eee;
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        cursor: pointer;
        margin-top: 15px;
        transition: transform 0.2s;
    }

    .auth-btn:active {
        transform: scale(0.98);
    }

    /* "Hide/Show password" */
    .hideOrShow {
      width: 100%;
      font-family: 'Poppins', sans-serif;
      font-size: 0.7rem;
      text-align: right;
      color: #9da6e0;
      cursor: pointer;
      margin-top: -15px;
    }

    .switch {
      font-size: 0.85rem;
      text-align: center;
      color: #666;
      margin: 5px 0;
    }

    /* Media Queries pour mobile */
    @media screen and (max-width: 860px) {
        .auth-ctn {
            margin-left: 0;
            transform: none;
            width: 100%;
        }

        .auth-ctn form {
            width: 95%;
            padding: 25px 15px;
            border: 1px solid #9da6e0; /* Bordure plus fine sur mobile */
        }

        h3 {
            margin-top: 20px;
        }
    }
  </style>
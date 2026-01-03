<template>
  <div class="page">
    <div class="auth-ctn">
      <h3>SIGN UP</h3>
      <form @submit.prevent="handleSubmit">
        <div class="input-ctn">
          <div class="label">Type de compte</div>
          <select class="set-input" v-model="accountType">
            <option value="owner">Chef d'entreprise (Owner)</option>
            <option value="employee">Employé</option>
          </select>
        </div>
        <div class="input-ctn">
          <div class="label">First Name</div>
          <input type="firstname" class="set-input" v-model="firstname" placeholder="First Name">
        </div>
        <div class="input-ctn">
          <div class="label">Last Name</div>
          <input type="lastname" class="set-input" v-model="lastname" placeholder="Last Name">
        </div>
        <div class="input-ctn">
          <div class="label">Email address</div>
          <input type="email" class="set-input" v-model="userEmail" placeholder="Email">
        </div>
        <div class="input-ctn">
          <div class="label">Password</div>
          <input :type="showPassword ? 'text' : 'password'"  class="set-input" v-model="userPassword" placeholder="password">
        </div>
        <div @click="showPassword = !showPassword" class="hideOrShow">
            {{ showPassword ? 'Hide password' : 'Show password' }}
        </div>
        <div class="input-ctn">
          <div class="label">Country</div>
          <select class="set-input" v-model="country">
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
          <div class="label">City</div>
          <input type="city" class="set-input" v-model="city" placeholder="City">
        </div>
        <div class="input-ctn">
          <div class="label">Profile Photo</div>
          <input type="file" class="set-input" v-on:change="onFileChange" placeholder="choose a profile photo">
        </div>
        <button type="submit" class="auth-btn">{{ submitting ? 'Please wait...' : 'Sign In' }}</button>
      </form>
      <p class="switch">Already have an account ? <router-link to="/auth">Sign In</router-link></p>
    </div>
  </div>
  <Alert type="danger" action="emptyField" v-if="notFilled"/>
  <Alert type="danger" action="error" v-if="errors"/>
  <Alert type="success" action="loggedIn" v-if="success"/>
</template>
  
  <script setup>
  import { ref } from 'vue';
  import supabase from '../services/supabaseConfig';
  import { useRouter } from 'vue-router';
  import Alert from '../components/Alert.vue';
  
 // User data
 const accountType = ref('');
const firstname = ref('');
const lastname = ref('');
const userEmail = ref('');
const userPassword = ref('');
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


const handleSubmit = async () => {
  submitting.value = true;
  
  // Validation des champs requis
  if (!userEmail.value || !userPassword.value || !firstname.value || !lastname.value) {
    notFilled.value = true;
    setTimeout(() => notFilled.value = false, 3000);
    submitting.value = false;
    return;
  }

  try {
    // 1. Inscription dans Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: userEmail.value,
      password: userPassword.value,
      options: {
        data: {
          firstname: firstname.value,
          lastname: lastname.value,
          accountType: accountType.value // Stocké dans les metadata
        }
      }
    });

    if (authError) throw authError;

    let profileUrl = null;
    if (profilePhoto.value) {
        const fileExt = profilePhoto.value.name.split('.').pop();
        const fileName = `${data.user.id}.${fileExt}`; 
        const filePath = `profiles/${fileName}`;
        
        await supabase.storage
            .from(import.meta.env.VITE_VUE_JS_SUPABASE_BUCKET  || 'opentasks_bucket')
            .upload(filePath, profilePhoto.value);
            
        const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(fileName);
        profileUrl = urlData.publicUrl;
    }

    const { data:dbData, error: dbError } = await supabase
        .from('user')
        .insert([{
            userref: data.user.id,
            firstname: firstname.value,
            lastname: lastname.value,
            email: userEmail.value,
            password: 'AUTH_MANAGED',
            profilephotourl: profileUrl, // On enregistre l'URL publique ici
            privilege: accountType.value === 'owner' ? 'owner' : 'user'
        }])
        .select();

    if (dbError) throw dbError;

    success.value = true;
    
    // 3. Redirection selon le type de compte
    setTimeout(() => {
      if (accountType.value === 'owner') {
        router.push(`/create-company/${dbData[0].userref}`);
      } else {
        router.push('/join-company/'+ dbData[0].userref);
      }
    }, 1500);

  } catch (error) {
    console.error('Erreur:', error.message);
    errors.value = true;
    setTimeout(() => errors.value = false, 3000);
  } finally {
    submitting.value = false;
  }
};
  </script>

  <style scoped>
    .auth-ctn{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 70vw;
        height: 80vh;
        margin-left: 50%;
        transform: translate(-50%, 5%);
        background-color: #eee;
        border-radius: 30px;
        box-shadow: 1px 1px 200px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        @media screen and (max-width: 860px){
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            width: 95vw;
            height: 95vh;
            padding: 0;
        }
    }
    .auth-ctn form{
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 80%;
      width: 300px;
      margin-top: 20px;
      border-radius: 15px;
      border: 2px solid #9da6e0;
    }
    .auth-ctn form .input-ctn .set-input{
        height: 33px;
        width: 100%;
        border-radius: 10px;
        background-color: #eee;
        color: #9da6e0;
        padding-left: 10px;
        font-family: Poppins;
        margin-left: 0;
        border: 1px solid;
    }
    .auth-ctn form .input-ctn{
        height: 43px;
        width: 200px;
        color: #9da6e0;
        margin: 0;
        padding-right: 25px;
        font-family: Poppins;
        position: relative;
    }
    .input-ctn .label{
        position: absolute;
        top: -5px;
        left: 30px;
        font-size: 0.8rem;
        background-color: #eee;
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
      width: 200px;
      padding-top: 0;
      font-family: Poppins;
      font-size: 0.6rem;
      text-align: right;
      color: #9da6e0;
      cursor: pointer;
    }
    .switch{
      font-size: 0.8rem;
    }
  </style>
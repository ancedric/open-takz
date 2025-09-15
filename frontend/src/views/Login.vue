<template>
  <div class="page">
    <div class="auth-ctn">
      <h2>Sign In</h2>
      <form @submit.prevent="handleSubmit">
        <div class="input-ctn">
          <div class="label">Email address</div>
          <input type="email" class="set-input" v-model="userEmail" placeholder="Email">
        </div>
        <div class="input-ctn">
          <div class="label">Password</div>
          <input 
            :type="showPassword ? 'text' : 'password'" 
            class="set-input" 
            v-model="userPassword" 
            placeholder="Password"
          >
        </div>
        <div @click="showPassword = !showPassword" class="hideOrShow">
            {{ showPassword ? 'Hide password' : 'Show password' }}
        </div>
        <button type="submit" class="auth-btn">{{ submitting ? 'Please wait...' : 'Sign In' }}</button>
      </form>
      <p class="switch">Don't have an account ? <router-link to="/register">Sign Up</router-link></p>
    </div>
  </div>
  <Alert type="danger" action="emptyField" v-if="notFilled"/>
  <Alert type="danger" action="error" v-if="errors"/>
  <Alert type="success" action="loggedIn" v-if="success"/>
</template>
  
  <script setup>
  import { ref } from 'vue';
  import axios from 'axios'
  import { useRouter } from 'vue-router';
  import { useUserStore } from '../store/index'
  import { useProfileStore } from '../store/profile'
  import Alert from '../components/Alert.vue';
  
    const userEmail = ref('');
    const userPassword = ref('');
    const router = useRouter();

    const user = useUserStore()
    const profile = useProfileStore()
    const errors = ref( false )
    const success= ref(false)
    const notFilled = ref(false)
    const submitting = ref(false)
    const showPassword = ref(false)
    const errorMessage = ref('')
  
    const handleSubmit = async () => {
    submitting.value = true;
    
    try {
        // 1. Validation des champs
        if (!userEmail.value || !userPassword.value) {
            notFilled.value = true;
            setTimeout(() => notFilled.value = false, 3000);
            submitting.value = false;
            return;
        }

        // 2. Envoi de la requête de connexion
        // La suppression de { withCredentials: true } est cruciale pour une approche JWT
        const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/user/login`,
            {
                email: userEmail.value,
                password: userPassword.value
            }
        );

        // 3. Extraction et vérification du token et des données utilisateur
        const { token, user: userData } = response.data;
        
        if (token && userData) {
            // Le serveur a bien renvoyé un token et des données
            // Appeler la fonction d'authentification du store pour stocker le token
            user.authenticate(userData, token);
            
            success.value = true;
            errors.value = false;
            
            // 4. Redirection après une connexion réussie
            router.push('/project/' + userData.userref);

        } else {
            // Le serveur n'a pas renvoyé les données attendues
            errors.value = true;
            errorMessage.value = 'Données de connexion invalides';
        }
    } catch (error) {
        // 5. Gestion des erreurs de la requête
        if (error.response) {
            // Erreur du serveur (401, 400, etc.)
            console.error('Erreur de connexion:', error.response.data.message);
            errors.value = true;
            errorMessage.value = error.response.data.message || 'Email ou mot de passe incorrect';
        } else if (error.request) {
            // La requête a été faite mais aucune réponse n'a été reçue
            console.error('Pas de réponse du serveur:', error.request);
            errors.value = true;
            errorMessage.value = 'Pas de réponse du serveur';
        } else {
            // Erreur lors de la configuration de la requête
            console.error('Erreur de configuration:', error.message);
            errors.value = true;
            errorMessage.value = 'Erreur de configuration';
        }

        setTimeout(() => {
            errors.value = false;
            errorMessage.value = '';
        }, 5000);
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
        padding: 0;
        background-color: #eee;
        border-radius: 30px;
        box-shadow: 1px 1px 50px rgba(0, 0, 0, 0.3);
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
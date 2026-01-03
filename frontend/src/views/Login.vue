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
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/index';
import supabase from '../services/supabaseConfig'; // Utilisation du client Supabase
import Alert from '../components/Alert.vue';

const userEmail = ref('');
const userPassword = ref('');
const router = useRouter();
const userStore = useUserStore();

const errors = ref(false);
const success = ref(false);
const notFilled = ref(false);
const submitting = ref(false);
const showPassword = ref(false);
const errorMessage = ref('');

const handleSubmit = async () => {
    submitting.value = true;
    
    // 1. Validation des champs
    if (!userEmail.value || !userPassword.value) {
        notFilled.value = true;
        setTimeout(() => notFilled.value = false, 3000);
        submitting.value = false;
        return;
    }

    try {
        // 2. Authentification avec Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: userEmail.value,
            password: userPassword.value,
        });

        if (authError) throw authError;

        // 3. Récupération des données utilisateur étendues (privilège, company, etc.) depuis votre table "user"
        const { data: userData, error: dbError } = await supabase
            .from('user')
            .select('*')
            .eq('userref', authData.user.id)
            .single();

        if (dbError) throw dbError;

        if (userData) {
            // 4. Stockage dans le store Pinia (on utilise le token de session Supabase)
            const session = authData.session;
            userStore.authenticate(userData, session.access_token);
            
            success.value = true;
            errors.value = false;
            
            // 5. Redirection vers le dashboard ou les projets
            setTimeout(() => {
                router.push('/home'); // Ou router.push('/project/' + userData.userref)
            }, 1500);
        }
    } catch (error) {
        console.error('Erreur de connexion:', error.message);
        errors.value = true;
        errorMessage.value = error.message;

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
        margin-left: 50%;
        transform: translate(-50%, 5%);
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
<template>
  <div class="page">
    <div class="auth-ctn">
      <h2>{{ t('login.sign-in') }}</h2>
      <form @submit.prevent="handleSubmit">
        <div class="input-ctn">
          <div class="label">{{ t('login.email') }}</div>
          <input type="email" class="set-input" v-model="userEmail" :placeholder="t('login.email')">
        </div>
        <div class="input-ctn">
          <div class="label">{{ t('login.password') }}</div>
          <input 
            :type="showPassword ? 'text' : 'password'" 
            class="set-input" 
            v-model="userPassword" 
            :placeholder="t('login.password')"
          >
        </div>
        <div @click="showPassword = !showPassword" class="hideOrShow">
            {{ showPassword ? t('login.hide-password') : t('login.show-password') }}
        </div>
        <button type="submit" class="auth-btn">{{ submitting ? t('login.please-wait') : t('login.sign-in') }}</button>
        <p class="switch">{{ t('login.dont-have-account') }} <router-link to="/register">{{ t('login.sign-up') }}</router-link></p>
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
import { useRouter } from 'vue-router';
import { useUserStore } from '../../store/index';
import supabase from '../../services/supabaseConfig'; // Utilisation du client Supabase
import Alert from '../../components/Alert.vue';
import api from '../../data/api'
import axios from 'axios'

const {t} = useI18n();
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
        const res = await axios.post(`${api}/user/login`, [userEmail, userPassword])

        if (res.error) {
            alert(res.message)
            throw res.error;
        }
        console.log(res.message, res.token, res.user)
        const user = res.user
        const userRef = res.user.userref

        if (res.user.length > 0) {
          //Onrécupère l'employé associé à l'utilisateur
          const empRes = await axios.get(`${api}/employe/get-employe/${userRef}`)
            if (empRes.error) {
                Alert(empRes.message)
                throw empRes.error;
            }
            console.log(empRes.message,  empRes.data)
            const employe = empRes.data
            if(employe){
                const compData = await axios.get(`${api}/company/get-company/${employe.companyref}`)
                if(compData.error) console.error(compData.error, compData.message)
                console.log(compData.message)
                const company = compData.data
                // 4. Stockage dans le store Pinia (on utilise le token de session Supabase)
                const session = authData.session;
                userStore.authenticate(user, employe, company);
                
                success.value = true;
                errors.value = false;
                
                // 5. Redirection vers le dashboard ou les projets
                setTimeout(() => {
                    router.push('/home');
                }, 1500);
            }
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
    /* Commented out old styles
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
            width: 95vw;
            padding: 0;
        }
    }
    .auth-ctn form{
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 20px;
      height: 60vh;
      width: 700px;
      margin-top: 20px;
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
    /* Conteneur principal */
    .auth-ctn {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%; /* Utilise toute la largeur sur mobile */
        max-width: 800px; /* Limite sur desktop */
        margin: 0 auto;
        padding: 20px;
        box-sizing: border-box;
    }

    /* Le Formulaire */
    .auth-ctn form {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 25px; /* Plus d'espace pour le tactile */
        min-height: 400px;
        width: 100%; /* S'adapte au parent */
        max-width: 500px; /* Largeur confortable pour la lecture */
        margin-top: 20px;
        padding: 30px 20px;
        border-radius: 15px;
        border: 2px solid #9da6e0;
        box-sizing: border-box;
    }

    /* Conteneur de l'input */
    .auth-ctn form .input-ctn {
        height: auto;
        width: 100%; /* Prend toute la largeur du formulaire */
        color: #9da6e0;
        margin: 0;
        position: relative;
    }

    /* L'input réel */
    .auth-ctn form .input-ctn .set-input {
        height: 50px; /* Plus haut pour faciliter le clic au doigt */
        width: 100%;
        border-radius: 10px;
        background-color: transparent;
        color: #2a2f4f; /* Couleur plus lisible que le bleu clair sur fond blanc */
        padding: 0 15px;
        font-family: 'Poppins', sans-serif;
        border: 1px solid #9da6e0;
        box-sizing: border-box; /* Crucial pour que le padding n'élargisse pas l'input */
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
    }

    /* Bouton d'action */
    .auth-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 50px;
        width: 100%; /* Largeur totale sur mobile pour plus d'aisance */
        max-width: 250px;
        border: none;
        border-radius: 10px;
        background-color: #2a2f4f;
        color: #eee;
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        cursor: pointer;
        margin-top: 10px;
        transition: opacity 0.3s;
    }

    .auth-btn:active {
        opacity: 0.8;
    }

    /* Option Afficher/Masquer MDP */
    .hideOrShow {
        width: 100%;
        font-family: 'Poppins', sans-serif;
        font-size: 0.7rem;
        text-align: right;
        color: #9da6e0;
        cursor: pointer;
        margin-top: -15px; /* Rapproche du champ password */
    }

    .switch {
        font-size: 0.8rem;
        text-align: center;
        padding: 0 10px;
        color: #666;
    }

    /* Media Queries pour ajustements fins */
    @media screen and (max-width: 768px) {
        .auth-ctn {
            transform: none; /* On retire le translate qui peut décentrer sur petit écran */
            margin-top: 5vh;
        }

        .auth-ctn form {
            border: none; /* Souvent plus propre sur mobile de ne pas avoir de bordure */
            box-shadow: none;
            padding: 10px;
        }

        h2 {
            margin-bottom: 10px;
        }
    }
  </style>
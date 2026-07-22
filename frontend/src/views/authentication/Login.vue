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
  <Alert type="danger" action="emptyField" :message="message" v-if="notFilled"/>
  <Alert type="danger" action="error" :message="message" v-if="errors"/>
  <Alert type="success" action="loggedIn" :message="message" v-if="success"/>
</template>
  
<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../store/index';
import { api } from '../../services/api.js';
import Alert from '../../components/Alert.vue';

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
const message = ref('');

const handleSubmit = async () => {
    submitting.value = true;
    
    // 1. Validation des champs
    if (!userEmail.value || !userPassword.value) {
        notFilled.value = true;
        message.value = "Veuillez remplir tous les champs."
        setTimeout(() => notFilled.value = false, 5000);
        submitting.value = false;
        return;
    }

    try {
        const userResponse = await api.post('/user/login', {email: userEmail.value, password: userPassword.value});      
        if (userResponse.data.success === true) {
            const user = userResponse.data.user;
            const token = userResponse.data.token;
            const employe = {
                userref:user.userref,
                privilege:user.privilege,
                empref: user.empref,
                companyref: user.companyref,
                position: user.position,
                salary: user.salary,
                paymentday: user.paymentday,
                is_dirigeant: user.is_dirigeant,
                deptref: user.deptref,
                hired_at: user.hired_at

            }
            
            if(user.companyref){
                const companyResponse = await api.get(`/company/${user.companyref}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if(companyResponse.data.success === true){
                    const company = companyResponse.data.company

                    await userStore.authenticate(token, user, employe, company);

                    success.value = true;
                    errors.value = false;
                    message.value = `Bienvenue ${userResponse.data.user.firstname}`;
                    
                    // 5. Redirection vers le dashboard ou les projets
                    setTimeout(() => {
                        router.push('/home');
                    }, 5000);
                }
            } else{
                userStore.authenticate(token, user, employe, null);

                success.value = true;
                errors.value = false;
                message.value = `Bienvenue ${userResponse.data.user.firstname}`;
                        
                // 5. Redirection vers le dashboard ou les projets
                setTimeout(() => {
                    router.push('/home');
                }, 5000);}
        } else {
            success.value = false;
            errors.value = true;
            message.value = userResponse.data.message;
        }
    } catch (error) {
        console.error('Erreur de connexion:', error.message);
        errors.value = true;
        message.value = error.message;

        setTimeout(() => {
            errors.value = false;
        }, 5000);
    } finally {
        submitting.value = false;
    }
};
</script>

  <style scoped>
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
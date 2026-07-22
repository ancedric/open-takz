<template>
    <div class="header-ctn">
        <div class="title">
            <img :src="userStore.user.company?.logo || DefaultCompanyLogo" alt="Company Logo" class="company-logo">
            <h3 @click="home">{{userStore.user.company?.companyname}}</h3>
        </div>
        <div v-if="subscriptionStatus" class="subscription-badge" :class="subscriptionStatus.class">
            <svg v-if="subscriptionStatus.class === 'urgent'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            {{ subscriptionStatus.label }}
        </div>
        <router-link class="super-admin-link" to="/super-admin" v-if="userStore.user.user.privilege === 'admin'">SuperAdmin</router-link>
        <div class="notifs">
            <div v-if="subscriptionStatus?.class === 'urgent'" class="alert-bell" @click="showExpiryModal = true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="bell-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <span class="notification-dot"></span>
            </div>
            <div class="launcher-wrapper">
                <button class="launcher-btn" @click="isModuleLauncherOpen = !isModuleLauncherOpen" title="Modules">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                </button>
                
                <ModuleLauncher 
                    v-if="isModuleLauncherOpen" 
                    @close="isModuleLauncherOpen = false" 
                />
            </div>           
            <div v-if="!userStore.isLoading && userStore.user?.user" class="profile">
                <div class="prof-img" @click="isAccountOpen = !isAccountOpen">
                    <img :src="userStore.user.user.profilephotourl || DefaultAvatar" :alt="userStore.user.user.firstname">
                </div>
                <div class="username">
                    <p>{{ userStore.user.user.firstname }} {{ userStore.user.user.lastname }}</p>
                </div>
                
                <div class="account" v-show="isAccountOpen">
                    <ul>
                        <li class="user">{{ userStore.user.user.firstname }} {{ userStore.user.user.lastname }}</li>
                        <li><router-link to="/home/profile" class="link">My Account</router-link></li>
                        <li><router-link to="/users-conditions" class="link">GCU</router-link></li>
                        <li><router-link to="/legalNotice" class="link">Legal notice</router-link></li>
                        <li><router-link to="/support" class="link">Support</router-link></li>
                        <li @click="handleLogout">Log Out</li>
                    </ul>
                </div>
            </div>
            <div v-else class="profile">
                <Spinner/>
            </div>
        </div>
    </div>
</template>

<script setup>
import Spinner from './Spinner.vue'
import ModuleLauncher from './ModuleLauncher.vue'
import DefaultCompanyLogo from '../assets/images/company.png'
import DefaultAvatar from '../assets/images/Default-avatar.png'
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { useUserStore } from '../store/index'

const userStore = useUserStore()
const router = useRouter()
const isAccountOpen = ref(false)
const isModuleLauncherOpen = ref(false)
const showExpiryModal = ref(false);

// Optionnel : Une fonction pour rediriger vers le paiement
const goToBilling = () => {
    showExpiryModal.value = false;
    router.push('/home/billing'); // Ou ton lien de support
};

const home = () => {
    // Redirection vers le dashboard utilisateur
    router.push(`/home`)
}

const subscriptionStatus = computed(() => {
  const expiryDateStr = userStore.user.company?.expiry_date;
  if (!expiryDateStr) return null;

  const today = new Date();
  const expiry = new Date(expiryDateStr);
  
  // Calcul de la différence en jours
  const diffInMs = expiry - today;
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays <= 0) return { label: 'Expiré', class: 'expired', days: 0 };
  if (diffInDays <= 7) return { label: `Expire dans ${diffInDays}j`, class: 'urgent', days: diffInDays };
  
  return { label: 'Abonnement Actif', class: 'active', days: diffInDays };
});

const handleLogout = () => {
    try {
        // Utilise la nouvelle méthode de déconnexion de useUserStore (qui appelle supabase.auth.signOut)
        userStore.logout()
        router.push('/auth')
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error.message)
    }
}
</script>
<style scoped>

    .header-ctn{
        display: flex;
        justify-content: space-between;
        gap: 100px;
        width: 100%;
        height: 50px;
        background-color: #fff;
        padding: 10px;
        box-shadow: 0 0 10px rgba(165, 165, 165, 0.3);

        .title{
            width: 45%;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            padding-left: 30px;

            @media (max-width: 768px) {
                width: 60%;
                font-size: 0.5rem;
                padding-left: 0;
            }

            .company-logo{
                width: 30px;
                height: 30px;
                margin-right: 10px;
                object-fit: cover;
            }

            h3{
                color: #004581;
                cursor: pointer;
            }
        }
        .notifs{
            position: relative;
            display: flex;
            justify-content: space-around;
            align-items: center;
            width: 40%;
            .username{
                width: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 0.8rem;
                font-weight: 400;
                color: #004581;

                @media (max-width: 768px) {
                    display: none;
                }
            }
            .account{
                position: absolute;
                left: 30%;
                bottom: -400%;
                z-index: 10;
                background-color: #FFF;
                width: 200px;
                border: 1px solid #30495f88;
                border-radius: 10px;
                box-shadow: 0 0 100px rgba(0, 0, 0, 0.3);
                color: #948a8adc;
                transition: all .3s ease-in-out;

                @media (max-width: 768px) {
                    left: -125%;
                    top: 50px;
                    width: 300px;
                    text-align: right;
                    padding-right: 10px;
                }
                ul{
                    margin: O;
                    padding: 0;

                    .user{
                        display: none;
                        @media (max-width: 768px) {
                            display: block;
                            font-weight: bold;
                        }
                    }
                    li{
                        border-bottom: 1px solid #30495f88; 
                        &:hover{
                            background-color: #30495f88;
                            color: #004581;
                        }
                    }
                    li, .link{
                        text-decoration: none;
                        padding: 5px;
                        list-style: none;
                        color: #948a8adc;
                        cursor: pointer;
                        &:hover{
                            color: #004581;
                        }
                    }
                }
            }
        }
        .profile{
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            width: 80%;

            .username{
                font-size: 0.65rem;
            }
            .prof-img{
                width: 30px;
                height: 30px;
                border-radius: 50px;
                background-color: #30495f;
                object-fit: cover;
                overflow: hidden;

                img{
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            }
        }
    }

.subscription-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.52rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    width: 10rem;
}

/* État : Tout va bien (Vert discret) */
.subscription-badge.active {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

/* État : Attention (Orange/Rouge clignotant ou fixe) */
.subscription-badge.urgent {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.2);
  animation: pulse 2s infinite;
}

/* État : Bloqué */
.subscription-badge.expired {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.super-admin-link {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
  margin-right: 20px;
  cursor: pointer;
}
.launcher-btn {
    background: none;
    border: none;
    color: #004581;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s;
}

.launcher-btn:hover {
    background-color: rgba(0, 69, 129, 0.05);
}

.launcher-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.alert-bell {
    position: relative;
    cursor: pointer;
    color: #f59e0b; /* Orange alerte */
    padding: 8px;
    display: flex;
    align-items: center;
    animation: ring 4s ease-in-out infinite;
}

.notification-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 8px;
    height: 8px;
    background-color: #ef4444;
    border-radius: 50%;
    border: 2px solid white;
}

@keyframes ring {
    0% { transform: rotate(0); }
    1% { transform: rotate(30deg); }
    3% { transform: rotate(-28deg); }
    5% { transform: rotate(34deg); }
    7% { transform: rotate(-32deg); }
    9% { transform: rotate(30deg); }
    11% { transform: rotate(-28deg); }
    13% { transform: rotate(0); }
    100% { transform: rotate(0); }
}

.bell-icon:hover {
    color: #d97706;
}
/* --- ADAPTATION MOBILE DU HEADER --- */
@media (max-width: 768px) {
    .header-ctn {
        gap: 10px; /* On réduit l'espace énorme du desktop */
        height: auto;
        min-height: 60px;
        padding: 5px 10px;
        align-items: center;
    }

    .header-ctn .title {
        width: auto; /* On laisse le logo prendre sa place naturelle */
        padding-left: 0;
    }

    /* On cache le nom de l'entreprise si l'écran est vraiment petit ou on réduit sa taille */
    .header-ctn .title h3 {
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100px;
    }

    /* Le badge d'abonnement doit être plus compact */
    .subscription-badge {
        width: auto; /* On annule le 10rem */
        padding: 4px 8px;
        font-size: 0.45rem;
        order: 2; /* On peut le réorganiser si besoin */
    }

    /* Zone des notifications et profil */
    .header-ctn .notifs {
        width: auto;
        flex: 1;
        justify-content: flex-end;
        gap: 12px;
    }

    /* On s'assure que le profil ne prend pas trop de place */
    .header-ctn .profile {
        width: auto;
        gap: 0;
    }

    /* Le menu de compte (dropdown) */
    .header-ctn .notifs .account {
        position: fixed; /* On passe en fixed pour éviter les problèmes de overflow */
        left: auto;
        right: 10px;
        top: 60px;
        width: 220px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }

    /* Lien SuperAdmin discret */
    .super-admin-link {
        font-size: 0.7rem;
        margin-right: 5px;
    }

    /* Ajustement des icônes SVG pour le tactile */
    .launcher-btn svg, .alert-bell svg {
        width: 22px;
        height: 22px;
    }
}

/* Optionnel : cacher le badge sur les très petits écrans (< 400px) pour éviter le chevauchement */
@media (max-width: 400px) {
    .subscription-badge {
        display: none;
    }
}
</style>
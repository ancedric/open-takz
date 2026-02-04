<template>
    <div class="header-ctn">
        <div class="title">
            <h1 @click="home">{{userStore.user.company?.companyname}}</h1>
        </div>
        <div v-if="subscriptionStatus" class="subscription-badge" :class="subscriptionStatus.class">
            <svg v-if="subscriptionStatus.class === 'urgent'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            {{ subscriptionStatus.label }}
        </div>
        <router-link class="super-admin-link" to="/super-admin" v-if="userStore.user.user.privilege === 'admin'">SuperAdmin</router-link>
        <div class="notifs">
            <Notifications />
            
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
import Notifications from './Notifications.vue'
import DefaultAvatar from '../assets/images/Default-avatar.png'
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { useUserStore } from '../store/index'

const userStore = useUserStore()
const router = useRouter()
const isAccountOpen = ref(false)

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

            h1{
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
  font-size: 12px;
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
</style>
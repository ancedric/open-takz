<template>
    <Header />
    <section class="profile-pg">
        <div class="user-ctn">
            <div class="user">
                <p class="link" @click="backHome">Home</p>            
                <div v-if="userStore.user === undefined">
                    No user connected...
                </div>
                <div v-else class="sum-ctn">
                    <div class="user-sumary">
                        <div class="user-photo">
                            <img :src="data.profileImage" :alt="data.firstName">
                        </div>
                        <h3 class="user-name">{{data.firstName}} {{data.lastName}}</h3>
                        <div class="info">
                            <p class="email">{{data.email}}</p>
                            <p class="plan"> {{data.plan}}</p>
                        </div>
                        <router-link to="/editProfile" class="plan">Edit profile</router-link>
                        
                    </div>
                    <div class="useful-links">
                        <router-link to="/usersConditions" class="link">Users conditions</router-link>
                        <router-link to="/privacyPolicy" class="link">Privacy Policy</router-link>
                        <router-link to="/legalNotice" class="link">Legal Notice</router-link>
                        <router-link to="/support" class="link">Support</router-link>
                        <p class="link" @click="logOut">Log Out</p>
                    </div>
                </div>
            </div>
            <div class="user-details">
                <div v-if="userStore.user === undefined"> Details appear here... </div>
                <div v-else class="details-view"> 
                    <p class="detail">First Name : {{data.firstName}}</p>
                    <p class="detail"> Last Name : {{data.lastName}}</p>
                    <p class="detail"> Email : {{data.email}}</p>
                    <p class="detail"> City : {{data.city}}</p>
                    <p class="detail"> Country : {{data.country}}</p>
                    <p class="detail"> Member since : {{data.createdAt}}</p>
                </div>
            </div>
        </div>
    </section>
    
</template>

<script setup>
    import Header from '../components/Header.vue'
    import {ref, toRaw} from 'vue'
    import {useRouter} from "vue-router" 
    import { useUserStore } from '../store/index'

    const router = useRouter()
    const userStore = useUserStore()
    
    console.log('user dans profile: ', toRaw(userStore.user))
    // Données calculées pour le profil
const profileData = () => {
    if (!userStore.user) return null

    return {
        firstName: toRaw(userStore.user.firstname),
        lastName: toRaw(userStore.user.lastname),
        profileImage: `../assets${toRaw(userStore.user.profilePhotoUrl)}` || '../assets/images/Default-avatar.png',
        email: toRaw(userStore.user.email),
        country: toRaw(userStore.user.country),
        city: toRaw(userStore.user.city),
        createdAt: toRaw(userStore.user.createdAt),
        plan: toRaw(userStore.user.privilege) || 'user' // Exemple de champ supplémentaire
    }
}
const data = profileData()
    if(toRaw(userStore.user.email)=== null || toRaw(userStore.user.email) === undefined){
        router.push('/auth')
    }

    const logOut = async () => {
        const { data, error } = await supabase.signOut

        if(error){
            console.error('Erreur lors de la déconnexion :', error)
        }
        if(data){
            userStore.logout()
        }
    }
</script>

<style scoped>
.profile-pg{
    width: 100%;
    
}
    .link{
        padding-left: 50px;
        font-family: Inter;
        font-size: 0.8rem;
        font-weight: 400;
        text-decoration: none;
        color: #004581;
        cursor: pointer;
    }
    .user-ctn{
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: start;
        width: 90vw;
        background-color: #eee;
        border-radius: 50px;
        box-shadow: 1px 1px 50px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        @media screen and (max-width: 860px){
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: start;
            width: 95vw;
            height: 95vh;
            padding: 0;
        }
    }
    .user{
       width: 35%;
       height: 100%;
       display: flex;
       flex-direction: column;
       justify-content: flex-start;
       align-items: center;
       @media screen and (max-width: 860px){
            width: 100%;
            height: 50%;
        }
    }
    .user .sum-ctn{
        height: 95%;
        @media screen and (max-width : 860px){
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
        }
    }
    .user-sumary{
        text-align: center;
        color: #505181;
        width: 100%;
        height: 70%;
        padding: 0 10px;
        @media screen and (max-width: 860px){
            height: 100%;
            gap:20px;
        }
    }
    .info{
        display: flex;
        flex-direction: column;
        gap: 2px;
        height: 10%;
    }
    .user-sumary .user-name{
        height: 7px;
        @media screen and (max-width : 860px){
            font-size: 1rem;
        }
    }
    .user-sumary .email{
        height: 5px;
        margin: 0 0;
        padding-top: 0;
        font-style: italic;
        font-size: 0.8rem;
    }
    .plan{
        font-size: 0.8rem;
    }
    .user-sumary .user-photo{
        width: 180px;
        height: 180px;
        border: 6px solid #fff;
        border-radius: 50%;
        overflow: hidden;
       @media screen and (max-width:860px){
            width: 120px;
            height: 120px;
        }
    }
    .user-sumary .user-photo img{
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .user-ctn .user .sum-ctn .useful-links{
        display: flex;
        flex-direction: column;
        text-align: left;
        gap: 5px;
        @media screen and (max-width:860px){
            width: 50%;
            justify-content: center;
            align-items: center;
            gap: 15px;
            text-align: right;
        }
    }
    .user-ctn .user .sum-ctn .useful-links .link{
        @media screen and (max-width:860px){
            text-align: right;
            font-family: Inter;
            font-weight: 100;
            font-size: 0.7rem;
            color: #505181;
            width: 100%;
            padding-right: 70px;
        }
    }
    .user-details{
        width: 65%;
        height: 100%;
        background-color: #e1c7a5;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #6b3e26;
        font-family: Inter;
        @media screen and (max-width: 860px){
            justify-content: flex-start;
            align-items: start;
            width: 100%;
            padding-left: 70px;
            overflow-y: scroll;
        }
    }
    .user-details .details-view{
        @media screen and (max-width : 860px){
            width: 100%;
            height: 100%;
            padding-bottom: 20px;
            overflow-y: scroll;
        }
    }
    .user-details p{
        display: flex;
        gap: 10px;
        width: 300px;
        height: 30px;
        border-bottom: 2px solid #eee;
        @media screen and (max-width: 860px){
            gap: 5px;
            width: 80%;
            height:30px;
            font-size: 1rem;
        }
    }
</style>
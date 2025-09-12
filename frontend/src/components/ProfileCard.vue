<script setup>
import { useRouter } from 'vue-router'
import { toRaw } from 'vue'
import { useUserStore } from '../store/index'

const userStore = useUserStore()
const router = useRouter()
const navigateProfile = () => {
    router.push('/profile')
}

// Données calculées pour le profil
const profileData = () => {
    if (!userStore.user) return null

    return {
        firstName: toRaw(userStore.user.firstname),
        lastName: toRaw(userStore.user.lastname),
        profileImage: toRaw(userStore.user.profilePhotoUrl) || 'src\assets\images\Default-avatar.png',
        email: toRaw(userStore.user.email),
        plan: toRaw(userStore.user.privilege) || 'user' // Exemple de champ supplémentaire
    }
}
const data = profileData()
</script>

<template>
    <div class="user-main-ctn" @click="navigateProfile">
        <div class="user-card-title">
        <h3>Profile</h3>
        </div>
        <div class="user-mid">
        <div v-if="!userStore.user">No user connected...</div>
        <div v-else class="profile-img">
            <img :src="data.profileImage" class="usr-img"/>
        </div>
        </div>
        <div class="user-bottom-ctn">
        <div class="user-bottom">
            <div v-if="!userStore.user" class="task-title">(NO USER)</div>
            <div class="user-data" v-else>
            <div class="user-title">{{ data.firstName }} {{ data.lastName }}</div>
            <div class="plan">{{ data.plan }}</div>
            </div>
        </div>
        </div>
    </div>
</template>

<style scoped>
    .user-main-ctn{
        width: 200px;
        height: 250px;
        border-radius: 15px;
        margin: 10px;
        overflow: hidden;
        color: #505181;
        box-shadow: 1px 1px 50px rgba(0, 0, 0, 0.3);
        position: relative;
        animation-name: scaleUp;
        animation-duration: .5s;
        animation-timing-function: ease-in-out;
        animation-delay: .6s;
        &:hover{
            cursor: pointer;
            box-shadow: 1px 1px 50px rgba(0, 0, 0, 0.5);
        }
        &:hover .user-card-title h3::after{
            width: 55px;
        }
        @media screen and (max-width: 860px){
            width: 40vw;
            height: 25vh;
            position: relative;
        }
    }
    @keyframes scaleUp{
        from{
            transform: scale(0.5);
        }
        to{
            transform: scale(1);
        }
    }
    
    .user-card-title{
        text-align: right;
        height: 20%;
        position: relative;
        z-index: 1;
    }
    .user-card-title h3{
        position: absolute;
        top: 10px;
        right: 10px;
        color:#505181;
        font-size: 1rem;
        @media screen and (max-width: 860px){
            top: -15px;
            color: #eee;
        }
    }
    .user-card-title h3::after{
        content: "";
        width: 30px;
        height: 4px;
        background-color: #505181;
        position: absolute;
        bottom: 0;
        right: 0;
        border-radius: 50px;
        transition: all 0.35s ease;
    }
    
    .user-mid{
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #4287f5;
        font-family: Inter;
        font-size: 0.8rem;
        font-weight: 700;
        background-color: #eee;
        @media screen and (max-width: 860px){
            position: relative;
        }
    }
    .user-mid .profile-img{
        position: absolute;
        top:10px;
        left: 10px; 
        height: 90px;
        width: 90px;
        border : 6px solid #fff;
        border-radius : 50%;
        overflow: hidden;
        @media screen and (max-width: 860px){
            position: absolute;
            right: 10px;
            top: 20px;
            width: 70px;
            height: 70px;
        }
    }
    .user-mid .profile-img .usr-img{
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: all 0.35s ease;
    }
    .user-bottom-ctn{
        position: relative;
        height: 80%;
        @media screen and (max-width: 860px){
            position: absolute;
            top: 60px;
            width: 60%;
            z-index: 3;
        }
    }
    .user-bottom{
        position: absolute;
        bottom: 30px;
        color: #eee;
        display: flex;
        @media screen and (max-width: 860px){
            bottom: 10px;
            height: 100%;
        }
    }
    .user-bottom .user-data{
        @media screen and (max-width: 860px){
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: start;
        }
    }
    .plan{
        color: #505181;
        padding-left: 20px;
        @media screen and (max-width: 860px){
            text-align: right;
            font-size: 0.6rem;
            width: 100%;
            margin-left: 30%;
        }    
    }
    .user-bottom .user-title{
        padding: 20px;
        font-size: 1.2rem;
        color: #505181;
        font-weight: 700;
        @media screen and (max-width: 860px){
            font-size: 0.8rem;
            padding: 10px;
            text-align: right;
            width: 100%;
            margin-left: 40%;
        }
    }
</style>

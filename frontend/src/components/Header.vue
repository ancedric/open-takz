<template>
                <div class="header-ctn">
                        <div class="title">
                            <h1>OpenTaskz</h1>
                        </div>
                        <div class="menu">
                            <Menu />
                        </div>
                        <div class="search">
                            <input type="search" placeholder="search a project"/>
                            <button class="search-btn">
                                <img src="../assets/icons/search.png" alt="">
                            </button>
                        </div>
                        <div class="notifs">
                            <Notifications />
                            <div v-if="!isLoading" class="profile">
                                <div class="prof-img" @click="isAccountOpen = !isAccountOpen">
                                    <img :src="`../assets/${data.profileImage}.png`" :alt="data.firstName">
                                </div>
                                <div class="username">
                                    <p>{{data.firstName}} {{data.lastName}}</p>
                                </div>
                                <div class="account" v-show="isAccountOpen">
                                    <ul>
                                        <li><router-link to="/profile" class="link">My Account</router-link></li>
                                        <li><router-link to="/usersConditions" class="link">GCU</router-link></li>
                                        <li><router-link to="/legalNotice" class="link">Legal notice</router-link></li>
                                        <li><router-link to="/support" class="link">Support</router-link></li>
                                        <li @click="logout">Log Out</li>
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
    import Menu from './Menu.vue'
    import axios from 'axios'
    import { useRouter } from 'vue-router'
    import { ref, toRaw } from 'vue'
    import { useUserStore } from '../store/index'

    const userStore = useUserStore()
    const router = useRouter()
    const isLoading = ref(true)
    const isAccountOpen = ref(false)
    const navigateProfile = () => {
        router.push('/profile')
    }

    // Données calculées pour le profil
    const profileData = () => {
        if (!userStore.user) {
            isLoading.value = true
            return null
        }
        isLoading.value = false
        
        return {
            firstName: toRaw(userStore.user.firstname),
            lastName: toRaw(userStore.user.lastname),
            profileImage: toRaw(userStore.user.profilePhotoUrl) || 'src\assets\images\Default-avatar.png',
            email: toRaw(userStore.user.email),
            plan: toRaw(userStore.user.privilege) || 'user' // Exemple de champ supplémentaire
        }
    }
    const logout = async (userRef) => {
        const result = await axios.post(`${import.meta.dotenv.VITE_API_URL}/user/logout/${userRef}`)
        if(result.data?.message === 'Déconnexion réussie'){
            userStore.logout()
            router.push('/auth')
        }
    }
    const data = profileData()
</script>

<style scoped>
    .header-ctn{
        display: flex;
        justify-content: space-around;
        gap: 20px;
        width: 100vw;
        height: 50px;
        background-color:#eee;
        padding: 10px;
        position: absolute;
        top: 0;
        left:0;
        box-shadow: 0 0 300px rgba(0, 0, 0, 0.3);

        .title{
            width: 15%;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            padding-left: 30px;

            h1{
                color: #004581;
            }
        }
        .menu{
            width: 30%;
        }
        .search{
            display: flex;
            gap: 0;
            justify-content: center;
            width: 25%;
            padding: 10px;

            input{
                width: 65%;
                border-top-left-radius: 5px;
                border-bottom-left-radius: 5px;
                border: 1px solid #948a8a42;
                border-right: none;
                margin-right:0;
                padding-left: 10px;
                font-size: 0.8rem;
            }
            button{
                width: 35px;
                border-top-right-radius: 5px;
                border-bottom-right-radius: 5px;
                border: none;
                background-color: #c2dff8;
                font-weight: 700;
                cursor: pointer;
                img{
                    width: 20px;
                    height: 20px;
                }
            }
        }
        .notifs{
            position: relative;
            display: flex;
            justify-content: space-around;
            align-items: center;
            width: 20%;
            .username{
                width: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 0.8rem;
                font-weight: 400;
                color: #004581;
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

                ul{
                    margin: O;
                    padding: 0;
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
            }
        }
    }
</style>
<script setup>
    
    import { ref, onMounted, toRaw } from 'vue'
    import Spinner from '../components/Spinner.vue'
    import MainCard from "../components/MainCard.vue"
    import Card from "../components/Card.vue"
    import Header from "../components/Header.vue"
    import ProjectCard from "../components/ProjectCard.vue"
    import AddTaskBar from "../components/AddTaskBar.vue"
    import Notifications from "../components/Notifications.vue"
    import { useUserStore } from '../store/index'
    import { useRouter } from 'vue-router'
    import {storeToRefs} from 'pinia'
    import { scheduleNotifications, checkProfileCompletion } from '../services/NotificationsSystem.js';
    import { watch } from 'vue'

    const router = useRouter()
    const userStore = useUserStore()
    const isLoading = ref(true)
    
    const projects=[
        {
            projectRef:"PROJ_001",
            projectName:"BUild a website",
            startDate:"11/04/2025",
            status:"in progress",
            team :[
                {
                    collabRef: "COL_012",
                    colabName: 'John Doe',
                    colabEmail: 'johndoe@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Designer'
                },
                {
                    collabRef: "COL_002",
                    colabName: 'Luis Martinez',
                    colabEmail: 'luismarti01@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: ' Web Developer'
                },
                {
                    collabRef: "COL_021",
                    colabName: 'Mary Jane',
                    colabEmail: 'janemary@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Project Manager'
                },
                {
                    collabRef: "COL_123",
                    colabName: 'Alex Vidal',
                    colabEmail: 'vidalex@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Tester'
                },
            ],
            description:"Build a web site for a start-up who need to share travel experience and help people reserve their journey easily.",
        },
        {
            projectRef:"PROJ_002",
            projectName:"Music Application",
            startDate:"17/02/2025",
            status:"in progress",
            team :[
                {
                    collabRef: "COL_012",
                    colabName: 'John Doe',
                    colabEmail: 'johndoe@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Designer'
                },
                {
                    collabRef: "COL_002",
                    colabName: 'Luis Martinez',
                    colabEmail: 'luismarti01@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: ' Web Developer'
                },
                {
                    collabRef: "COL_021",
                    colabName: 'Mary Jane',
                    colabEmail: 'janemary@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Project Manager'
                },
                {
                    collabRef: "COL_123",
                    colabName: 'Alex Vidal',
                    colabEmail: 'vidalex@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Tester'
                },
            ],
            description:"Make a mobile application that help to manage their favorite music every where.",
        },
        {
            projectRef:"PROJ_003",
            projectName:"Architecture plan",
            startDate:"23/03/2025",
            status:"in progress",
            team :[
                {
                    collabRef: "COL_012",
                    colabName: 'John Doe',
                    colabEmail: 'johndoe@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Designer'
                },
                {
                    collabRef: "COL_002",
                    colabName: 'Luis Martinez',
                    colabEmail: 'luismarti01@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: ' Web Developer'
                },
                {
                    collabRef: "COL_021",
                    colabName: 'Mary Jane',
                    colabEmail: 'janemary@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Project Manager'
                },
                {
                    collabRef: "COL_123",
                    colabName: 'Alex Vidal',
                    colabEmail: 'vidalex@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Tester'
                },
            ],
            description:"Make an architechtural plan for a building in the center town.",
        },
        {
            projectRef:"PROJ_004",
            projectName:"General meating",
            startDate:"01/06/2025",
            status:"pending",
            team :[
                {
                    collabRef: "COL_012",
                    colabName: 'John Doe',
                    colabEmail: 'johndoe@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Designer'
                },
                {
                    collabRef: "COL_002",
                    colabName: 'Luis Martinez',
                    colabEmail: 'luismarti01@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: ' Web Developer'
                },
                {
                    collabRef: "COL_021",
                    colabName: 'Mary Jane',
                    colabEmail: 'janemary@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Project Manager'
                },
                {
                    collabRef: "COL_123",
                    colabName: 'Alex Vidal',
                    colabEmail: 'vidalex@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Tester'
                },
            ],
            description:"Organization of the midyear general meating of the company.",
        },
        {
            projectRef:"PROJ_005",
            projectName:"Educational website",
            startDate:"21/08/2025",
            status:"pending",
            team :[
                {
                    collabRef: "COL_012",
                    colabName: 'John Doe',
                    colabEmail: 'johndoe@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Designer'
                },
                {
                    collabRef: "COL_002",
                    colabName: 'Luis Martinez',
                    colabEmail: 'luismarti01@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: ' Web Developer'
                },
                {
                    collabRef: "COL_021",
                    colabName: 'Mary Jane',
                    colabEmail: 'janemary@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Project Manager'
                },
                {
                    collabRef: "COL_123",
                    colabName: 'Alex Vidal',
                    colabEmail: 'vidalex@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Tester'
                },
            ],
            description:"Build aan e-learning website that helps student to easily understand what they learn in school an to find references to complete courses.",
        },
        {
            projectRef:"PROJ_006",
            projectName:"driving simulator",
            startDate:"31/08/2025",
            status:"pending",
            team :[
                {
                    collabRef: "COL_012",
                    colabName: 'John Doe',
                    colabEmail: 'johndoe@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Designer'
                },
                {
                    collabRef: "COL_002",
                    colabName: 'Luis Martinez',
                    colabEmail: 'luismarti01@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: ' Web Developer'
                },
                {
                    collabRef: "COL_021",
                    colabName: 'Mary Jane',
                    colabEmail: 'janemary@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Project Manager'
                },
                {
                    collabRef: "COL_123",
                    colabName: 'Alex Vidal',
                    colabEmail: 'vidalex@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Tester'
                },
            ],
            description:"Make a mobile application that help to manage their favorite music every where.",
        },
        {
            projectRef:"PROJ_007",
            projectName:"Attendanse Management System",
            startDate:"19/09/2025",
            status:"pending",
            team :[
                {
                    collabRef: "COL_012",
                    colabName: 'John Doe',
                    colabEmail: 'johndoe@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Designer'
                },
                {
                    collabRef: "COL_002",
                    colabName: 'Luis Martinez',
                    colabEmail: 'luismarti01@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: ' Web Developer'
                },
                {
                    collabRef: "COL_021",
                    colabName: 'Mary Jane',
                    colabEmail: 'janemary@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Project Manager'
                },
                {
                    collabRef: "COL_123",
                    colabName: 'Alex Vidal',
                    colabEmail: 'vidalex@email.com',
                    profileImage: '../assets/images/Default-avatar.png',
                    colabRole: 'Tester'
                },
            ],
            description:"Build a system for a company to manage the attendance and register the log of attendance of each employee.",
        },
        
    ]

    async function initializeUser() {
        try {
            // Vérification de l'authentification de l'utilisateur
            if(!userStore.user) {
                isLoading.value = true
                // Utilisez directement init() qui appelle checkSession()
                const isAuthenticated = await userStore.init()
                
                if (!isAuthenticated) {
                return router.push('/auth')
                }
            } else {
                isLoading.value = false
            }
            
        
            // Vérification des données utilisateur
            if (!userStore.user?.email) {
            console.error('Email utilisateur manquant')
            return router.push('/auth')
            }
        
        } catch (error) {
            console.error('Erreur initialisation:', error)
            router.push('/auth')
        }
        }

onMounted(async () => {
    await initializeUser()
})
    

</script>
<template>
            <section class="page">
                <div class="home-ctn">
                    <Header />
                    <div class="body">
                        <div v-if="!isLoading" class="left">
                            <MainCard />
                        </div>
                        <div v-else class="left">
                            <Spinner />
                        </div>
                        <div class="middle">
                            <div v-if="!isLoading" class="top">
                                <AddTaskBar />
                            </div>
                            <div v-else class="top">
                                <Spinner />
                            </div>
                            <div class="bottom">
                                <template v-if="!isLoading" v-for="project in projects" :key="project.projectRef">
                                    <ProjectCard
                                        :projectName="project.projectName"
                                        :startDate="project.startDate"
                                        :status="project.status"
                                        :team="project.team"
                                        :description="project.description"
                                    />
                                </template>
                                <Spinner v-else />
                            </div>
                        </div>
                        <div v-if="!isLoading" class="right">
                            <Card 
                                teamRef="{{currentTeamRef}}" 
                                projectName=""
                                startDate=""
                                status=""
                                team =""
                                description=""      
                            />
                        </div>
                        <div v-else class="right">
                            <Spinner />
                        </div>
                    </div>
                </div>
            </section>
</template>

<style scoped>
    .page{
        z-index: -10;
        width: 100vw;
        height: 100vh;
        padding: 0;
        margin: 0;
        overflow: hidden;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        background-color: #e0e0e0;
        @media screen and (max-width: 860px){
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
    }
    .home-ctn{
        width: 100vw;
        height: 80vh;
        padding: 20px;
        @media screen and (max-width: 860px){
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            padding: 10px;
        }
    }
    .header{
        display: flex;
        justify-content: space-around;
        align-items:center;
        width: 100%;
        height: 30%;
        color: #ccc;
        font-size: 1.2rem;
        font-weight: 400;
        padding-left: 20px;
        @media screen and (max-width: 860px){
            height: 80px;
            width: 100vw;
            color: #eee;
            font-size: 1rem;
            padding-left: 20px;
        }
    }
    .body{
        width: 100%;
        height: 80%;
        display: flex;
        gap: 60px;
        @media screen and (max-width: 860px){
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 100vw;
        }
        .left, .right{
            width: 20%;
            height: 100%;
            @media screen and (max-width: 860px){
                width: 100%;
                height: 70%;
            }
        }

        .middle{
            width: 70%;
            height: 100%;
            @media screen and (max-width: 860px){
                width: 100%;
                height: 100%;
            }
            .top{
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                height: 100px;
                @media screen and (max-width: 860px){
                    width: 100vw;
                    height: 10vh;
                }
            }
            .bottom{
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
                width: 100%;
                height: 530px;
                margin-left: 20px;
                padding-bottom: 50px;
                overflow-y: scroll;
                scrollbar-width: none;
                -ms-overflow-style: none;
                
                &::-webkit-scrollbar {
                    display: none;
                }
                @media screen and (max-width: 860px){
                    width: 100vw;
                    height: 30vh;
                }
            }
        }
    }
    
    .about{
        font-family: Inter;
        font-size: 0.8rem;
        font-weight: 400;
        text-decoration: underline;
    }

</style>
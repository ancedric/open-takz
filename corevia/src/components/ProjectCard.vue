<script setup>
import { useRouter } from 'vue-router'
import { ref, toRaw } from 'vue'
import { useUserStore } from '../store/index'


const props = defineProps({
        projectName: String,
        startDate: String,
        status: String,
        team: Array,
        description: String,
})

const completed = ref('completed')
const pending = ref('pending')
const progress = ref('progress')
const userStore = useUserStore()
const router = useRouter()
const navigateProfile = () => {
    router.push('/profile')
}

</script>

<template>
    <div class="project-main-ctn" @click="navigateProfile">
        <div class="proj-icon">
            <img src="../assets/icons/database.png" alt="">
        </div>
        <div class="proj-ct">
            <div class="project-card-title">
                <h4>{{props.projectName}}</h4>
            </div>
            <div class="project-card-mid">
                <p class="project-desc"> {{ props.description }} </p>
            </div>
            <div class="project-bottom-ctn">
                    <div class="project-info">
                        <div v-for="collab in props.team" class="team"> 
                            <img :src="collab.profileImage" alt="">
                        </div>
                        <div class="status"> 
                            <div :class="{statusMarker:true, completed:props.status=== completed, pending:props.status === pending, progress:props.status === progress}"> {{props.status}} </div>    
                        </div>
                    </div>
                    <div class="date">
                        <p>{{ props.startDate }}</p>
                    </div>
            </div>
        </div>
        
    </div>
</template>

<style scoped>
    .project-main-ctn{
        display: flex;
        width: 80%;
        height: 150px;
        border-radius: 15px;
        margin: 10px;
        overflow: hidden;
        color: #505181;
        box-shadow: 1px 1px 50px rgba(0, 0, 0, 0.3);
        background-color:#eee;
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
        .proj-icon{
            width: 30%;
            height: 100%;
            margin: 0;
            background-color: #c2dff8;
            display: flex;
            justify-content: center;
            align-items: center;
            object-fit: cover;

            img{
                width: 50px;
                height: 50px;
            }
        }
        .proj-ct{
            width: 70%;
            height: 100%;
            padding: 10px;
            margin:0;
        }
        .project-card-title{
            text-align: left;
            height: 30%;
            z-index: 1;
        }
        .project-card-title h3{
            color:#505181;
            font-size: 1rem;
            @media screen and (max-width: 860px){
                top: -15px;
                color: #eee;
            }
        }
        .project-card-title h3::after{
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

        .project-card-mid{
            width: 100%;
            height: 35%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #4287f5;
            font-family: Inter;
            font-size: 0.8rem;
            font-weight: 400;
            @media screen and (max-width: 860px){
                position: relative;
            }
        }
        .project-bottom-ctn{
            height: 35%;
            @media screen and (max-width: 860px){
                position: absolute;
                top: 60px;
                width: 60%;
                z-index: 3;
            }
        }
        .date{
            color: #505181;
            padding-left: 20px;
            @media screen and (max-width: 860px){
                text-align: right;
                font-size: 0.6rem;
                width: 100%;
                margin-left: 30%;
            }    
        }
        .project-bottom .project-info{
            display: flex;
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

            .team{
                background-color: skyblue;
                width:80%;
                height: 50%;
            }
            .status{
                width:80%;
                height: 50%;

                .statusMarker{
                    width: 100%;
                    height: 30px;
                    border-radius: 5px;
                    color: #eee;
                }
                .completed{
                    background-color: #4caf50;
                    color: #fff;
                    padding: 5px;
                    border-radius: 5px;
                }
                .pending{
                    background-color: #ff9800;
                    color: #fff;
                    padding: 5px;
                    border-radius: 5px;
                }
                .progress{
                    background-color: #2196f3;
                    color: #fff;
                    padding: 5px;
                    border-radius: 5px;
                }
            }
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
    
    
    
    
</style>

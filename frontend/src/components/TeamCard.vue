<script setup>
import { useRouter } from 'vue-router'
import { toRaw } from 'vue'
import { useUserStore } from '../store/index'


const props = defineProps({
        projectName: String,
        startDate: String,
        status: String,
        team: Array,
        description: String,
})

const userStore = useUserStore()
const router = useRouter()
const navigateProfile = () => {
    router.push('/profile')
}

</script>

<template>
    <div class="project-main-ctn" @click="navigateProfile">
        <div class="project-card-title">
            <h4>{{props.projectName}}</h4>
        </div>
        <div class="project-card-mid">
            <p class="project-desc"> {{ props.description }} </p>
        </div>
        <div class="project-bottom-ctn">
                <div class="project-info">
                    <div class="team"> 
                        <img src="" alt="">
                    </div>
                    <div class="status"> {{ props.status }} </div>
                </div>
                <div class="date">
                    <p>{{ props.date }}</p>
                </div>
        </div>
    </div>
</template>

<style scoped>
    .project-main-ctn{
        width: 50%;
        height: 150px;
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
        .project-card-title{
            background-color: yellow;
            text-align: right;
            height: 30%;
            position: relative;
            z-index: 1;
        }
        .project-card-title h3{
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
            font-weight: 700;
            background-color: #b82525;
            @media screen and (max-width: 860px){
                position: relative;
            }
        }
        .project-bottom-ctn{
            height: 35%;
            background-color: blue;
            @media screen and (max-width: 860px){
                position: absolute;
                top: 60px;
                width: 60%;
                z-index: 3;
            }
        }
        .date{
            background-color: green;
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
                background-color: skyblue;
                width:80%;
                height: 50%;
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

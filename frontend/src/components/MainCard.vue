<script setup>
    import supabase from '../services/supabaseConfig'
    import ProgressBar from "./ProgressBar.vue"
    import {ref, computed} from 'vue'
    import {useRouter, useRoute} from 'vue-router'

    const router = useRouter()
    const tasksList = ref([])

    const getTasks = async () => {
        const { data, error } = await supabase 
        .from('Tasks')
        .select()

        if(error){
            console.log(error);
            return []
        }
        if(data){
            tasksList.value =data
            return data
        }
    };
    getTasks()


    // Utilisez une valeur computed pour récupérer la dernière tâche
    const latestTask = computed(() => {
        if(tasksList.value.length === 0 || tasksList.value === undefined ){
            return []
        }
        return tasksList.value.sort((a, b) => a.created_at > b.created_at ? -1 : 1)
    })

    const navigateTo = () =>{
        router.push({path:"/tasks"})
    }
</script>

<template>
    <div v-if="tasksList.length === 0" class="main-ctn">
        <div class="card-title">
            <h3>Last Project</h3>
        </div>
        <div class="mid">
            <img src="/src/assets/images/lates-task-img.png" class="task-img"/>
        </div>
        <div class="main-bottom-ctn">
            <div class="main-bottom">
                <div class="task-title">No task...</div>
            </div>
        </div>
    </div>
    <div v-else class="main-ctn" @click="navigateTo">
        <div class="card-title">
            <h3>Last Task</h3>
        </div>
        <div class="mid">
            <img src="/src/assets/images/lates-task-img.png" class="task-img"/>
        </div>
        <div class="main-bottom-ctn">
            <div class="main-bottom">
                <div class="task-title">{{latestTask[0].title}}</div>
                <div class="task-percent">{{latestTask[0].progression}}%</div>
            </div>
            <div class="foot">
                <ProgressBar :percent="latestTask[0].progression" />
            </div>
        </div>
    </div>
</template>

<style scoped>
    .main-ctn{
        width: 350px;
        height: 500px;
        border-radius: 20px;
        margin: 10px;
        overflow: hidden;
        box-shadow: 1px 1px 50px rgba(0, 0, 0, 0.3);
        position: relative;
        animation-name: scaleUp;
        animation-duration: .5s;
        animation-timing-function: ease-in-out;
        @media screen and (max-width: 860px){
            width: 95vw;
            height: 25vh;
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
    .main-ctn:hover{
        cursor: pointer;
        box-shadow: 1px 1px 50px rgba(0, 0, 0, 0.5);
    }
    .main-ctn::after{
        content:"";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 25%;
        background-image: linear-gradient(45deg, #0000009d , #ffffff00);
    }
    .card-title{
        text-align: right;
        color :#eee;
        height: 10%;
        padding: 20px;
        background-image: linear-gradient(-135deg, #0000009d , #ffffff00);
        position: relative;
        z-index: 1;
    }
    .card-title h3{
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 1rem;
        @media screen and (max-width:860px){
            top: -15px;
        }
    }
    .card-title h3::after{
        content: "";
        width: 30px;
        height: 4px;
        background-color: #eee;
        position: absolute;
        bottom: 0;
        right: 0;
        border-radius: 50px;
        transition: all 0.35s ease;
    }
    .main-ctn:hover .card-title h3::after{
        width: 75px;
    }
    .main-ctn:hover .mid .task-img{
        transform: scale(1.2);
    }
    .mid{
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
    }
    .mid .task-img{
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: all 0.35s ease;
        z-index: 2;
    }
    .main-bottom-ctn{
        position: relative;
        height: 80%;
        @media screen and (max-width:860px){
            display: flex;
            justify-content: space-between;
        }
    }
    .main-bottom{
        position: absolute;
        bottom: 30px;
        color: #eee;
        display: flex;
        @media screen and (max-width:860px){
            bottom: -12px;
            width: 50%;
        }
    }
    .main-bottom .task-title{
        padding: 20px;
        font-size: 1.2rem;
        font-weight: 700;
        z-index: 2;
        @media screen and (max-width:680px){
            font-size: 1rem;
            padding: 10px;
            font-weight: 400;
        }
    }
    .main-bottom .task-percent{
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 10px;
        font-size: 2.6rem;
        font-weight: 700;
        color: #e3f20f;
        z-index: 1;
        @media screen and (max-width:680px){
            font-size: 1.6rem;
        }
    }
    .main-bottom-ctn .foot{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 170%;
        @media screen and (max-width:860px){
            position: absolute;
            top: 0;
            right: 0;
            width: 50%;
            z-index: 10;
        }
    }
</style>

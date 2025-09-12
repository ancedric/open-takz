<template>
    <section class="page">
        <div class="ctn">
            <router-link to="/home">Home</router-link>
            <form action="" @submit.prevent="submitTask">
                <h4>Edit Task</h4>
                <div class="top">
                    <div class="set-title">
                        <div class="type-ctn">
                            <div class="label">Task title</div>
                            <input type="text" v-model="taskTitle" class="task-set-input" :placeholder="taskTitle"><br/>
                        </div>
                    </div>
                    <div class="set-details">
                        <div class="type-ctn">
                            <div class="label">Task description</div>
                            <textarea v-model="taskDescription" class="task-area"> {{taskDescription}} </textarea><br/>
                        </div>
                        
                        
                    </div>
                </div>
                <div class="bottom">
                    <button class="send-task-btn">Save modifications</button>
                </div>
            </form>
        </div>
    </section>
    <Alert type="danger" action="emptyField" v-if="notFilled"/>
    <Alert type="danger" action="error" v-if="errors"/>
    <Alert type="success" action="added" v-if="success"/>
</template>

<script setup>
    import { ref, computed } from 'vue'
    import supabase from '../services/supabaseConfig.js'
    import { useRoute, useRouter } from 'vue-router'
    import { addTask } from '../services/task.js'
    import { useProfileStore } from '../store/profile'

    const route = useRoute()
    const router = useRouter()
    const profileStore = useProfileStore()

    //const taskdata = ref(route.params.title)
    //console.log("data got from url :", taskdata.value)

    const taskId = ref(route.params.id)
    const taskTitle = ref(route.params.title)
    const taskDescription = ref(route.params.description)
    const stepsList = ref([])
    const newStepName = ref('')
    const newStepTime = ref('')
    const addStep = ref(false)
    const errors = ref( false )
    const success= ref(false)
    const notFilled = ref(false)

    const submitTask = async () => {
        if(taskTitle.value === '' || taskDescription.value === ''){
            notFilled.value = true
            errors.value = false
            success.value = false

            setTimeout(() => notFilled.value = false , 3000)
        }else{
            const title = taskTitle.value
            const description = taskDescription.value
            const progression = 0
            const completed = false
            const ownerId = 1 

            console.log("form data:",title, description, progression, completed, ownerId)

            const { data, error } = await supabase
                .from('Tasks')
                .insert([{title, description, progression, completed, ownerId }])
                .select()

                if(error){
                    console.log(error)
                    errors.value = true

                    setTimeout(() => error.value = false , 3000)
                }
                if(data){
                    notFilled.value = false
                    errors.value = false
                    success.value = true
                    router.push('/tasks')

                    setTimeout(() => success.value = false , 3000)
                }
        }
    }
    /*
    <label>Steps: </label><br/>
                        <div v-if="stepsList.length > 0">
                            <ul class="step-list">
                                <li class="step-list-elem" v-for="step in stepsList" :key="step.name">
                                    <label>
                                        {{step.name}}
                                        <input type="checkbox" class="checkbox" v-model="step.done"/>
                                        <p>{{step.time}}</p>
                                    </label>
                                </li>
                            </ul>
                        </div>
                        <p @click="showStepForm" class="stepForm">Click to add a step</p>
                        

    <div class="step-form">
                            <form action="" v-if="addStep === true" @submit.prevent="addNewStep">
                            <div class="input-ctn">
                                <div class="label">Step title</div><input type="text" class="task-set-input" v-model="newStepName">
                            </div>
                            <div class="input-ctn">
                                <div class="label">Step time</div><input type="time" class="task-set-input" v-model="newStepTime">
                            </div>
                            <button class="add-btn">Add step</button>
                        </form>
                        </div>*/
</script>

<style scope>
    .ctn{
        width: 70vw;
        height: 80vh;
        background-color: #eee;
        border-radius: 50px;
        box-shadow: 1px 1px 50px rgba(0, 0, 0, 0.3);
        @media screen and (max-width: 860px){
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            width: 95vw;
            height: 95vh;
            padding: 0;
        }
    }
    .ctn form{
        display: flex;
        flex-direction: column;
        @media screen and (max-width: 860px){
            padding-top: 300px;
        }
    }
    .ctn form .top{
        display: flex;
        justify-content: space-around;
        align-items: center;
        gap: 50px;
        @media screen and (max-width: 860px){
            flex-direction: column;
            justify-content: center;
            gap: 10px;
        }
    }
    .ctn form .bottom{
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .set-title{
        border-right: 1px solid; 
        padding-right: 50px;
        margin-bottom: 30px;
        @media screen and (max-width: 860px){
            border-right: none;
            padding-right: 10px;
            margin-bottom: 10px;
        }
    }
    .set-details{
        position: relative;
        @media screen and (max-width: 860px){
            width: 300px;
            padding: 0;
        }
    }
    .step-form{
        position: absolute;
        top: 80px;
        left: -145%;
        @media screen and (max-width: 860px){
            top: 200px;
            left: 10px;
            width: 300px;
        }
    }
    .task-set-input{
        height: 43px;
        width: 200px;
        border-radius: 10px;
        background-color: #eee;
        color: #9da6e0;
        font-family: Poppins;
        padding-left: 20px;
        border: 1px solid;
    }
    .input-ctn{
        height: 43px;
        width: 200px;
        color: #9da6e0;
        margin-top: 20px;
        font-family: Poppins;
        padding-left: 20px;
        position: relative;
    }
    .type-ctn{
        height: 43px;
        width: 200px;
        color: #9da6e0;
        margin-top: 20px;
        font-family: Poppins;
        padding-left: 20px;
        margin-bottom: 70px;
        position: relative;
    }
    .input-ctn .label{
        position: absolute;
        top: -10px;
        left: 40px;
        font-size: 0.8rem;
        background-color: #eee;
        padding-left: 5px;
        padding-right: 5px;
        z-index: 1;
    }
    .type-ctn .label{
        position: absolute;
        top: -10px;
        left: 40px;
        font-size: 0.8rem;
        background-color: #eee;
        padding-left: 5px;
        padding-right: 5px;
        z-index: 1;
    }
    .task-area{
        height: 100px;
        width: 100%;
        border-radius: 10px;
        background-color: #eee;
        color: #9da6e0;
        font-family: Poppins;
        padding-left: 20px;
        border: 1px solid;
    }
    .send-task-btn{
        display: flex;
        justify-content: flex-start;
        align-items: center;
        height: 40px;
        width: 40px;
        border: none;
        border-radius: 10px;
        background-color: #2a2f4f;
        color: #eee;
        font-family: Poppins;
        text-wrap: nowrap;
        font-weight: 600;
        cursor: pointer;
        overflow: hidden;
        transition: all 0.35s ease;
        padding-left:10px;
        position: absolute;
        right: 10%;
        top: 28px;
        &:hover{
            width: 150px;
        }
        @media screen and (max-width: 860px){
            right: 15%;
            top: 100px;
            width: 120px;
        }
    }
    .add-btn{
        display: flex;
        justify-content: center;
        align-items: center;
        height: 40px;
        width: 80px;
        border: none;
        border-radius: 10px;
        background-color: #2a2f4f;
        color: #eee;
        font-family: Poppins;
        font-weight: 600;
        cursor: pointer;
        margin-top: 10px;
    }
    .stepForm{
        font-family: Inter;
        font-size: 0.8rem;
        text-decoration: underline;
        cursor: pointer;
    }
    .step-list-elem label .checkbox{
        width: 30px;
        border: 2px solid;
    }
    .step-list-elem label{
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: Inter;
        font-weight: 400;
    }
</style>
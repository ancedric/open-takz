<template>
        <div class="form-ctn">
            <h4>New Project</h4>
            <form class="project-form" action="" @submit.prevent="submitProject()">
                <div class="buttons">
                        <input type="submit" class="send-btn" value="Save Project">
                        <button type="button" class="dismiss-btn" @click="close()">Dismiss</button>
                </div>
                <div class="middle">
                    <div class="set-title">
                        <div class="type-ctn">
                            <div class="label">Project Name</div>
                            <input type="text" v-model="projectName" class="task-set-input" :placeholder="projectName"><br/>
                        </div>
                        <div class="type-ctn">
                            <div class="label">Project description</div>
                            <textarea v-model="projectDescription" class="task-area"></textarea><br/>
                        </div>
                    </div>
                    <div class="set-details">
                        <div class="details-left">
                            <div class="type-ctn">
                                <div class="label">Project Type</div>
                                <input type="text" v-model="projectType" class="task-set-input" placeholder="project type"><br/>
                            </div>
                            <div class="type-ctn">
                                <div class="label">Project Start Date</div>
                                <input type="date" v-model="projectStartDate" class="task-set-input"><br/>
                            </div>
                        </div>
                        <div class="details-right">
                            <div class="type-ctn">
                            <div class="label">Project Objectives</div>
                            <textarea v-model="projectObjectives" class="task-area"></textarea><br/>
                        </div>
                            <div class="type-ctn">
                                <div class="label">Upload a project file</div>
                                <input type="file" @change="uploadDoc()" class="task-set-input"><br/>
                            </div>
                        </div>
                        
                        
                    </div>
                </div>
            </form>
        </div>
    <Alert type="danger" action="emptyField" v-if="notFilled"/>
    <Alert type="danger" action="error" v-if="errors"/>
    <Alert type="success" action="added" v-if="success"/>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import Alert from '../components/Alert.vue';
import { useUserStore } from '../store/index'

const props = defineProps({
    projectName: String,
    team: Array,
    closeForm:{
        type: Function,
        required: true
    },

})
const emit = defineEmits(['closeForm'])
const router = useRouter()
const useUser = useUserStore()

const projectName = ref(props.projectName)
const projectDescription = ref('')
const projectType = ref('')
const projectStartDate = ref('')
const projectObjectives = ref('')
const projectTeam = ref(null)
const file = ref(null)
const errors = ref(false)
const success = ref(false)
const notFilled = ref(false)
const userRef = useUser.user.userRef

const uploadDoc = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
        file.value = selectedFile
        console.log('Selected file:', file.value)
    } else {
        console.log('No file selected')
    }
}
const resetForm = () => {
    projectName.value = ''
    projectDescription.value = ''
    projectType.value = ''
    projectStartDate.value = ''
    projectObjectives.value = ''
    projectTeam.value = null
    file.value = null
}

const close = () =>{
    resetForm()
    emit('closeForm')
}
const submitProject = async () => {
    // Validation
    if(!projectName.value || !projectDescription.value || !projectStartDate.value) {
        notFilled.value = true
        setTimeout(() => notFilled.value = false, 3000)
        return
    }

    try {
        const formData = new FormData()
        
        // Ajoutez tous les champs au FormData
        formData.append('name', projectName.value)
        formData.append('description', projectDescription.value)
        formData.append('type', projectType.value)
        formData.append('start_date', projectStartDate.value)
        formData.append('objectives', projectObjectives.value)
        formData.append('team', projectTeam.value)
        formData.append('userRef', useUser.user.userref)
        
        // Ajoutez le fichier s'il existe
        if (file.value) {
            formData.append('file', file.value)
        }

        console.log('Envoi des données:')
        // Affichez le contenu de FormData pour le débogage
        for (let [key, value] of formData.entries()) {
        console.log(key, value)
        }

        const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/project/new-project`, 
        formData//,
        /*{
            headers: {
            'Content-Type': 'multipart/form-data'
            }
        }*/
        )

        if (response.status === 201) {
        success.value = true
        setTimeout(() => {
            success.value = false
            router.push(`/project/${userRef}`)
        }, 3000)
        } else {
        throw new Error('Erreur de création de projet')
        }
    } catch (error) {
        console.error('Erreur:', error.response?.data || error.message)
        errors.value = true
        setTimeout(() => errors.value = false, 3000)
    }
    }
</script>

<style scoped>
    .form-ctn{
        position: absolute;
        left:50%;
        top:50%;
        transform: translate(-50%, -50%);
        z-index:10;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        width: 50vw;
        height: 80vh;
        padding:20px;
        overflow-y:scroll;
        overflow-x: hidden;
        background-color: #bbbdcc;
        border-radius: 12px;
        box-shadow: 1px 1px 50px rgba(0, 0, 0, 0.3);
        scrollbar-width: none;
        -ms-overflow-style: none;
        
        &::-webkit-scrollbar {
            display: none;
        }
        @media screen and (max-width: 860px){
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            width: 95vw;
            height: 95vh;
            padding: 0;
        }

        .project-form{
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            width: 100%;
            margin:20px;
            @media screen and (max-width : 860px){
                height:100px;
                position: relative;
            }
            .buttons{
                display: flex;
                justify-content: flex-end;
                align-items: center;
                gap: 50px;
                padding: 20px;
                @media screen and (max-width: 860px){
                    flex-direction: column;
                    justify-content: space-around;
                    gap: 10px;
                }
                .send-btn{
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
                    padding-left:5px;
                    &:hover{
                        width: 120px;
                    }
                    @media screen and (max-width: 860px){
                        right: 15%;
                        bottom: 100px;
                        width: 120px;
                    }
                }
                .dismiss-btn{
                    height: 40px;
                    width: 40px;
                    border: 2px solid ;
                    border-radius: 10px;
                    background-color: #a1a6c4;
                    color: #2a2f4f;
                    font-family: Poppins;
                    text-wrap: nowrap;
                    font-weight: 600;
                    cursor: pointer;
                    overflow: hidden;
                    transition: all 0.35s ease;
                    padding-left:5px;
                    &:hover{
                        width: 120px;
                    }
                    @media screen and (max-width: 860px){
                        right: 15%;
                        bottom: 100px;
                        width: 120px;
                    }
                }
            }
            .middle{
                width:100%;

                .set-title{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    border:1px solid #9da6e0;
                    border-radius: 10px;
                    @media screen and (max-width: 860px){
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        gap: 10px;
                    }
                    .type-ctn{
                        height: 43px;
                        width: 100%;
                        color: #2a2f4f;
                        margin-top: 20px;
                        font-family: Poppins;
                        margin-bottom: 70px;
                        position: relative;

                        .input-ctn{
                            height: 43px;
                            width: 200px;
                            color: #2a2f4f;
                            margin-top: 20px;
                            font-family: Poppins;
                            position: relative;
                        }
                        
                        .label{
                            position: absolute;
                            top: -10px;
                            left: 40px;
                            font-size: 0.8rem;
                            background-color: #bbbdcc;
                            padding-left: 5px;
                            padding-right: 5px;
                            z-index: 1;
                        }
                        .task-set-input{
                            height: 43px;
                            width: 200px;
                            border-radius: 10px;
                            background-color: #bbbdcc;
                            color: #2a2f4f;
                            font-family: Poppins;
                            padding-left: 20px;
                            border: 1px solid;
                        }
                        
                        .task-area{
                            height: 100px;
                            width: 100%;
                            border-radius: 10px;
                            background-color: #bbbdcc;
                            color: #2a2f4f;
                            font-family: Poppins;
                            padding-left: 20px;
                            border: 1px solid;
                        }
                    }
                }
                .set-details{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    border:1px solid #9da6e0;
                    border-radius: 10px;
                    width: 100%;
                    margin: 10px;
                    @media screen and (max-width: 860px){
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        gap: 10px;
                    }
                    .details-left, .details-right{
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        gap: 10px;
                        width: 50%;
                        @media screen and (max-width: 860px){
                            width: 100%;
                            margin-left: 0;
                            margin-right: 0;
                        }
                        .type-ctn{
                            height: 43px;
                            width: 100%;
                            color: #2a2f4f;
                            margin-top: 20px;
                            font-family: Poppins;
                            margin-bottom: 70px;
                            position: relative;

                            .input-ctn{
                                height: 43px;
                                width: 200px;
                                color: #2a2f4f;
                                margin-top: 20px;
                                font-family: Poppins;
                                position: relative;
                            }
                            
                            .label{
                                position: absolute;
                                top: -10px;
                                left: 40px;
                                font-size: 0.8rem;
                                background-color: #bbbdcc;
                                padding-left: 5px;
                                padding-right: 5px;
                                z-index: 1;
                            }
                            .task-set-input{
                                height: 43px;
                                width: 200px;
                                border-radius: 10px;
                                background-color: #bbbdcc;
                                color: #2a2f4f;
                                font-family: Poppins;
                                padding-left: 20px;
                                padding-top: 10px;
                                border: 1px solid;
                            }
                            
                            .task-area{
                                height: 100px;
                                width: 85%;
                                border-radius: 10px;
                                background-color: #bbbdcc;
                                color: #2a2f4f;
                                font-family: Poppins;
                                padding-left: 20px;
                                border: 1px solid;
                            }
                        }
                    }
                    
                }
            }
        }
        
        
    }
</style>
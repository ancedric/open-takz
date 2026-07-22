<script setup>
    import {ref} from 'vue'
    import {useRoute, useRouter} from 'vue-router'
    import Alert from './Alert.vue';
    import Spinner from './Spinner.vue';
    import AddTask from './AddTask.vue'
    import supabase from '../services/supabaseConfig.js';

    const newProject = ref('')
    const errors = ref(false)
    const isFormVisible = ref(false)
    const isTeamFormVisible = ref(false)
    const searchMember = ref('')
    const isLoading = ref(false)
    const members = ref([])
    const matchedMember = ref(null)

    const openTaskForm = () => {
        if(!newProject.value){
            errors.value = true
        } else{
            errors.value = false
            isFormVisible.value = true
        }
    }
    const openTeamForm = () => {
            isTeamFormVisible.value = true
    }
    const buildTeam = async () => {
        if (!searchMember.value) {
            errors.value = true;
            return;
        }

        isLoading.value = true;
        try {
            //const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/users`);
            const {data, error} = await supabase
            .from('user')
            .select('*')
            
            if (error) throw new Error("Aucune donnée reçue", error);

            members.value = data;

            matchedMember.value = members.value.find(member => 
                member.email.toLowerCase() === searchMember.value.toLowerCase()             
            );

            if (!matchedMember.value) {
                throw new Error(`Aucun membre trouvé avec l'email: ${searchMember.value}`);
            }
            await sendInvitation(matchedMember.value.email, currentProjectId.value);
            
            searchMember.value = '';
            errors.value = false;

        } catch (error) {
            console.error("Erreur:", error.message);
            errors.value = true;
            matchedMember.value = null; // Reset en cas d'erreur
        } finally {
            isLoading.value = false;
        }
    }

    const onClose = () => {
        isFormVisible.value = false
        newProject.value = ''
    }


</script>

<template>
    <div class="creator-ctn">
            <input type="text" v-model="newProject" placeHolder="Create a new project..." class="project-input" />
            <button :disabled="newProject.length === 0" @click="openTaskForm()" class="create-btn"> <img src="../assets//icons/plus.png" alt=""></button>
    </div>
    

    <AddTask v-if="isFormVisible" :projectName="newProject" @closeForm="onClose"/>
    <Alert type="danger" action="emptyField" v-if="errors"/>
</template>
<style scoped>
    .creator-ctn{
        display: flex;
        gap: 0;
        justify-content: center;
        width: 245px;
        height: 25px;

        input{
            flex: 1; 
            padding: 15px 12px; 
            border-top-left-radius: 6px;
            border-bottom-left-radius: 6px;
            border: 1px solid #ddd;
        }
        .create-btn{
            display: flex;
            justify-content: center;
            align-items: center;
            width: 40px;
            height: 33px;
            border: 1px solid #948a8a42;
            border-top-right-radius: 6px;
            border-bottom-right-radius: 6px;
            img{
                width: 20px;
                height: 20px;
                object-fit: cover;
            }    
        }
    }
    
</style>
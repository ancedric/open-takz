
<script setup>
    import {ref} from 'vue'
    import {useRoute, useRouter} from 'vue-router'
    import Alert from './Alert.vue';
    import Spinner from './Spinner.vue';
    import AddTask from './AddTask.vue'

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
            // 1. Rechercher l'utilisateur par email dans la même entreprise
            const { data: targetUser, error: userError } = await supabase
                .from('user')
                .select('*')
                .eq('email', searchMember.value.toLowerCase())
                .eq('companyref', userStore.user.companyref)
                .single();

            if (userError || !targetUser) throw new Error("Collaborateur introuvable dans votre entreprise.");

            // 2. Ajouter l'utilisateur au projet (Table project_members)
            // Note: Assurez-vous d'avoir récupéré 'currentProjectId' au préalable
            const { error: memberError } = await supabase
                .from('project_members')
                .insert([{
                    projectref: currentProjectId.value, // Référence du projet en cours
                    userref: targetUser.userref,
                    role: 'member',
                    joined_at: new Date()
                }]);

            if (memberError) {
                if (memberError.code === '23505') throw new Error("Cet utilisateur est déjà membre du projet.");
                throw memberError;
            }

            // 3. Envoyer la notification à l'employé
            const { error: notifError } = await supabase
                .from('notifications')
                .insert([{
                    notifref: 'NOTIF-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                    title: 'Nouveau Projet',
                    content: `${userStore.user.firstname} vous a ajouté au projet : ${projectName.value}`,
                    userref: targetUser.userref, // L'ID de l'employé cible
                    isread: false
                }]);

            if (notifError) console.error("La notification n'a pas pu être envoyée:", notifError.message);

            // Réinitialisation après succès
            searchMember.value = '';
            errors.value = false;
            alert(`${targetUser.firstname} a été ajouté et notifié !`);

        } catch (error) {
            console.error("Erreur d'ajout d'équipe:", error.message);
            errors.value = true;
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
        <div class="team-list" v-if="currentProject.team?.length > 0">
        <h5>Membres de l'équipe</h5>
        <div v-for="member in currentProject.team" :key="member.userref" class="member-badge">
        <img :src="member.profilephotourl || '/default-avatar.png'" class="avatar">
        <span>{{ member.firstname }} {{ member.lastname }}</span>
        <button @click="removeMember(member.userref)" class="remove-btn">×</button>
        </div>
    </div>

    <AddTask v-if="isFormVisible" :projectName="newProject" @closeForm="onClose"/>
    <Alert type="danger" action="emptyField" v-if="errors"/>
</template>
<style scoped>
    .creator-ctn{
        display: flex;
        gap: 0;
        justify-content: center;
        width: 200px;
        height: 25px;

        input{
            width: 160px;
            border-top-left-radius: 5px;
            border-bottom-left-radius: 5px;
            border: 1px solid #948a8a42;
            border-right: none;
            margin-right:0;
            padding-left: 10px;
            font-size: 0.8rem;
        }
        .create-btn{
            display: flex;
            justify-content: center;
            align-items: center;
            width: 40px;
            height: 25px;
            border: 1px solid #948a8a42;
            border-top-right-radius: 5px;
            border-bottom-right-radius: 5px;
            img{
                width: 20px;
                height: 20px;
                object-fit: cover;
            }    
        }
    }
    .member-badge {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #f1f5f9;
        padding: 5px 12px;
        border-radius: 20px;
        margin: 5px 0;
        border: 1px solid #e2e8f0;
    }
    .avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
    .remove-btn { 
        background: none; border: none; color: #ef4444; 
        font-weight: bold; cursor: pointer; padding: 0 5px; 
    }
    
</style>
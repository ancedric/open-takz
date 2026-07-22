<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import supabase from '../services/supabaseConfig'
import Alert from '../components/Alert.vue'
import { useUserStore } from '../store/index'

const props = defineProps({
    projectName: String,
    closeForm: { type: Function, required: true },
})
const emit = defineEmits(['closeForm'])
const router = useRouter()
const userStore = useUserStore()

// États du Projet
const projectName = ref(props.projectName || '')
const projectDescription = ref('')
const projectStartDate = ref(new Date().toISOString().substr(0, 10))
const projectEndDate = ref('')
const projectObjectives = ref('')
const projectExpectedResults = ref('')
const selectedDept = ref('')
const selectedClient = ref('internal')
const clientId = ref(null)
const budget = ref(0)
const projectGain = ref(0)

// Gestion des listes
const departments = ref([])
const clientsList = ref([])
const isNewClient = ref(false)
const newClientData = ref({ companyname: '', contact_email: '' })

// UI States
const file = ref(null)
const submitting = ref(false)
const errors = ref(false)
const success = ref(false)
const notFilled = ref(false)

onMounted(async () => {
    // Charger les départements et clients au montage
    const { data: depts } = await supabase.from('department').select('*').eq('companyref', userStore.user.company.companyref)
    const { data: clients } = await supabase.from('client').select('*').eq('companyref_owner', userStore.user.company.companyref)
    departments.value = depts || []
    clientsList.value = clients || []
})

const uploadDoc = (event) => { file.value = event.target.files[0] }

const submitProject = async () => {
    if (!projectName.value || !selectedDept.value || !projectStartDate.value) {
        notFilled.value = true
        return
    }
    submitting.value = true

    try {
        let docFilePath = null
        const projectRef = 'PROJ-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        const userRef = userStore.user.user.userref 

        // --- GESTION DU DOCUMENT ---
        if (file.value) {
            const fileExt = file.value.name.split('.').pop()
            const filePath = `${userStore.user.company.companyref}/${projectRef}.${fileExt}`

            const { error: storageError } = await supabase.storage.from('projects documents').upload(filePath, file.value)
            if (storageError) throw storageError

            const { data: urlData } = supabase.storage.from('projects documents').getPublicUrl(filePath)
            docFilePath = urlData.publicUrl
        }

        // --- 1. GESTION DU CLIENT ---
        let finalClientId = null
        if (selectedClient.value === 'new') {
            const cRef = 'CLI-' + Math.random().toString(36).substr(2, 7).toUpperCase()
            const { error: clientError } = await supabase.from('client').insert([{
                clientref: cRef,
                companyname: newClientData.value.companyname,
                contact_email: newClientData.value.contact_email,
                companyref_owner: userStore.user.company.companyref
            }])
            if (clientError) throw clientError
            finalClientId = cRef
        } else {
            finalClientId = clientId.value
        }

        // --- 2. INSERTION DU PROJET ---
        const { error: dbError } = await supabase.from('project').insert([{
            projectref: projectRef,
            projectname: projectName.value,
            description: projectDescription.value,
            start_date: projectStartDate.value,
            end_date: projectEndDate.value,
            objectives: projectObjectives.value,
            expected_results: projectExpectedResults.value,
            deptref: selectedDept.value,
            clientref: finalClientId,
            companyref: userStore.user.company.companyref,
            userref: userRef,
            doc_url : docFilePath,
            budget: budget.value || 0,
            gain: projectGain.value || 0
        }])
        if (dbError) throw dbError

        // --- 3. CRÉATION AUTOMATIQUE DE L'ÉQUIPE ---
        const teamRef = 'TEAM-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        const { error: teamError } = await supabase.from('team').insert([{
            teamref: teamRef,
            projectref: projectRef,
            userref: userRef, 
            role: 'Chef de projet'
        }])
        if (teamError) throw teamError

        // --- 4. ENREGISTREMENT DU COLLABORATEUR (Chef de projet) ---
        const collabRef = 'COL-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        const { error: collabError } = await supabase.from('collaborator').insert([{
            collabref: collabRef,
            userref: userRef,
            teamref: teamRef,
            role: 'Chef de projet'
        }])
        if (collabError) throw collabError

        success.value = true
        setTimeout(() => {
            emit('closeForm')
            closeFrom() 
        }, 1500)

    } catch (err) {
        console.error("Erreur lors de la création du projet complet:", err)
        errors.value = true
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <div class="form-overlay">
        <div class="form-ctn">
            <header class="form-header">
                <h3>🚀 Nouveau Projet</h3>
                <button class="close-icon" @click="$emit('closeForm')">✕</button>
            </header>

            <form @submit.prevent="submitProject" class="project-form">
                <section class="form-section">
                    <div class="grid-2">
                        <div class="input-group">
                            <label>Nom du projet</label>
                            <input type="text" v-model="projectName" placeholder="Ex: Refonte Site Web">
                        </div>
                        <div class="input-group">
                            <label>Département</label>
                            <select v-model="selectedDept">
                                <option value="" disabled>Choisir un département</option>
                                <option v-for="d in departments" :key="d.deptref" :value="d.deptref">
                                    {{ d.deptname }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="input-group">
                        <label>Description</label>
                        <textarea v-model="projectDescription" rows="3"></textarea>
                    </div>
                </section>

                <section class="form-section highlight">
                    <label>Client du projet</label>
                    <div class="radio-group">
                        <label><input type="radio" value="internal" v-model="selectedClient"> Interne</label>
                        <label><input type="radio" value="existing" v-model="selectedClient"> Client Existant</label>
                        <label><input type="radio" value="new" v-model="selectedClient"> Nouveau Client</label>
                    </div>

                    <div v-if="selectedClient === 'existing'" class="input-group mt-10">
                        <select v-model="clientId">
                            <option v-for="c in clientsList" :key="c.clientref" :value="c.clientref">
                                {{ c.companyname }}
                            </option>
                        </select>
                    </div>

                    <div v-if="selectedClient === 'new'" class="grid-2 mt-10">
                        <input type="text" v-model="newClientData.companyname" placeholder="Nom Entreprise Client">
                        <input type="email" v-model="newClientData.contact_email" placeholder="Email Contact">
                    </div>
                </section>

                <section class="form-section">
                    <div class="grid-2">
                        <div class="input-group">
                            <label>Date Début</label>
                            <input type="date" v-model="projectStartDate">
                        </div>
                        <div class="input-group">
                            <label>Date Fin (Prévue)</label>
                            <input type="date" v-model="projectEndDate">
                        </div>
                    </div>

                    <div class="grid-2 mt-10">
                        <div class="input-group">
                            <label>Objectifs (Prévisions)</label>
                            <textarea v-model="projectObjectives" placeholder="Ce qu'on veut atteindre..."></textarea>
                        </div>
                        <div class="input-group">
                            <label>Résultats Attendus (KPIs)</label>
                            <textarea v-model="projectExpectedResults" placeholder="Livrables finaux..."></textarea>
                        </div>
                        <div class="input-group">
                            <label>Budget estimé</label>
                            <input type="number" v-model="budget">
                        </div>
                        <div class="input-group">
                            <label>Bénéfice estimé</label>
                            <input type="number" v-model="projectGain">
                        </div>
                    </div>
                </section>

                <div class="form-footer">
                    <div class="file-upload">
                        <input type="file" id="file" @change="uploadDoc" class="hidden-input">
                        <label for="file" class="file-label">
                            {{ file ? file.name : '📎 Joindre un cahier des charges' }}
                        </label>
                    </div>
                    <div class="actions">
                        <button type="button" class="btn-secondary" @click="$emit('closeForm')">Annuler</button>
                        <button type="submit" class="btn-primary" :disabled="submitting">
                            {{ submitting ? 'Création...' : 'Créer le projet' }}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <Alert type="danger" action="emptyField" v-if="notFilled" />
    <Alert type="success" action="added" v-if="success" />
</template>

<style scoped>
.form-overlay {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(30, 41, 59, 0.7);
    backdrop-filter: blur(4px);
    display: flex; justify-content: center; align-items: center;
    z-index: 999;
}

.form-ctn {
    background: #ffffff;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.form-header {
    padding: 20px 30px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.form-header h3 { color: #1e293b; margin: 0; }
.close-icon { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; }

.project-form {
    padding: 30px;
    overflow-y: auto;
}

.form-section {
    margin-bottom: 25px;
}

.form-section.highlight {
    background: #f1f5f9;
    padding: 15px;
    border-radius: 12px;
}

.grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 15px;
}

label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
}

input[type="text"], 
input[type="date"], 
input[type="email"], 
select, 
textarea {
    padding: 10px 14px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.95rem;
    transition: border-color 0.2s;
}

input:focus, textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.radio-group {
    display: flex;
    gap: 20px;
    margin-top: 10px;
}

.form-footer {
    padding: 20px 30px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.btn-primary {
    background: #3b82f6;
    color: white;
    padding: 10px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

.btn-secondary {
    background: white;
    color: #64748b;
    padding: 10px 24px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    margin-right: 10px;
    cursor: pointer;
}

.file-label {
    font-size: 0.9rem;
    color: #3b82f6;
    cursor: pointer;
    text-decoration: underline;
}

.hidden-input { display: none; }
.mt-10 { margin-top: 10px; }

@media (max-width: 640px) {
    .grid-2 { grid-template-columns: 1fr; }
    .form-ctn { width: 100%; height: 100%; max-height: 100vh; border-radius: 0; }
}
</style>
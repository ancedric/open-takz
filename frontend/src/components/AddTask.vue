<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import supabase from '../services/supabaseConfig'
import Alert from '../components/Alert.vue';
import { useUserStore } from '../store/index'

const props = defineProps({
    projectName: String,
    closeForm: { type: Function, required: true },
})
const emit = defineEmits(['closeForm'])
const router = useRouter()
const userStore = useUserStore()

const projectName = ref(props.projectName)
const projectDescription = ref('')
const projectType = ref('')
const projectStartDate = ref('')
const projectObjectives = ref('')
const file = ref(null)
const errors = ref(false)
const success = ref(false)
const notFilled = ref(false)

const uploadDoc = (event) => {
    file.value = event.target.files[0]
}

const submitProject = async () => {
    if(!projectName.value || !projectDescription.value || !projectStartDate.value) {
        notFilled.value = true
        setTimeout(() => notFilled.value = false, 3000)
        return
    }

    try {
        const projectRef = 'PROJ-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        let filePath = null

        // 1. Upload du fichier vers le storage Supabase si présent
        if (file.value) {
            const fileExt = file.value.name.split('.').pop()
            filePath = `${userStore.user.companyref}/${projectRef}.${fileExt}`
            
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file.value)
            
            if (uploadError) throw uploadError
        }

        // 2. Insertion du projet dans la table 'project'
        const { error: dbError } = await supabase
            .from('project')
            .insert([{
                projectref: projectRef,
                projectname: projectName.value,
                description: projectDescription.value,
                type: projectType.value,
                start_date: projectStartDate.value,
                objectives: projectObjectives.value,
                companyref: userStore.user.companyref, // Ajout du contexte ERP
                userref: userStore.user.userref
            }])

        if (dbError) throw dbError

        // 3. Si un fichier a été uploadé, créer l'entrée dans 'documents'
        if (filePath) {
            await supabase.from('documents').insert([{
                doc_ref: 'DOC-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                file_name: file.value.name,
                file_path: filePath,
                category: 'technical',
                projectref: projectRef,
                companyref: userStore.user.companyref
            }])
        }

        success.value = true
        setTimeout(() => {
            success.value = false
            router.push(`/project/${userStore.user.userref}`)
            emit('closeForm')
        }, 2000)

    } catch (error) {
        console.error('Erreur Supabase:', error.message)
        errors.value = true
        setTimeout(() => errors.value = false, 3000)
    }
}
</script>
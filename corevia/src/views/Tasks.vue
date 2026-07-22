

<script setup>
    import {useRouter} from "vue-router" 
    import { useUserStore } from '../store/index'

    const router = useRouter()
    const userStore = useUserStore()
    const userRef = userStore.user.userRef
    
    router.push({path: `/project/${userRef}`})

</script>

<style scoped>

</style>
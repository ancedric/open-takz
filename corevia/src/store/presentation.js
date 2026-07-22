import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './index' 

export const useProfileStore = defineStore('profile', () => {
  const userStore = useUserStore()
  
  // Utilisation de computed pour que le profil soit toujours à jour avec le userStore
  const profile = computed(() => {
    if (!userStore.user) return null;
    
    return {
      email: userStore.user.email,
      firstName: userStore.user.firstname,
      lastName: userStore.user.lastname,
      profileImage: userStore.user.profilephotourl,
      id: userStore.user.userref,
      privilege: userStore.user.privilege
    }
  })

  const isLoading = computed(() => userStore.isLoading)

  // Plus besoin de init() complexe ici, tout passe par le UserStore
  return { profile, isLoading }
})
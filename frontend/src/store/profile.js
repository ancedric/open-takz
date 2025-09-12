// store/profile.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useUserStore } from './index' 

export const useProfileStore = defineStore('profile', () => {
  const profile = ref(null)
  const isLoading = ref(true)

  const init = async () => {
    const userStore = useUserStore()
    
    // N'essayez de charger le profil que si l'utilisateur est authentifié
    if (!userStore.isAuthenticated) {
      isLoading.value = false
      return
    }

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user`)
        
      if (response.data?.valid) {
        profile.value = {
          email: response.data.user.email,
          firstName: response.data.user.firstname,
          lastName: response.data.user.lastname,
          profileImage: response.data.user.profilePhotoUrl,
          id: response.data.user.userRef
        }
        console.log('Profil chargé:', profile.value)
      }
    } catch (error) {
      console.error('Erreur initialisation profil:', error)
      // Si le token est invalide, déconnectez l'utilisateur
      if (error.response?.status === 401 || error.response?.status === 403) {
        userStore.logout()
      }
    } finally {
      isLoading.value = false
    }
  }

  return { profile, isLoading, init }
})
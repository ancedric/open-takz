import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(true)

  const authenticate = (userData, token) => {
    user.value = userData
    isAuthenticated.value = true
    // Stockez le token dans le Local Storage, pas dans un cookie
    localStorage.setItem('user-token', token)
    console.log('Utilisateur authentifié et token stocké.')
    console.log('Utilisateur authentifié :', user.value)
  }

  const init = async () => {
    const token = localStorage.getItem('user-token')
    if (token) {
      try {
        // Optionnel: Vérifier le token en appelant une route protégée
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.data?.valid) {
          user.value = response.data.user
          isAuthenticated.value = true
          console.log('Session restaurée à partir du token.')
        } else {
          // Token invalide, le supprimer
          logout()
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du token:', err)
        logout()
      }
    }
    isLoading.value = false
  }

  const logout = () => {
    user.value = null
    isAuthenticated.value = false
    // Supprimez le token du Local Storage
    localStorage.removeItem('user-token')
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    authenticate,
    logout,
    init,
  }
})
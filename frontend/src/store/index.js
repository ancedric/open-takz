import { defineStore } from 'pinia'
import { ref } from 'vue'
import supabase from '../services/supabaseConfig' // Importation du client Supabase

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const isAuthenticated = ref(false);
  const isLoading = ref(true);
  const projects = ref([]);

  // Authentification locale suite au login/register réussi sur Supabase
  const authenticate = (userData, token) => {
    user.value = userData
    isAuthenticated.value = true
    // Note: Supabase gère son propre token dans le localStorage (sb-...)
    // mais nous gardons cette logique si votre app en a besoin ailleurs
    localStorage.setItem('user-token', token)
  }

  // Initialisation : Vérifier si une session Supabase existe au chargement
  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      const { data: userData, error } = await supabase
        .from('user')
        .select('*')
        .eq('userref', session.user.id)
        .single();

      if (userData && !error) {
        user.value = userData
        isAuthenticated.value = true
      } else {
        await logout()
      }
    }
    isLoading.value = false
  }

  const logout = async () => {
    await supabase.auth.signOut()
    user.value = null;
    isAuthenticated.value = false;
    localStorage.removeItem('user-token');
  }

  // Version simplifiée pour charger les projets via Supabase
  const getProjects = async () => {
    if (!user.value) return;

    // Récupère les projets, les tâches associées et les membres de l'équipe en une seule fois
    const { data, error } = await supabase
      .from('project')
      .select(`
        *,
        tasks (*),
        team:project_members (
          *,
          user:user (*)
        )
      `)
      .eq('companyref', user.value.companyref);

    if (!error) {
      projects.value = data;
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    projects,
    authenticate,
    logout,
    init,
    getProjects
  };
});
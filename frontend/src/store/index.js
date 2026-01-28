import { defineStore } from 'pinia'
import { ref } from 'vue'
import supabase from '../services/supabaseConfig.js'

export const useUserStore = defineStore('user', () => {
  console.log("Démarrage du store utilisateur");
  const user = ref(null);
    const isAuthenticated = ref(false);
    const isLoading = ref(true);

    // Nouvelles variables d'état pour les projets
    const projects = ref([]);
    const currentProject = ref({
        project: {},
        tasks: [],
        team: [],
        assignments: []
    });

  const authenticate = (userData, employe, company) => {
    user.value = {user: userData, employe, company}
    isAuthenticated.value = true
    localStorage.setItem('user', user)
  }

  const init = async () => {
    const _user = localStorage.getItem('user')
    if (_user) {
      try {
        /*const response = await axios.get(`${import.meta.env.VITE_API_URL}/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })*/
        const {data, error} = await supabase
        .from('user')
        .select('*')
        .eq(_user.email)
        .single()

        if (data) {
          user.value = data
          isAuthenticated.value = true
        } else {
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
        user.value = null;
        isAuthenticated.value = false;
        localStorage.removeItem('user');
    }

// Action pour charger TOUTES les données de tous les projets de l'utilisateur
    const getProjects = async (deptRef) => {
      console.log("Démarrage du store utilisateur: récupération des projets");
  try {
    if (!deptRef) {
      projects.value = [];
      return;
    }

    // 1. On récupère le Projet + l'Équipe liée en UNE SEULE requête (Jointure)
    const { data: projectsData, error: projError } = await supabase
      .from('project')
      .select(`
        *,
        team (
          teamref,
          role,
          collaborator (
            collabref,
            role,
            user:userref (*) 
          )
        )
      `)
      .eq('deptref', deptRef);

    if (projError) throw projError;

    // 2. On récupère les tâches et assignations à part (plus simple pour le traitement)
    const detailedProjects = await Promise.all(projectsData.map(async (proj) => {
      
      // Récupérer les tâches du projet
      const { data: tasks } = await supabase
        .from('task')
        .select('*')
        .eq('projectref', proj.projectref);

      // Récupérer les assignations avec les infos users
      let assignments = [];
      if (tasks && tasks.length > 0) {
        const { data: assData } = await supabase
          .from('assignments')
          .select(`*, user:userref (*)`)
          .in('taskref', tasks.map(t => t.taskref));
        assignments = assData || [];
      }

      return {
        project: proj,
        tasks: tasks || [],
        // On aplatit la structure pour que ton interface ne change pas
        team: proj.team?.[0]?.collaborator || [], 
        assignments: assignments
      };
    }));

    projects.value = detailedProjects;

        console.log("liste des projets: ", projects.value)
  } catch (err) {
    console.error('Erreur chargement projets:', err);
  }
};

    // Action pour définir le projet courant, sans appel API
    const setCurrentProject = (projectRef) => {
        const project = projects.value.find(p => p.project.projectref === projectRef);
        if (project) {
            currentProject.value = project;
        } else {
            console.error('Projet introuvable dans le store:', projectRef);
        }
    };

    return {
        user,
        isAuthenticated,
        isLoading,
        projects,
        currentProject,
        authenticate,
        logout,
        init,
        getProjects,
        setCurrentProject
    };
});
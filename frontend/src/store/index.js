import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api';

export const useUserStore = defineStore('user', () => {
  // 1. On essaie de récupérer immédiatement les données du localStorage (Synchrone)
  const _savedUser = localStorage.getItem('user');
  const user = ref(_savedUser ? _savedUser : null);
  
  // Si on a un user en cache, on est techniquement authentifié en attendant la vérification
  const isAuthenticated = ref(!!_savedUser); 
  const isLoading = ref(true);

    // Nouvelles variables d'état pour les projets
    const projects = ref([]);
    const currentProject = ref({
        project: {},
        tasks: [],
        team: [],
        assignments: []
    });

    const authenticate = async (token, userData, employe, company) => {
    try {
      console.log("token: ", token, "user: ",userData, "employe: ",employe, "company: ",company)
        // 3. On crée l'objet structuré global
        const sessionData = {
            token: token, 
            user: userData, 
            employe: employe, 
            company: company 
        };
        user.value = sessionData;
        isAuthenticated.value = true;
        
        // 4. On enregistre dans le localStorage
        localStorage.setItem('user', JSON.stringify(sessionData));
        

    } catch (err) {
        console.error("Erreur lors de la récupération des magasins pendant l'auth:", err);
        // On peut quand même authentifier sans magasins si besoin, ou bloquer
    }
};

  const init = async () => {
    isLoading.value = true;
    const _sessionRaw = localStorage.getItem('user');
    
    if (!_sessionRaw) {
      isLoading.value = false;
      return;
    }
    console.log('Session trouvée dans localStorage, tentative de restauration...', _sessionRaw);
    try {
      const session = JSON.parse(_sessionRaw);

      const userResponse = await api.get('/user/')
      if(userResponse.data.valid){
            user.value = session;
            console.log("restaured user: ", user.value)
            isAuthenticated.value = true;
            localStorage.setItem('user', JSON.stringify(session));

      }
    } catch (err) {
      console.error('Erreur restauration session:', err);
      // Ne pas logout ici au premier echec réseau, sinon l'utilisateur est déco par erreur
    } finally {
      isLoading.value = false;
    }
  };

    const logout = () => {
        user.value = null;
        isAuthenticated.value = false;
        localStorage.removeItem('user');
    }

// Action pour charger TOUTES les données de tous les projets de l'utilisateur
    const getProjects = async (deptRef) => {
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
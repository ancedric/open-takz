import { defineStore } from 'pinia'
import { ref } from 'vue'
import supabase from '../services/supabaseConfig.js'

export const useUserStore = defineStore('user', () => {
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
      try {
        if (!deptRef) {
          console.warn('deptRef manquant.');
          projects.value = [];
          return;
        }
        // 1. Récupérer tous les projets liés à ce département
        const { data: projectsData, error: projError } = await supabase
          .from('project')
          .select('*')
          .eq('deptref', deptRef);

        if (projError) throw projError;
        if (!projectsData || projectsData.length === 0) {
          projects.value = [];
          return;
        }

        // 2. Pour chaque projet trouvé, on récupère les données liées (Tasks, Team, Assignments)
        const detailedProjectsPromises = projectsData.map(async (project) => {
          
          // Récupération simultanée des tâches et de l'équipe pour ce projet
          const [tasksRes, teamRes] = await Promise.all([
            supabase.from('task').select('*').eq('projectref', project.projectref),
            supabase.from('team').select('*').eq('projectref', project.projectref)
          ]);

          const tasks = tasksRes.data || [];
          const team = teamRes.data || [];

          // 3. Récupérer les détails des utilisateurs de l'équipe
          const teamWithUserDetails = await Promise.all(
            team.map(async (member) => {
              const { data: userData } = await supabase
                .from('user')
                .select('*')
                .eq('userref', member.userref)
                .single();
              return { ...member, user: userData };
            })
          );

          // 4. Récupérer les assignations pour toutes les tâches du projet
          let allAssignments = [];
          if (tasks.length > 0) {
            const taskRefs = tasks.map(t => t.taskref);
            const { data: assignmentsData } = await supabase
              .from('assignments') // Vérifie l'orthographe "assignments" (tu avais "assisgnments")
              .select('*')
              .in('taskref', taskRefs);
            
            // Ajouter les infos utilisateurs aux assignations
            allAssignments = await Promise.all(
              (assignmentsData || []).map(async (ass) => {
                const { data: userData } = await supabase
                  .from('user')
                  .select('*')
                  .eq('userref', ass.userref)
                  .single();
                return { ...ass, user: userData };
              })
            );
          }
          
          return {
            project: project,
            tasks: tasks,
            team: teamWithUserDetails,
            assignments: allAssignments
          };
        });

        projects.value = await Promise.all(detailedProjectsPromises);
      } catch (err) {
        console.error('Erreur lors du chargement des projets du département:', err);
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
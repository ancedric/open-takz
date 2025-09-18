import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

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

  const authenticate = (userData, token) => {
    user.value = userData
    isAuthenticated.value = true
    localStorage.setItem('user-token', token)
    console.log('Utilisateur authentifié et token stocké.')
    console.log('Utilisateur authentifié :', user.value)
  }

  const init = async () => {
    const token = localStorage.getItem('user-token')
    if (token) {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.data?.valid) {
          user.value = response.data.user
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
        localStorage.removeItem('user-token');
    }

// Action pour charger TOUTES les données de tous les projets de l'utilisateur
    const getProjects = async () => {
        try {
            // Étape 1: Récupérer la liste des projets de l'utilisateur
            const projectsRes = await axios.get(`${import.meta.env.VITE_API_URL}/project/get-projects/${user.value.userref}`);
            const projectsList = projectsRes.data.data;
            
            // Pour chaque projet, on charge tous les détails
            const detailedProjectsPromises = projectsList.map(async (project) => {
                const projectRef = project.projectref;
                
                // Requêtes parallèles pour les tâches et l'équipe
                const [tasksRes, teamRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/task/get-tasks/${projectRef}`),
                    axios.get(`${import.meta.env.VITE_API_URL}/team/project/${projectRef}`)
                ]);
                
                // Récupération des détails de l'équipe
                if (teamRes.data.members === undefined) {
                  return {
                    project: project,
                    tasks: tasksRes.data.data,
                    team: [],
                    assignments: []
                  };
                }
                const teamWithUserDetails = await Promise.all(
                  teamRes.data.members.map(async (member) => {
                        if(member.userref === undefined) {
                          return {
                            ...member,
                            user: []
                          };
                        }
                        const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/user/${member.userref}`);
                        return {
                            ...member,
                            user: userRes.data.data
                        };
                    })
                );
                
                // Récupération des assignations pour CHAQUE tâche, puis des infos utilisateurs
                if (tasksRes.data.data.length === 0) {
                  return {
                    project: project,
                    tasks: [],
                    team: teamWithUserDetails,
                    assignments: []
                  };
                }
                const assignmentsPromises = tasksRes.data.data.map( async task =>{
                    return await axios.get(`${import.meta.env.VITE_API_URL}/assignment/get-assignments/${task.taskref}`)
                });
                const assignmentsResponses = await Promise.all(assignmentsPromises);
                
                const allAssignments = [].concat(...assignmentsResponses.map(res => {
                  if(res.data.data === undefined) {
                    return [];
                  }
                  return res.data.data
                }));
                
                // Pour chaque assignation, récupérer les détails utilisateur
                
                const assignmentsWithUserDetailsPromises = allAssignments.map(async (assignment) => {
                    if(assignment.userref === undefined || assignment.userref === null) {
                      return {
                        ...assignment,
                        user: []
                      };
                    }

                    const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/user/${assignment.userref}`);
                    return {
                        ...assignment,
                        user: userRes.data.data
                    };
                });
                
                const assignmentsWithUserDetails = await Promise.all(assignmentsWithUserDetailsPromises);             
                // Retourne l'objet projet complet
                return {
                    project: project,
                    tasks: tasksRes.data.data,
                    team: teamWithUserDetails,
                    assignments: assignmentsWithUserDetails
                };
            });
            
            projects.value = await Promise.all(detailedProjectsPromises);

        } catch (err) {
            console.error('Erreur lors du chargement des projets:', err);
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
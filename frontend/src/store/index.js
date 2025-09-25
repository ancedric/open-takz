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
    const getProjects = async (userRef) => {
      try {
        if (!userRef) {
          console.warn('Aucun utilisateur connecté ou userref manquant.');
          projects.value = [];
          return;
        }

        // 1. Récupérer les collaborations de l'utilisateur.
        const collaborationsRes = await axios.get(`${import.meta.env.VITE_API_URL}/collab/get-collab-user/${userRef}`);
        const collaborations = collaborationsRes.data;
        
        if (!collaborations || collaborations.length === 0) {
          // Si aucune collaboration n'est trouvée, charger ses propres projets
          await loadUserOwnedProjects(); 
          return;
        }

        // 2. Pour chaque collaboration, on récupère l'équipe associée.
        const uniqueTeamRefs = [...new Set(collaborations.map(c => c.teamref))];
        const teamPromises = uniqueTeamRefs.map(teamRef => 
          axios.get(`${import.meta.env.VITE_API_URL}/team/get-team-collab/${teamRef}`)
        );
        const teamResponses = await Promise.all(teamPromises);
        const teams = teamResponses.map(res => res.data);

        // 3. Pour chaque équipe, on récupère le projectRef associé.
        const projectRefs = teams.map(t => t.projectref);
        const uniqueProjectRefs = [...new Set(projectRefs)]; // Éliminer les doublons
        
        if (uniqueProjectRefs.length === 0) {
          projects.value = [];
          return;
        }

        // 4. Pour chaque projectRef, on récupère les détails du projet.
        const detailedProjectsPromises = uniqueProjectRefs.map(async (projectRef) => {

          const [projectRes, tasksRes, teamRes] = await Promise.all([
              axios.get(`${import.meta.env.VITE_API_URL}/project/${projectRef}`),
              axios.get(`${import.meta.env.VITE_API_URL}/task/get-tasks/${projectRef}`),
              axios.get(`${import.meta.env.VITE_API_URL}/team/project/${projectRef}`)
          ]);
          
          const teamWithUserDetails = teamRes.data.members ? await Promise.all(
              teamRes.data.members.map(async (member) => {
                  const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/user/${member.userref}`);
                  return { ...member, user: userRes.data.data };
              })
          ) : [];
          
          const assignmentsPromises = tasksRes.data.data.map(task =>{
            if(!task.taskref) return Promise.resolve({data: {data: []}});
            return axios.get(
              `${import.meta.env.VITE_API_URL}/assignment/get-assignments/${task.taskref}`)
          });
          const assignmentsResponses = await Promise.all(assignmentsPromises);
          const allAssignments = [].concat(...assignmentsResponses.map(res => res.data.data));

          const assignmentsWithUserDetails = await Promise.all(
              allAssignments.map(async (assignment) => {
                  if(!assignment.userref) return { ...assignment, user: null };
                  const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/user/${assignment.userref}`);
                  return { ...assignment, user: userRes.data.data };
              })
          );
          
          return {
              project: projectRes.data.data,
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
<script setup>
    import supabase from '../services/supabaseConfig.js'
    import { ref, onMounted, computed, watch } from 'vue'
    import Header from '../components/Header.vue'
    import Spinner from '../components/Spinner.vue'
    import { useUserStore } from '../store/index.js'
    import AddTaskBar from '../components/AddTaskBar.vue'
    import ProjectProgressChart from '../components/ProjectProgressChart.vue';
    import { useRoute } from 'vue-router'
    
    const props = defineProps({
        deptName: String,
        deptId: String,
    })

    const deptRef = computed(() => props.deptId)
    const open = ref(false)
    const selectedProjectId = ref()
    const calendarContainer = ref(null); 
    const currentYear = ref(new Date().getFullYear());
    const daysInYear = ref([]);
    const hoveredTaskDetails = ref(null);
    const currentMonth = ref(new Date().getMonth());
    const userStore = useUserStore()
    const projects = computed(() => userStore.projects);
    const route = useRoute()
    const success = ref(false)
    const errors = ref(false)
    const isProjectsLoading = ref(true)
    const isCurrentLoading =  ref(false)
    const searchKey = ref('')
    const searchMember = ref('')
    const isOverviewOpen = ref(true)
    const isDashboardOpen = ref(false)
    const isReportOpen = ref(false)
    const isTasksOpen = ref(false)
    const isSubmenuOpen = ref(false)
    const isTaskFormOpen = ref(false)
    const isTeamFormOpen = ref(false)
    const isDocumentFormOpen = ref(false)
    const isMembersLoading = ref(false)
    const isListTabActive = ref(true)
    const isKanbanTabActive = ref(false)
    const isTimelineTabActive = ref(false)
    const isGanttTabActive = ref(false)
    const newTaskName = ref('')
    const newTaskDesc = ref('')
    const newTaskStart = ref('')
    const newTaskEnd = ref('')
    const ongoing = ref('ongoing')
    const completed = ref('completed')
    const validated = ref('validated')
    const foundMember = ref(null)

    const displayedYears = computed(() => {
            const years = [];
            for (let i = 0; i < 5; i++) {
                years.push(currentYear.value - i);
            }
            return years.sort((a, b) => b - a); 
        });

    function getTaskStyle(task) {
    const start = new Date(task.startdate);
    const end = new Date(task.enddate);

    // Vérifie si la tâche est visible dans le mois en cours
    const currentMonthDate = new Date(currentYear.value, currentMonth.value);
    const startOfCurrentMonth = new Date(currentYear.value, currentMonth.value, 1);
    const endOfCurrentMonth = new Date(currentYear.value, currentMonth.value + 1, 0);

    // La tâche commence avant la fin du mois ET se termine après le début du mois
    if (start > endOfCurrentMonth || end < startOfCurrentMonth) {
        return {}; // La tâche n'est pas dans le mois en cours
    }

    // Calcul de l'offset (décalage de départ)
    const startDateInMonth = Math.max(start.getDate(), 1); // La tâche commence au plus tôt le 1er du mois
    const offset = startDateInMonth - 1; // L'offset est basé sur l'index (0-basé)

    // Calcul de la durée
    const endDateInMonth = Math.min(end.getDate(), daysInMonth.value.length); // La tâche se termine au plus tard le dernier jour du mois
    const duration = endDateInMonth - startDateInMonth + 1; // Durée en jours


    return {
        '--offset': offset,
        '--duration': duration
    };
}

const generateYearCalendar = (year) => {
    const days = [];
    const firstDayOfYear = new Date(year, 0, 1);
    const lastDayOfYear = new Date(year, 11, 31);
    let currentDay = firstDayOfYear;

    while (currentDay <= lastDayOfYear) {
        days.push({
            date: new Date(currentDay),
            hasTask: false,
            tasks: []
        });
        currentDay.setDate(currentDay.getDate() + 1);
    }
    return days;
};

const populateTasksInCalendar = () => {
    // Vérifie si le projet contient des tâches avant de continuer
    if (!userStore.currentProject.tasks || !userStore.currentProject.tasks.length) {
        return;
    }

    // Normaliser les dates des tâches au début du jour pour une comparaison fiable
    const normalizedTasks = userStore.currentProject.tasks.map(task => {
        return {
            ...task,
            startDate: new Date(task.startdate).setHours(0, 0, 0, 0),
            endDate: new Date(task.enddate).setHours(0, 0, 0, 0)
        };
    });

    // Normaliser les dates du calendrier pour les comparer avec les dates des tâches
    const normalizedDays = daysInYear.value.map(day => new Date(day.date).setHours(0, 0, 0, 0));

    normalizedTasks.forEach(task => {
        for (let i = 0; i < normalizedDays.length; i++) {
            const dayTimestamp = normalizedDays[i];

            // Comparez les horodatages qui sont des nombres et sont fiables
            if (dayTimestamp >= task.startdate && dayTimestamp <= task.enddate) {
                daysInYear.value[i].hasTask = true;
                daysInYear.value[i].tasks.push(task);
            }
        }
    });
};

const handleDayHover = (day, event) => {
    const rect = calendarContainer.value.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    // Ajustement pour ne pas déborder du conteneur
    const bubbleWidth = 200; // Largeur approximative du bloc .task-details
    if (x + bubbleWidth > rect.width) {
        x = rect.width - bubbleWidth - 10;
    }

    let tasksToShow;
        const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
        const formattedDate = day.date.toLocaleDateString('fr-FR', options);

    if (day.tasks.length > 0) {
        tasksToShow = day.tasks;
    } else {
        tasksToShow = [{ taskname: '', status: '' }];
    }

    hoveredTaskDetails.value = {
        tasks: tasksToShow,
        date: formattedDate,
        x,
        y
    };
};


    const assignMemberToTask = async (taskRef, memberDataString) => {
        try {
            const memberData = JSON.parse(memberDataString);
            const userRef = memberData.userRef;
            const collabRef = memberData.collabRef;

            /*const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/assignment/new-assignment`,
                { 
                    taskRef,
                    collabRef,
                    userRef
                }
            );*/

            const {data, error} = await supabase
            .from('assignment')
            .insert({ 
                    taskRef,
                    collabRef,
                    userRef
                })
            
            if (data) {
                // Rafraîchir les tâches après assignation
                await userStore.getProjects(deptRef.value);
                return true;
            }
        } catch (error) {
            console.error("Error assigning member:", error);
            return false;
        }
    };

    const setCurrentProject = async (projectRef) => {
        try {
            const project = projects.value.find(p => p.projectref === projectRef)
            if (!project) {
            userStore.currentProject.project.value = { 
                project:{},
                team: [] };
            return;
            }

            selectedProjectId.value = project.projectref;
            
            // Initialise currentProject avec team vide
            userStore.currentProject.project.value = {
                ...project,
                team: []
            };

            // Charge l'équipe seulement si projectRef existe
            if (projectRef) {
                const team = await getProjectTeam(projectRef);
                const membersWithDetails = await Promise.all(
                    team.map(async member => {
                        const userDetails = await getTeamUser(member.userref);

                        return {
                            ...member,
                            user: userDetails || {
                            firstname: 'Unknown',
                            lastname: 'User',
                            email: '',
                            profilePhotoUrl: '../assets/images/default-avatar.png'
                            }
                        };
                    })
                );
                userStore.currentProject.project.value = {
                    ...userStore.currentProject.project.value,
                    team: membersWithDetails
                };
            }

        } catch (error) {
            console.error('Error setting project:', error);
            userStore.currentProject.project.value = { team: [] };
        }
    };
    const getTeamUser = async (userRef) => {
    try {
        /*const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/user/${userRef}`
        );*/

        const {data, error} = await supabase
        .from('user')
        .select('*')
        eq('userref', userRef)

        if (error) {
            return null;
        }
        // Si aucune donnée n'est trouvée, retournez null ou un objet par défaut pour éviter les erreurs
        return data;
    } catch (error) {
        console.error("Fetch error for team user:", error);
        return null;
    }
};

const openOverview = () => {
    isOverviewOpen.value = true
    isDashboardOpen.value = false
    isReportOpen.value = false
    isTasksOpen.value = false
}
const openDashboard = () => {
    isOverviewOpen.value = false
    isDashboardOpen.value = true
    isReportOpen.value = false
    isTasksOpen.value = false
}
const openReport = () => {
    isOverviewOpen.value = false
    isDashboardOpen.value = false
    isReportOpen.value = true
    isTasksOpen.value = false
}
const openTasks = () => {
    isOverviewOpen.value = false
    isDashboardOpen.value = false
    isReportOpen.value = false
    isTasksOpen.value = true
}

const openListView = () => {
    isListTabActive.value = true
    isKanbanTabActive.value = false
    isTimelineTabActive.value = false
    isGanttTabActive.value = false
}
const openKanbanView = () => {
    isListTabActive.value = false
    isKanbanTabActive.value = true
    isTimelineTabActive.value = false
    isGanttTabActive.value = false
}
const openTimelineView = () => {
    isListTabActive.value = false
    isKanbanTabActive.value = false
    isTimelineTabActive.value = true
    isGanttTabActive.value = false
}
const openGanttView = () => {
    isListTabActive.value = false
    isKanbanTabActive.value = false
    isTimelineTabActive.value = false
    isGanttTabActive.value = true
}

const showSubmenu = () => {
    isSubmenuOpen.value = !isSubmenuOpen.value
}

const addTask = () => {
    isTaskFormOpen.value = !isTaskFormOpen.value
    isTeamFormOpen.value = false
    isDocumentFormOpen.value = false
    isSubmenuOpen.value = false
}
const manageTeam = () => {
    isTeamFormOpen.value = !isTeamFormOpen.value
    isTaskFormOpen.value = false
    isDocumentFormOpen.value = false
    isSubmenuOpen.value = false
}
const addDocuments = () => {
    isDocumentFormOpen.value = !isDocumentFormOpen.value
    isTaskFormOpen.value = false
    isTeamFormOpen.value = false
    isSubmenuOpen.value = false
}
const submitTask = async ()=> {
    try {
        console.log("data: ", newTaskName.value, newTaskStart.value, newTaskEnd.value, userStore.currentProject.project.projectref)
        const taskRef = 'TASK-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        const {data, error} = await supabase
        .from('task')
        .insert({ 
            taskref: taskRef,
            taskname: newTaskName.value,
            startdate: newTaskStart.value,
            enddate: newTaskEnd.value,
            status: 'ongoing',
            projectref: userStore.currentProject.project.projectref,
        })
        .select()

        if (error) {
            // Ici Supabase vous dira si c'est une erreur de permission (RLS) ou de colonne
            console.error("Erreur Supabase détaillée:", error.message);
            errors.value = true;
            return;
        }
        if (data) {
            success.value = true
            await userStore.getProjects(deptRef.value)
            resetTaskForm()
            userStore.currentProject.tasks.push(data)
            isTaskFormOpen.value = false
            console.log("tasks: ", userStore.currentProject.tasks)
        }
    } catch (error) {
        console.error("Error adding task:", error)
        errors.value = true
    }
}
// Fonction pour réinitialiser le formulaire
const resetTaskForm = () => {
    newTaskName.value = '';
    newTaskStart.value = '';
    newTaskEnd.value = '';
};

const setTaskStatus = async (status, taskRef) => {
    try{
        /*const response = await axios.put(
            `${import.meta.env.VITE_API_URL}/task/set-status/${taskRef}`,
            { 
                status: status,
            }
        )*/
        const {data, error}= await supabase
        .from('task')
        .update({status: status})
        .eq('taskref', taskRef)
        .select()

        if (data) {
            success.value = true
            await userStore.getProjects(deptRef.value)
        }
    }catch(err){
        console.error("Error adding task:", err)
        errors.value = true
    }
}

/*const sendInvitation = async (memberEmail, projectId, projectname) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/email/send-email`,
            {
                to: memberEmail,
                subject: "Invitation à rejoindre un projet",
                text: `Vous avez été invité à rejoindre le projet ${projectname} sur Opentaskz!`,
                html: `
                <h1>Rejoignez notre équipe</h1>
                <p>Cliquez sur le lien ci-dessous pour accepter l'invitation :</p>
                <a href="${window.location.origin}/project/${projectId}/join">
                    Accepter l'invitation
                </a>
                `,
                projectId: projectId
            }
            );

            if (response.status === 200) {
                console.log("Email envoyé avec succès");
            // Afficher une notification à l'utilisateur
            }
        } catch (error) {
            console.error("Erreur lors de l'envoi de l'email:", error);
            // Gérer l'erreur (notification à l'utilisateur)
        }
    };*/
const handleSearch = () => {
    if (searchKey.value) {
        open.value = true
        projects.value = projects.value.filter(project =>
            project.projectname.toLowerCase().includes(searchKey.value.toLowerCase())
        )
    } else {
        projects.value = [...projects.value] // Reset to original projects
    }
}
function getProgressColor(percentage) {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 50) return '#FFC107';
    return '#F44336';
}

const calculateTimeRemaining = (startDate, endDate) => {
    if (!startDate || !endDate) return 'No dates set';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    // Vérification des dates valides
    if (isNaN(start) || isNaN(end)) return 'Invalid dates';
    
    // Si la date de fin est passée
    if (end < now) return 'Completed';

    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    const diffMonths = Math.floor(diffDays / 30.44); // Approximation mois moyen

    const remainingDays = Math.floor(diffDays % 30.44);
    
    if (diffMonths > 0 && remainingDays > 0) {
        return `${diffMonths}mo ${remainingDays}d`;
    } else if (diffMonths > 0) {
        return `${diffMonths}mo`;
    } else {
        return `${diffDays}d`;
    }
};

   const daysInMonth = computed(() => {
        const days = [];
        const date = new Date(currentYear.value, currentMonth.value, 1);
        while (date.getMonth() === currentMonth.value) {
            days.push({
                date: new Date(date),
                day: date.toLocaleDateString('fr-FR', { weekday: 'short' }), // lun, mar, mer...
                number: date.getDate()
            });
            date.setDate(date.getDate() + 1);
        }
        return days;
    });

    const searchMemberByEmail = async (email) => {
        try {
            isMembersLoading.value = true;
            foundMember.value = null;

            // On cherche l'utilisateur qui a cet email ET qui appartient à la même entreprise
            const { data, error } = await supabase
                .from('user')
                .select(`
                    *
                `)
                .eq('email', email)
                //.eq('employee.companyref', userStore.user.company.companyref)
                .single();

            if (error || !data) {
                console.log("Membre non trouvé dans votre entreprise.");
                isMembersLoading.value = false;
            } else {
                foundMember.value = data;
                isMembersLoading.value = false;
            }
        } catch (err) {
            console.error("Erreur recherche:", err);
            isMembersLoading.value = false;
        }
    }
    const addToTeam = async (email, projectref) => {
        try {
            if (!foundMember.value) return;

            const memberToAdd = foundMember.value;

            // 1. Vérifier si le membre est déjà dans l'équipe pour éviter les doublons
            const isAlreadyInTeam = userStore.currentProject.team.some(
                m => m.userref === memberToAdd.userref
            );

            if (isAlreadyInTeam) {
                alert("Cet employé fait déjà partie de l'équipe.");
                return;
            }

            // 2. Insertion dans la table 'team'
            const { data, error } = await supabase
                .from('team')
                .insert([{
                    projectref: projectref,
                    userref: memberToAdd.userref,
                    role: 'Member', // Rôle par défaut
                    teamref: 'TEAM-' + Math.random().toString(36).substr(2, 9).toUpperCase()
                }])
                .select()
                .single();

            if (error) throw error;

            // 3. Mise à jour locale du store pour l'affichage immédiat
            // On ajoute l'utilisateur complet pour que le template puisse l'afficher
            const newTeamMember = {
                ...data,
                user: memberToAdd
            };
            
            userStore.currentProject.team.push(newTeamMember);
            
            // Réinitialisation
            searchMember.value = '';
            foundMember.value = null;

        } catch (err) {
            console.error("Erreur lors de l'ajout à l'équipe:", err);
        }
    }
    onMounted(async () => {
        if(deptRef.value){
            await userStore.getProjects(deptRef.value);
        }
        isProjectsLoading.value = false
        daysInYear.value = generateYearCalendar(currentYear.value);
    });

    watch(() => route.params.id, async (newId) => {
        if (newId) {
            selectedProjectId.value = newId;
            // Appelez l'action du store pour charger les détails complets du projet
            await userStore.getProjectDetails(newId);
        }
    }, { immediate: true });
    // Ce watcher gère la mise à jour des éléments visuels (calendrier, gantt) quand les tâches du projet courant changent.
    watch(
        () => userStore.currentProject.tasks,
        (newTasks) => {
            populateTasksInCalendar();
        },
        { deep: true } // Utiliser deep pour surveiller les changements à l'intérieur des objets tâches
    );

    watch(
        () => selectedProjectId.value,
        (newProjectId) => {
            // Recharger le projet et donc les tâches lorsque le projet sélectionné change
            setCurrentProject(newProjectId);
        }
    );

</script>

<template>
    <Header />
    <section class="project-page">
        <div class="project-sideBar">
            <form @submit.prevent="handleSearch">
                <div class="search">
                <input type="search" class="searchBar" v-model="searchKey" placeholder="search...">
                <button class="searchBtn">
                    <img src="../assets/icons/search.png" alt="">
                </button>
                </div>
            </form> 
            <AddTaskBar />
            <div class="projectsList-ctn">
                <div class="projects-list" v-if="isProjectsLoading">
                    <Spinner />
                </div>
                <div class="projects-list" v-else>
                    <div class="collapsible" @click="open = !open">
                        Projects ({{ projects.length }})
                    </div>
                    
                    <div class="collapse-elem" v-show="open">
                    <div v-if="projects.length === 0" class="empty-message">
                        No projects found
                    </div>
                    <ul v-else>
                        <li v-for="project in projects" 
                            :key="project.project.projectref"
                            class="projName"
                            :class="{ current: selectedProjectId === project.project.projectref }">
                            <div class="data" @click="userStore.setCurrentProject(project.project.projectref)">
                                {{ project.project.projectname }}
                                <p class="project-desc">{{ project.project.projectdesc }}</p>
                            </div>
                        </li>
                    </ul>
                    </div>
                </div>
            </div>
        </div>
        <div class="main">
            <div v-if="isCurrentLoading">
                <Spinner />
            </div>
            <div class="main-ctn" v-else>
                <div class="proj-header">
                    <div class="proj-title">
                        <p v-if="userStore.currentProject.project">
                            {{ userStore.currentProject.project.projectname }} - {{ userStore.currentProject.project.projectref }}
                        </p>
                        <p v-else>No project selected</p>
                        </div>
                        
                        <div class="proj-team" v-if="userStore.currentProject.project && userStore.currentProject.team">
                            <div class="team">
                                <div class="left" v-if="!Array.isArray(userStore.currentProject.team) || userStore.currentProject.team.length === 0">No team set...</div>
                                <div class="left"  v-else>
                                    <div class="team-members">
                                        <img v-for="member in userStore.currentProject.team" 
                                            :key="member.collabref" 
                                            :src="member.user?.profilephotourl || '/src/assets/uploads/profiles/Default-avatar.png'" 
                                            :alt="member.user?.firstname"
                                            :title="`${member.user?.firstname} ${member.user?.lastname} - ${member.role}`">
                                    </div>
                                </div>
                                <div class="right">
                                    <button @click="showSubmenu" class="add-btn">Add Item</button>
                                    <div class="submenu" v-show="isSubmenuOpen">
                                        <ul>
                                            <li @click="addTask">Add Task</li>
                                            <li @click="manageTeam">Manage Team</li>
                                            <!--<li @click="addDocuments">Add Documents</li>-->
                                        </ul>
                                    </div>  
                                </div>
                            </div>
                        </div>
                        <div v-else class="proj-team">
                            <p>Select a project to view details</p>
                        </div>
                    <div class="proj-menu">
                        <ul>
                            <li @click="openOverview">Overview</li>
                            <li @click="openDashboard">Dashboard</li>
                            <li @click="openReport">Activity Report</li>
                            <li @click="openTasks">Tasks</li>
                        </ul>
                    </div>
                </div>
                <div class="overview-ctn" v-show="isOverviewOpen">
                    <div class="overview" v-if="userStore.currentProject.project">
                        <div class="details">
                            <div>
                                <h3>Description</h3>
                                <p v-if="userStore.currentProject.project&& userStore.currentProject.project.description">
                                    {{ userStore.currentProject.project.description }}
                                </p>
                                <p v-else>
                                    No description provided
                                </p>
                            </div>
                            
                            <div>
                                <h3>Project Client</h3>
                                <p v-if="userStore.currentProject.project.clientref">
                                    {{ userStore.currentProject.project.clientref }}
                                </p>
                                <p v-else>
                                    No client provided
                                </p>
                            </div>
                            <div>
                                <h3>Project Objectives</h3>
                                <p v-if="userStore.currentProject.project.objectives">
                                    {{ userStore.currentProject.project.objectives }}
                                </p>
                                <p v-else>
                                    No objectives provided
                                </p>
                            </div>
                            <div>
                                <h3>Expectations</h3>
                                <p v-if="userStore.currentProject.project.expected_results">
                                    {{ userStore.currentProject.project.expected_results }}
                                </p>
                                <p v-else>
                                    No expectations provided
                                </p>
                            </div>
                        </div>
                        <div class="estimations">
                            <div>
                                <h3>Start Date</h3>
                                <p v-if="userStore.currentProject.project.start_date">
                                    {{ userStore.currentProject.project.start_date.split('T')[0] }}
                                </p>
                                <p v-else>
                                    No start date provided
                                </p>
                            </div>
                            <div>
                                <h3> Deadline</h3>
                                <p v-if="userStore.currentProject.project.end_date">
                                    {{ userStore.currentProject.project.end_date.split('T')[0] }}
                                </p>
                                <p v-else>
                                    No start date provided
                                </p>
                            </div>
                            <div class="attachments">
                                <h3>Attachments</h3>
                                <div v-if="userStore.currentProject.project.attachments">
                                    <div v-for="file in userStore.currentProject.project.attachments" class="file" :key="file.fileRef">
                                        <p><a :href="file.fileUrl">{{ file.fileName }}</a></p>
                                    </div>
                                </div>
                                <p v-else>No attachments provided</p>
                            </div>
                        </div>
                    </div>
                    <div class="overview" v-else>
                        <p >
                            Select a project to view details
                        </p>
                    </div>
                    
                </div>
                <div class="dashboard-ctn" v-show="isDashboardOpen">
                    <h2>Project Dashboard</h2>
                    <p v-if="userStore.currentProject.project">
                        <div class="top">
                            <div class="nb-task">
                                <div class="nb-ongoing-tasks">
                                    <div v-if="userStore.currentProject.tasks">
                                        <h4>Ongoing Tasks</h4>
                                        <p>{{ userStore.currentProject.tasks.filter(task => task.status === 'ongoing').length }}</p>
                                    </div>
                                    <div v-else>
                                        <p>No ongoing tasks available</p>
                                    </div>
                                </div>
                                <div class="nb-completed-tasks">
                                    <div v-if="userStore.currentProject.tasks">
                                        <h4>Completed Tasks</h4>
                                        <p>{{ userStore.currentProject.tasks.filter(task => task.status === 'completed').length }}</p>
                                    </div>
                                    <div v-else>
                                        <p>No completed tasks available</p>
                                    </div>
                                </div>
                                <div class="nb-total-tasks">
                                    <div v-if="userStore.currentProject.tasks">
                                        <h4>Total Tasks</h4>
                                        <p>{{ userStore.currentProject.tasks.length }}</p>
                                    </div>
                                    <div v-else>
                                        <p>No tasks available</p>
                                    </div>
                                </div>
                            </div>
                            <div class="tasks-progression">
                                <div v-if="userStore.currentProject.tasks && userStore.currentProject.tasks.length > 0">
                                    <h4>Recent Tasks Progression</h4>
                                    <ul>
                                        <li v-for="task in userStore.currentProject.tasks.slice(-3).reverse()" :key="task.taskref">
                                            <p>{{ task.taskname }}</p>
                                            <div :class="{ 'progress-bar': true, completed: task.status === 'completed', ongoing: task.status === 'ongoing' }"> {{ task.status }} </div>
                                        </li>
                                    </ul>
                                </div>
                                <div v-else>
                                    <p>No tasks available</p>
                                </div>
                            </div>
                            <div class="completion-ratio">
                                <h4>Project Completion Ratio</h4>
                                <div class="progress-ratio">
                                    <div 
                                        class="progress"
                                        :style="{
                                            width: userStore.currentProject.tasks && userStore.currentProject.tasks.length > 0 
                                                ? `${(userStore.currentProject.tasks.filter(t => t.status === 'completed').length / userStore.currentProject.tasks.length) * 100}%` 
                                                : '0%',
                                            backgroundColor: userStore.currentProject.tasks && userStore.currentProject.tasks.length > 0
                                                ? getProgressColor((userStore.currentProject.tasks.filter(t => t.status === 'completed').length / userStore.currentProject.tasks.length) * 100)
                                                : '#e0e0e0'
                                        }"
                                    ></div>

                                </div>
                                <p>{{ userStore.currentProject.tasks && userStore.currentProject.tasks.length > 0 ? ((userStore.currentProject.tasks.filter(task => task.status === 'completed').length / userStore.currentProject.tasks.length) * 100).toFixed(2) : 0 }}% Complete</p>
                            </div>
                            
                        </div>
                        <div class="bottom">
                            <div class="bottom-header">
                                <p>Task Name</p>
                                <p>Status</p>
                                <p>Start Date</p>
                                <p>End Date</p>
                            </div>
                            <div v-if="userStore.currentProject.tasks && userStore.currentProject.tasks.length > 0" class="tasks-list">
                                <ul>
                                    <li v-for="task in userStore.currentProject.tasks" :key="task.taskref">
                                        <p>{{ task.taskname }}</p>
                                        <p>{{ task.status }}</p>
                                        <p>{{ task.startDate }}</p>
                                        <p>{{ task.endDate }}</p>
                                    </li>
                                </ul>
                            </div>
                            <div v-else>
                                <p>No tasks available</p>
                            </div>
                        </div>
                    </p>
                    <p v-else>
                        Select a project to view details
                    </p>
                </div>
                <div class="report-ctn" v-show="isReportOpen">
                    <h2>Project Activity Report</h2>
                    <div v-if="userStore.currentProject.project">
                        <ProjectProgressChart />
                    </div>
                    <p v-else>
                        Select a project to view details
                    </p>
                </div>
                <div class="tasks-ctn" v-show="isTasksOpen">
                    <h2>Project Tasks</h2>
                    <div v-if="userStore.currentProject.project">
                        <div class="head">
                            <div class="tabs">
                                <div class="tab-items">
                                    <div :class="{ 't-item': true, 'active': isListTabActive }" @click="openListView">List</div>
                                    <div :class="{ 't-item': true, 'active': isKanbanTabActive }"@click="openKanbanView">Kanban</div>
                                    <div :class="{ 't-item': true, 'active': isTimelineTabActive }" @click="openTimelineView">Timeline</div>
                                    <div :class="{ 't-item': true, 'active': isGanttTabActive }" @click="openGanttView">Gantt</div>
                                </div>
                            </div>
                            <div class="exportation">
                                <button>Export</button>
                            </div>
                        </div>
                        <div class="body">
                            <div class="view">
                                <div v-show="isListTabActive">
                                    <div class="list-header">
                                        <div class="caption">Tasks</div>
                                        <div class="caption">Assignees</div>
                                        <div class="caption">start</div>
                                        <div class="caption">Deadline</div>
                                    </div>
                                    <div class="list-elem">
                                        <div v-for="task in userStore.currentProject.tasks" :key="task.taskRef" class="task-details">
                                            <div class="elem">{{task.taskname}}
                                                <select @change="assignMemberToTask(task.taskref, $event.target.value)" class="assign">
                                                <option value="">Assign</option>
                                                <option v-for="member in userStore.currentProject.team" 
                                                        :value="JSON.stringify({ userRef: member.user.userref, collabRef: member.collabref })"
                                                        :key="member.collabref">
                                                    {{ member.user.firstname }} {{ member.user.lastname }}
                                                </option>
                                            </select>
                                            </div>
                                            <div class="elem assignees">
                                                <template v-for="assignment in userStore.currentProject.assignments" :key="assignment.assref">
                                                    <img v-if="assignment.taskref === task.taskref" 
                                                        :src="assignment.user?.profilephotourl || '/src/assets/uploads/profiles/Default-avatar.png'"
                                                        :alt="assignment.user?.firstname"
                                                        :title="`${assignment.user?.firstname} ${assignment.user?.lastname}`"
                                                        class="assignee-avatar">
                                                </template>
                                            </div>
                                            <div class="elem">{{task.startdate.split('T')[0]}}</div>
                                            <div class="elem">{{task.enddate.split('T')[0]}}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="view kb">
                                <div v-show="isKanbanTabActive">
                                    <div class="states pend">
                                        <h3>To Do</h3>
                                        <div v-for="task in userStore.currentProject.tasks" :key="task.taskref" class="task-card">
                                            <div class="elem" v-if="task.status==='pending'">
                                                <div class="elem-title">{{task.taskname}}</div>
                                                <div class="elem-status"> 
                                                    <p class="status">{{task.status}}</p> <p class="remain">{{ calculateTimeRemaining(task.startDate, task.endDate) }} remaining</p>
                                                </div>
                                                <div class="elem-members">
                                                    <img v-for="assignment in currentProject.assignments" 
                                                    v-if="assignment.taskref===task.taskref"
                                                        :key="assignment.assref"
                                                        :src="assignment.user?.profilephotourl || '../assets/images/default-avatar.png'"
                                                        :alt="assignment.user?.firstname"
                                                        :title="`${assignment.user?.firstname} ${assignment.user?.lastname}`"
                                                        class="assignee-avatar">
                                                </div>
                                                <button class="btn" @click="setTaskStatus(ongoing, task.taskref)">Start</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="states prog">
                                        <h3>In Progress</h3>
                                        <div v-for="task in userStore.currentProject.tasks" :key="task.taskref" class="task-card">
                                            <div class="elem" v-if="task.status==='ongoing'">
                                                <div class="elem-title">{{task.taskname}}</div>
                                                <div class="elem-status"> 
                                                    <p class="status">{{task.status}}</p> <p class="remain">{{ calculateTimeRemaining(task.startdate, task.enddate) }} remaining</p>
                                                </div>
                                                <div class="elem-members">{{task.taskname}}</div>
                                                <button class="btn" @click="setTaskStatus(completed, task.taskref)">Mark as Completed</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="states compl">
                                        <h3>Completed</h3>
                                        <div v-for="task in userStore.currentProject.tasks" :key="task.taskref" class="task-card">
                                            <div class="elem" v-if="task.status==='completed'">
                                                <div class="elem-title">{{task.taskname}}</div>
                                                <div class="elem-status"> 
                                                    <p class="status">{{task.status}}</p> <p class="remain">{{ calculateTimeRemaining(task.startDate, task.endDate) }} remaining</p>
                                                </div>
                                                <div class="elem-members">{{task.taskname}}</div>
                                                <button class="btn" @click="setTaskStatus(verified, task.taskref)">Verify</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="states val">
                                        <h3>Validated</h3>
                                        <div v-for="task in userStore.currentProject.tasks" :key="task.taskref" class="task-card">
                                            <div class="elem" v-if="task.status==='validated'">
                                                <div class="elem-title">{{task.taskname}}</div>
                                                <div class="elem-status"> 
                                                    <p class="status">{{task.status}}</p> <p class="remain">{{ calculateTimeRemaining(task.startdate, task.enddate) }} remaining</p>
                                                </div>
                                                <div class="elem-members">{{task.taskname}}</div>
                                                <button class="btn">Completed</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class=" view tl" v-show="isTimelineTabActive">
                                <div class="calendar-container" ref="calendarContainer">
                                    <div
                                        v-for="day in daysInYear"
                                        :key="day.date.toISOString()"
                                        class="calendar-day"
                                        :class="{ 'task-day': day.hasTask }"
                                        @mouseover="handleDayHover(day, $event)"
                                        @mouseleave="hoveredTaskDetails = null"
                                    ></div>

                                    <div class="task-details" :style="{ 
                                            left: hoveredTaskDetails ? hoveredTaskDetails.x + 'px' : '0px', 
                                            top: hoveredTaskDetails ? hoveredTaskDetails.y + 'px' : '0px',
                                            display: hoveredTaskDetails ? 'block' : 'none' 
                                        }">
                                        <ul v-if="hoveredTaskDetails">
                                            <li v-for="task in hoveredTaskDetails.tasks" :key="task.taskref">
                                                {{ task.taskname }} - {{ task.status }}
                                            </li>
                                            <li >
                                                {{ hoveredTaskDetails.date }}
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="years-sidebar">
                                        <div
                                            v-for="year in displayedYears"
                                            :key="year"
                                            class="year-item"
                                            :class="{ 'current-year': year === currentYear }"
                                        >
                                        {{ year }}
                                        </div>
                                    </div>
                            </div>
                            
                            <div class="view gt" v-show="isGanttTabActive">
                                <div class="gantt-container" :style="{ '--days-count': daysInMonth.length }">
                                    <!-- Label du mois -->
                                    <div class="gantt-month-label">
                                        {{ new Date(currentYear, currentMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) }}
                                    </div>

                                    <!-- Ligne des jours du mois -->
                                    <div class="gantt-header">
                                        <div
                                        v-for="day in daysInMonth"
                                        :key="day.date"
                                        class="gantt-day-header"
                                        >
                                        {{ day.number }}<br /><small>{{ day.day }}</small>
                                        </div>
                                    </div>


                                    <!-- Lignes des tâches -->
                                    <div class="gantt-task-row" v-for="task in userStore.currentProject.tasks" :key="task.taskref">
                                        <div class="task-name">{{ task.taskname }}</div>
                                        <div class="task-bar-container">
                                            <div class="task-bar" :style="getTaskStyle(task)"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p v-else>
                        Select a project to view details
                    </p>
                </div>
            </div>
            <div class="main-ctn-setup">
                <div class="proj-header">
                    <h3>Project Setup</h3>
                    <p>Modifiez les paramètres du projet</p>
                    <button>Modifier le projet</button>
                </div>
            </div>
            <div class="main-ctn-danger">
                <div class="proj-header">
                    <h3>Danger Zone</h3>
                    <p>Toutes vos données seront perdues. Cette opération est irréversible!</p>
                    <button>Supprimer le projet</button>
                </div>
            </div>
        </div>
        <div class="addTask-form" v-show="isTaskFormOpen">
            <div class="task-form" v-show="isTaskFormOpen">
                <h3>Add Task</h3>
                <form @submit.prevent="submitTask">
                    <input type="text" placeholder="Task Name" v-model="newTaskName" required>
                    <input type="text" placeholder="Task Description" v-model="newTaskDesc" required>
                    <label for="start">Start</label>
                    <input type="date" name = "start" placeholder="Start Date" v-model="newTaskStart" required>
                    <label for="end">Deadline</label>
                    <input type="date" name="end" placeholder="End Date" v-model="newTaskEnd" required>
                    <div class="btn-ctn">
                        <button type="submit" class="submit-btn" @click="submitTask">Add</button>
                        <button type="button" @click="isTaskFormOpen = !isTaskFormOpen" class="cancel-btn">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
        <div class="team-form" v-show="isTeamFormOpen && userStore.currentProject.project && userStore.currentProject.team">
            <button class="close-btn" @click="isTeamFormOpen = false">
                <img src="../assets/icons/plus.png" alt="">
            </button>
            <div class="members-list">
                <h2>Your team</h2>
                <!-- Vérification plus robuste -->
                <div v-if="!Array.isArray(userStore.currentProject.team) || userStore.currentProject.team.length === 0">
                    <p>No member in the team...</p>
                </div>
                <div v-else>
                    <div v-for="member in userStore.currentProject.team" 
                        :key="member.collabRef" 
                        class="member-item">
                        <img :src="member.user?.profilePhotoUrl || '../assets/images/default-avatar.png'" 
                            class="member-avatar">
                        <div class="member-info">
                            <p class="member-name">
                                {{ member.user?.firstname || 'Unknown' }} 
                                {{ member.user?.lastname || 'User' }}
                            </p>
                            <p class="member-role">{{ member.role || 'No role' }}</p>
                        </div>
                        <button class="remove-btn" @click="">Remove</button>
                    </div>
                </div>
            </div>
                
            <h2>Add a member</h2>
            <div class="team-search-section">
                <p>Invite members to join your team</p>
                <input type="text" v-model="searchMember" placeHolder="Enter email address..." class="project-input" />
                <button class="build-btn" @click="searchMemberByEmail(searchMember)">Search <div><img src="../assets/icons/search.png" alt=""></div></button>
            </div>
            <div class="member-research-result">
                <div v-if="isMembersLoading" class="member-card">
                    <Spinner/>
                </div>
                
                <div v-else-if="foundMember" class="member-card">
                    <img :src="foundMember.profilePhotoUrl || '../assets/images/default-avatar.png'" class="member-image">
                    <div class="member-info">
                        <h3>{{ foundMember.firstname }} {{ foundMember.lastname }}</h3> 
                        <p>{{ foundMember.email }}</p>
                    </div>
                    <button class="invite-btn" @click="addToTeam(foundMember.email, userStore.currentProject.project.projectref)">
                        Add to Team
                    </button>
                </div>

                <div v-else-if="searchMember && !isMembersLoading" class="no-result">
                    <p>No employee found with this email in your company.</p>
                </div>
            </div>
        </div>
        <Alert type="danger" action="error" v-if="errors"/>
        <Alert type="success" action="added" v-if="success"/>
    </section>
</template>

<style scoped>
    .project-page{
        position: relative;
        width: 100%;
        display: flex;
        justify-content: space-between;

        @media (max-width: 768px) {
            flex-direction: column;
            align-items: center;
            
        }

        .project-sideBar{
            position: absolute;
            left: 1%;
            top: 5%;
            padding: 20px;
            width: 25%;

            @media (max-width: 768px) {
                width: 100%;
                margin-bottom: 20px;
            }

            .search{
                display: flex;
                gap: 0;
                justify-content: center;
                width: 100%;
                margin-bottom: 7px;

                input{
                    flex: 1; 
                    padding: 8px 12px; 
                    border-top-left-radius: 6px;
                    border-bottom-left-radius: 6px;
                    border: 1px solid #ddd;
                }
                button{
                    width: 40px;
                    border-top-right-radius: 6px;
                    border-bottom-right-radius: 6px;
                    border: none;
                    background-color: #c2dff8;
                    font-weight: 700;
                    cursor: pointer;
                    img{
                        width: 20px;
                        height: 20px;
                    }
                }
            }
            .createBtn{
                border-radius: 5px;
                border: none;
                margin-left:10px;
                background-color: #c2dff8;
                color: #004581;
                font-weight: 700;
                cursor: pointer;
                img{
                    width: 20px;
                    height: 20px;
                }
            }
            .projectsList-ctn{
                background-color: #c2dff83a;

                @media (max-width: 768px) {
                    margin-top: 20px;
                }

                .projects-list{
                    padding-top: 15px;

                    .refresh{
                        cursor: pointer;
                        padding: 10px;
                        background: #f0f0f0;
                        margin-bottom: 5px;
                        text-align: center;
                    }
                    .collapsible {
                        cursor: pointer;
                        padding: 10px;
                        background: #f0f0f0;
                        margin-bottom: 5px;
                        box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
                    }

                    .collapse-elem {
                        padding: 10px;
                        background: #f8f8f8;
                        height: 50vh;
                        width: 350px;
                        border-radius: 13px;
                        box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);
                        overflow-y: scroll;
                        scrollbar-width: none;
                        -ms-overflow-style: none;
                        
                        &::-webkit-scrollbar {
                            display: none;
                        }

                        @media (max-width: 768px) {
                            position: absolute;
                            left: 0;
                            top: 40%;
                            width: 100vw;
                            height: 60vh;
                            overflow-y: scroll;
                            font-size: 0.9rem;
                            transition: all .3s ease-in-out;
                            z-index: 10;
                            animation: open .5s ease-in-out;
                        }

                        @keyframes open {
                            from {
                                opacity: 0;
                                height: 0;
                            }
                            to {
                                opacity: 1;
                                height: 60vh;
                            }
                        }
                    }

                    .projName {
                        list-style: none;
                        padding: 8px;
                        margin: 4px 0;
                        border-left: 3px solid #505181;
                        cursor: default;
                    }

                    .projName.current {
                        background-color: #e0e0ff;
                    }

                    .empty-message {
                        padding: 10px;
                        color: #666;
                        font-style: italic;
                    }

                    .project-desc {
                        font-size: 0.7em;
                        color: #666;
                        margin-top: 4px;

                        @media (max-width: 768px) {
                            display: none;
                        }
                    }

                }
            }

        }
        .main{
            width: 100%;
            .main-ctn{
                width: 100%;
                background: white; 
                border-radius: 15px; 
                padding: 1.5rem; 
                margin-bottom: 2rem;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                .proj-header{
                    margin-left: 28%;
                    background: #f8fafc; 
                    padding: 1rem; 
                    border-radius: 10px; 
                    margin-bottom: 2rem;
                    border: 1px dashed #cbd5e1;
                    .proj-title{
                        width: 100%;

                        p{
                            margin: 0;
                            font-weight: bold;
                            font-size: 1rem;
                            padding: 5px;

                            @media (max-width: 768px) {
                                font-size: 0.9rem;
                            }
                        }
                    }
                    .proj-team{
                        width: 100%;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 5px;
                        font-size: 0.8rem;
                        color: #505181;

                        .team{
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            width:100%;

                            .left{
                                display: flex;
                                justify-content: flex-start;
                                align-items: center;
                                gap: 20px;
                                width: 70%;
                                padding: 15px;

                                @media (max-width: 768px) {
                                    width: 55%;
                                    gap: 10px;
                                }
                                .team-members{
                                    min-width: 300px;
                                    display: flex;
                                    gap: 5px;

                                    img{
                                        background-color:#004581;
                                        width: 30px;
                                        height: 30px;
                                        border-radius: 50%;

                                        @media (max-width: 768px){
                                            width: 20px;
                                            height: 20px;
                                        }
                                    }
                                }
                            }

                            
                            .right{
                                display: flex;
                                justify-content: flex-end;
                                width: 30%;
                                padding:15px;
                                position : relative;
                                
                                @media (max-width: 768px) {
                                    width: 45%;
                                }

                                button{
                                    width: 150px;
                                    font-weight: 700;
                                    cursor: pointer;
                                    padding: 12px; 
                                    border-radius: 8px; 
                                    cursor: pointer;

                                    @media (max-width: 768px) {
                                        width: 80px;
                                        font-size: 0.7rem;
                                    }
                                }
                                .submenu{
                                    position: absolute;
                                    width: 200px;
                                    background-color: #c2dff8;
                                    box-shadow: 0 0 100px rgba(0, 0, 0, 0.4);
                                    z-index: 1;
                                    border-radius: 5px;
                                    padding: 0;
                                    padding-top: 10px;
                                    padding-right: 10px;
                                    top: 60px;
                                    right: 15px;

                                    @media (max-width:768px){
                                        width: 80vw;

                                    }

                                    ul{
                                        padding: 0;
                                        li{
                                            list-style: none;
                                            width: 100%;
                                            color: #505181;
                                            margin:0;
                                            padding-left: 10px;
                                            padding-top: 5px;
                                            padding-bottom: 5px;
                                            border-bottom: 2px solid #6666666b;
                                            &:hover{
                                                background-color: #6666666b;
                                                cursor: pointer;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                    }
                    .proj-menu{
                        width: 100%;
                        display: flex;
                        justify-content: flex-end;
                        align-items: center;
                        padding: 5px;
                        font-size: 0.8rem;
                        color: #505181;
                        margin-bottom: 0;

                        @media(max-width: 768px){
                            font-size: 0.6rem;
                        }

                        ul{
                            display: flex;
                            gap: 30px;
                            list-style: none;
                            padding-left: 0;
                            margin-bottom: 0;

                            li{
                                height: 20px;
                                font-weight: bold;
                                padding-bottom: 5px;
                                cursor: pointer;
                                margin-bottom: 0;
                                &:hover{
                                    border-bottom: 4px solid #505181;
                                }
                            }
                        }
                    }
                }
                .overview-ctn{
                    width: 100%;
                    .overview{
                        width:100%;
                        display: flex;
                        justify-content: space-between;
                        gap: 10px;

                        @media (max-width: 768px){
                            flex-direction: column;
                        }

                        .details{
                            width: 50%;
                            padding: 10px;

                            @media (max-width: 768px){
                                width: 100%;
                            }

                            div{
                                width: 100%;
                                display: flex;
                                justify-content: space-between;
                                border-bottom: 2px solid #9da6e0;
                                padding: 5px 0;

                                h3{
                                    font-size: 0.8rem;
                                }
                                p{
                                    font-size: 0.7rem;
                                    padding: 0 10px;
                                }
                            }
                        }
                        .estimations{
                            width: 50%;
                            border-left: 2px solid #6666667e;
                            padding: 10px;

                            @media (max-width: 768px){
                                width: 100%;
                                border-left: none;
                            }

                            div{
                                width: 100%;
                                display: flex;
                                justify-content: space-between;
                                border-bottom: 2px solid #9da6e0;
                                padding: 5px 0;

                                h3{
                                    font-size: 0.8rem;
                                }
                                p{
                                    font-size: 0.7rem;
                                }
                            }
                            .attachments{
                                width: 90%;
                                display: flex;
                                justify-content: space-between;
                                border: 2px solid #9da6e0;
                                padding: 10px;
                                margin: 20px;
                                border-radius: 8px;
                                div{
                                    width: 100%;
                                    display: flex;
                                    justify-content: space-between;
                                    flex-wrap: wrap;
                                    padding: 5px 0;
                                    
                                    h3{
                                        font-size: 0.8rem;
                                    }
                                    p{
                                        font-size: 0.7rem;
                                    }
                                    .file{
                                        width: 100%;
                                        display: flex;
                                        justify-content: space-between;
                                        padding: 5px 0;
                                        border-bottom: 2px solid #9da6e0;
                                        margin-bottom: 5px;
                                        
                                        h3{
                                            font-size: 0.8rem;
                                        }
                                        p{
                                            font-size: 0.7rem;
                                        }
                                    }
                                }

                                h3{
                                    font-size: 0.8rem;
                                }
                                p{
                                    font-size: 0.7rem;
                                    width: 80%;
                                    overflow-wrap: break-word;
                                    word-wrap: break-word;
                                    word-break: break-all;
                                    white-space: normal;
                                }
                            }
                        }
                    }
                }
                .dashboard-ctn{
                    .top{
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 10px;
                        padding: 10px;

                        @media (max-width: 768px){
                            flex-direction: column;
                        }
                        .nb-task{
                            width: 30%;
                            height: 250px;
                            border-radius: 12px;
                            border: 1px solid #50518183;
                            background-color: #fff;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);

                            @media (max-width: 768px){
                                width: 100%;
                            }
                            .nb-ongoing-tasks,
                            .nb-completed-tasks,
                            .nb-total-tasks{
                                margin: 10px;
                                width: 90%;
                                padding: 10px;
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                border-bottom: 1px solid;

                                @media (max-width: 768px){
                                    flex-direction: row;
                                    justify-content: space-between;
                                }

                                h4{
                                    margin: 0;
                                    font-size: 0.8rem;
                                    color: #505181;
                                }
                                p{
                                    margin: 0;
                                    padding-left: 5px;
                                    font-size: 1.2rem;
                                    font-weight: bold;
                                    color: #004581;
                                }
                            }
                        }

                        .tasks-progression{
                            width: 30%;
                            height: 250px;
                            padding: 8px;
                            border-radius: 12px;
                            border: 1px solid #50518183;
                            background-color: #fff;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);

                            @media (max-width: 768px){
                                width: 100%;
                            }
                            div{
                                h4{
                                    margin: 0;
                                    font-size: 0.8rem;
                                    color: #505181;
                                }
                                ul{
                                    li{
                                        display: flex;
                                        justify-content: space-between;
                                        gap: 10px;
                                        margin: 0;
                                        padding-left: 5px;
                                        font-size: 0.8rem;
                                        font-weight: bold;
                                        color: #004581;
                                        .progress-bar{
                                            padding: 10px;
                                            width: 65px;
                                            height: 20px;
                                            border-radius: 5px;
                                        }
                                        .progress-bar.ongoing{
                                            border: 1px solid #004581;
                                            color: #004581
                                        }
                                        .progress-bar.completed{
                                            border: 1px solid #4caf50;
                                            color: #4caf50;
                                        }
                                    }
                                }
                            }
                        }
                        .completion-ratio{
                            width: 30%;
                            height: 250px;
                            padding: 8px;
                            border-radius: 12px;
                            border: 1px solid #50518183;
                            background-color: #fff;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
                            @media (max-width: 768px){
                                width: 100%;
                            }
                            h4{
                                margin: 0;
                                font-size: 0.8rem;
                                color: #505181;
                            }
                            .progress-ratio{
                                margin: 10px;
                                width: 90%;
                                height: 60px;
                                border-radius: 7px;
                                padding:0;
                                background-color: #e0e0ff;
                                overflow: hidden;
                                .progress{
                                    margin:0;
                                    height: 100%;
                                }
                            }
                            p{
                                margin: 0;
                                padding-left: 5px;
                                font-size: 1.5rem;
                                font-weight: bold;
                                color: #004581;
                            }
                        }
                    }
                    .bottom{
                        width: 97%;
                        margin-top: 15px;
                        padding: 5px 15px;
                        background-color: #fff;
                        border-radius: 15px;
                        border: 1px solid #50518183;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);

                        h3{margin: 0;
                            font-size: 1.2rem;
                            color: #505181;
                        }
                        .bottom-header{
                            padding-right: 15px;
                            margin: 0;
                            width: 100%;
                            display: flex;
                            justify-content: space-between;
                            border-bottom: 1px solid #50518183;
                            p{
                                font-size: 0.8rem;
                                font-weight: bold;
                                width: 25%;
                                text-align: center;
                            }
                        }
                        .tasks-list{
                            padding-right: 15px;
                            margin: 0;
                            width: 100%;
                            ul{
                                width: 100%;
                                padding: 0;

                                li{
                                    list-style: none;
                                    width: 100%;
                                    padding-right: 15px;
                                    margin: 0;
                                    width: 100%;
                                    display: flex;
                                    justify-content: space-between;
                                    border-bottom: 1px solid #50518183;
                                    p{
                                        font-size: 0.8rem;
                                        width: 25%;
                                        border-right: 1px solid #50518183;
                                        padding-left: 10px;
                                        text-align: center;
                                    }
                                }
                            }
                        }
                    }
                    
                }
                .tasks-ctn{
                    h2{
                        font-size: 1.2rem;
                    }
                    div{
                        width: 100%;

                        .head{
                            display: flex;
                            justify-content: space-between;
                            gap: 20px;
                            border: 1px solid #6666666b;
                            border-left: none;
                            border-right: none;

                            .tabs{
                                width: 50%;
                                display: flex;
                                justify-content: space-between;

                                @media (max-width: 768px){
                                    width: 100%;
                                }
                                .tab-items{
                                    width: 70%;
                                    display: flex;
                                    justify-content: space-between;
                                    border: 2px solid #004581;
                                    border-radius: 12px;
                                    margin: 10px;
                                    padding:0;
                                    overflow: hidden;
                                    @media (max-width: 768px){
                                        width: 100%;
                                        border: 1px solid #004581;
                                    }
                                    .t-item{
                                        color: #505181;
                                        text-align: center;
                                        border: 1px solid;
                                        margin: 0;

                                        @media (max-width: 768px){
                                            width: 100%;
                                            font-size: 0.7rem;
                                        }

                                        &:hover{
                                            background-color: #004581;
                                            color: #eee;
                                            border: none;
                                            cursor: pointer;
                                        }
                                    }
                                    .t-item.active{
                                        background-color: #004581;
                                        color: #eee;
                                        border: none;
                                    }
                                }
                            }
                            .exportation{
                                width: 50%;
                                display: none;
                                justify-content: center;
                                align-items: center;

                                button{
                                    background-color: #004581;
                                    color: #eee;
                                    border: none; 
                                    padding: 12px; 
                                    border-radius: 8px; 
                                    cursor: pointer;
                                }
                            }
                        }
                        .body{
                            width: 100%;

                            @media (max-width: 768px){
                                overflow-x: scroll;
                                overflow-y:hidden;
                            }
                            .view{
                                width: 100%;
                                @media (max-width: 768px){
                                    width: 840px;
                                }
                                div{
                                    width: 100%;
                                    .list-header{
                                        width: 100%;
                                        display: flex;
                                        justify-content: space-between;
                                        background-color: #66666627;
                                        font-weight: bold;
                                        .caption{
                                            width: 25%;
                                            text-align: center;
                                        }
                                    }
                                    .list-elem{
                                        width: 100%;
                                        .task-details{
                                            width: 100%;
                                            display: flex;
                                            justify-content: space-between;
                                            .elem{
                                                width: 25%;
                                                height: 30px;
                                                text-align: center;
                                                font-size: 0.8rem;
                                                color:#666;
                                                text-align: left;
                                                border-bottom: 1px solid #66666627;
                                                border-right: 1px solid #66666627;
                                                select{
                                                    width: 100px;
                                                    height: 20px;
                                                    margin-left: 20px;
                                                    border: 1px solid #0897e9;
                                                    border-radius: 10px;
                                                    color: #0897e9;

                                                    @media (max-width: 768px){
                                                        width: 50px;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            .view.kb{
                                width: 100%;
                                @media (max-width: 768px){
                                    width: 400vw;
                                }
                                div{
                                    width: 100%;
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: flex-start;
                                    gap: 20px;
                                    .states{
                                        flex-direction: column;
                                        width: 20%;
                                        border-radius: 10px;
                                        height: 50vh;
                                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
                                        background-color: #eee;
                                        padding: 20px;
                                        padding-top: 5px;
                                        margin-top: 20px;
                                        overflow-y: scroll;
                                        overflow-x: hidden;
                                        scrollbar-width: none;
                                        -ms-overflow-style: none;
                                        
                                        &::-webkit-scrollbar {
                                            display: none;
                                        }

                                        @media (max-width: 768px){
                                            width: 70vw;
                                        }

                                        h3{
                                            width: 100%;
                                            font-size:1rem;
                                            text-align: left;
                                            color: #666;
                                            padding-left: 20px;
                                        }
                                        .elem{
                                            width: 100%;
                                            margin: 10px;
                                            padding: 10px;
                                            flex-direction: column;
                                            justify-content: center;
                                            align-items: center;
                                            background-color: #fff;
                                            border-radius: 10px;
                                            color: #6b6666;
                                            border: 1px solid rgba(107, 102, 102, 0.3);

                                            .elem-title{
                                                font-weight: bold;
                                                text-align: center;
                                            }
                                            .remain{
                                                border: 1px solid #413f3d;
                                                border-radius: 8px; 
                                                color: #413f3d;
                                                font-size: 0.7rem;
                                                background-color:rgba(65, 63, 61, 0.1);
                                                padding: 5px; 
                                            }
                                            
                                        }
                                    }
                                    .pend{
                                        border: 1px solid #e98708;
                                        border-top: 10px solid #e98708;
                                        .status{
                                            border: 2px solid #e98708;
                                            background-color:rgba(233, 136, 8, 0.33);
                                            border-radius: 8px;
                                            padding: 5px; 
                                            font-size: 0.7rem;
                                        }
                                        .btn{
                                            width: 100%;
                                            height: 30px;
                                            border: none;
                                            border-radius: 8px;
                                            background-color: #0817e9;
                                            cursor: pointer;
                                        }
                                    }
                                    .prog{
                                        border: 1px solid #0817e9;
                                        border-top: 10px solid #0817e9;
                                        .status{
                                            border: 2px solid #0817e9;
                                            background-color:rgba(8, 23, 233, 0.35);
                                            border-radius: 6px; 
                                            padding: 5px; 
                                            font-size: 0.7rem;
                                        }
                                        .btn{
                                            width: 100%;
                                            height: 30px;
                                            border: none;
                                            border-radius: 6px;
                                            background-color: #3ce908;
                                            cursor: pointer;
                                        }
                                    }
                                    .compl{
                                        border: 1px solid #3ce908;
                                        border-top: 10px solid #3ce908;
                                        .status{
                                            border: 2px solid #3ce908;
                                            background-color:rgba(60, 233, 8, 0.37);
                                            border-radius: 8px; 
                                            padding: 5px; 
                                            font-size: 0.7rem;
                                        }
                                        .btn{
                                            width: 100%;
                                            height: 30px;
                                            border: none;
                                            border-radius: 6px;
                                            background-color: #f8e912;
                                            cursor: pointer;
                                        }
                                    }
                                    .val{
                                        border: 1px solid #f8e912;
                                        border-top: 10px solid #f8e912;
                                        .status{
                                            border: 2px solid #f8e912;
                                            background-color:rgba(248, 233, 18, 0.34);
                                            border-radius: 8px; 
                                            padding: 5px; 
                                            font-size: 0.7rem;
                                        }
                                        .btn{
                                            width: 100%;
                                            height: 30px;
                                            border-radius: 6px;
                                            border:1px solid #f8e912;
                                        }
                                    }
                                }
                                
                            }
                            .view.tl{
                                width: 98%;
                                display: flex;
                                justify-content: center;
                                gap: 10px;
                                .calendar-container {
                                    display: grid;
                                    grid-template-columns: repeat(53, 15px); /* 53 colonnes pour les semaines */
                                    grid-auto-rows: 15px;
                                    gap: 2px;
                                    width: fit-content;
                                    margin: 20px auto;
                                    position: relative;

                                    .calendar-day {
                                        background-color: #e0f2f1;
                                        border-radius: 2px;
                                        cursor: pointer;

                                        &.task-day {
                                            background-color: #fde68a;
                                        }
                                    }

                                    .task-details {
                                        position: absolute;
                                        width: 460px;
                                        color:#646566;
                                        background-color: white;
                                        border: 1px solid #ccc;
                                        box-shadow: 0 0 10px rgba(0,0,0,0.2);
                                        padding: 10px;
                                        z-index: 10;
                                        font-size: 0.8em;

                                        ul {
                                            list-style-type: none;
                                            padding: 0;
                                            margin: 0;

                                            li {
                                                margin-bottom: 5px;
                                            }
                                        }
                                    }
                                }
                                .years-sidebar {
                                            display: flex;
                                            flex-direction: column;
                                            align-items: flex-start;
                                            padding-top: 20px;
                                            width: 15%;

                                            .year-item {
                                                font-size: 1em;
                                                color: #555;
                                                margin-bottom: 5px;
                                                padding: 5px 10px;
                                                border-radius: 4px;

                                                &.current-year {
                                                    background-color: #e0f7fa;
                                                    color: #00acc1;
                                                    font-weight: bold;
                                                }
                                            }
                                        }
                                }

                                .view.gt{
                                   .gantt-container {
                                        display: flex;
                                        flex-direction: column;
                                        width: 100%;

                                        .gantt-month-label {
                                            text-align: center;
                                            font-weight: bold;
                                            margin-bottom: 10px;
                                            text-transform: capitalize;
                                            font-size: 0.9em;
                                            }

                                        .gantt-header {
                                            display: grid;
                                            grid-template-columns: repeat(var(--days-count), 1fr);
                                            gap: 1px;
                                            width: 80%;
                                            margin-left: 20%;

                                            .gantt-day-header {
                                                background-color: #ececec;
                                                text-align: center;
                                                font-size: 0.7em;
                                                padding: 4px 0;
                                            }
                                        }

                                       .gantt-task-row {
                                            display: flex;
                                            align-items: center;
                                            gap: 0;
                                            border-bottom: 1px solid rgba(54, 54, 54, 0.37);

                                            .task-name {
                                                width: 20%; 
                                                flex-shrink: 0;
                                                text-align: right;
                                                font-size: 0.9em;
                                                font-weight: 400;
                                                background-color: #004581;
                                                color: #eee;
                                            }

                                            .task-bar-container {
                                                flex: 1;
                                                display: grid;
                                                grid-template-columns: repeat(var(--days-count), 1fr);
                                                gap: 1px;
                                                width: 80%;

                                                .task-bar {
                                                grid-column-start: calc(var(--offset) + 1);
                                                grid-column-end: calc(var(--offset) + var(--duration) + 1);
                                                background-color: #4caf50;
                                                height: 20px;
                                                border-radius: 4px;
                                                }
                                            }
                                            }

                                    }
                                }
                            }
                            }
                        }
                    }
                    .main-ctn-setup{
                        width: 100%;
                        background: white; 
                        border-radius: 15px; 
                        padding: 1.5rem; 
                        margin-bottom: 2rem;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.05);

                        .proj-header{
                            margin-left: 28%;
                            background: #f8fafc; 
                            padding: 1rem; 
                            border-radius: 10px; 
                            margin-bottom: 2rem;
                            border: 1px dashed #cbd5e1;
                        }
                        button{
                             background: #056b8a; 
                             color: #eee;
                             border: none;
                             padding: 12px; 
                             border-radius: 8px; 
                             cursor: pointer;
                        }
                    }
                    .main-ctn-danger{
                        width: 100%;
                        background: white; 
                        border-radius: 15px; 
                        padding: 1.5rem; 
                        box-shadow: 0 10px 25px rgba(252, 25, 25, 0.05);

                        .proj-header{
                            margin-left: 28%;
                            background: #ffd9cfff; 
                            color: #5a0e01ff;
                            padding: 1rem; 
                            border-radius: 10px; 
                            margin-bottom: 2rem;
                            border: 1px dashed #cbd5e1;
                        }
                        button{
                             background: #fc2414ff; 
                             border: none; 
                             padding: 12px; 
                             border-radius: 8px; 
                             cursor: pointer;
                        }
                    }
                }
            }
                
        
    
        .assignees {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
        }

        .assignee-avatar {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .assignee-avatar:hover {
            transform: scale(1.1);
            transition: transform 0.2s;
        }
        .addTask-form {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #ffffff;
            width: 420px;
            padding: 32px;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            z-index: 100;
            border: 1px solid #f1f5f9;

            .task-form {
                h3 {
                margin: 0 0 8px 0;
                font-size: 1.5rem;
                font-weight: 700;
                color: #0f172a;
                text-align: center;
                }

                p {
                color: #64748b;
                font-size: 0.9rem;
                margin-bottom: 24px;
                text-align: center;
                }

                form {
                display: flex;
                flex-direction: column;
                gap: 16px;

                /* Style des champs de texte */
                input[type="text"] {
                    width: 100%;
                    height: 44px;
                    padding: 0 14px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    background-color: #f8fafc;
                    font-size: 0.95rem;
                    transition: all 0.2s ease;
                    box-sizing: border-box;

                    &:focus {
                    outline: none;
                    border-color: #3b82f6;
                    background-color: #ffffff;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                    }

                    &::placeholder {
                    color: #94a3b8;
                    }
                }

                /* Organisation des dates */
                label {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #475569;
                    margin-bottom: -10px; /* Rapproche le label de son input */
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }

                input[type="date"] {
                    width: 100%;
                    height: 40px;
                    padding: 0 12px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    font-family: inherit;
                    color: #1e293b;
                    background-color: #f8fafc;
                    cursor: pointer;

                    &:focus {
                    outline: none;
                    border-color: #3b82f6;
                    }
                }

                /* Conteneur de boutons */
                .btn-ctn {
                    display: flex;
                    flex-direction: column; /* Boutons l'un au dessus de l'autre pour mobile, ou côte à côte */
                    gap: 12px;
                    margin-top: 10px;

                    @media (min-width: 400px) {
                    flex-direction: row;
                    }

                    button {
                    flex: 1;
                    height: 44px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    }

                    .submit-btn {
                    background-color: #2563eb;
                    color: #ffffff;

                    &:hover {
                        background-color: #1d4ed8;
                        transform: translateY(-1px);
                        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
                    }

                    &:active {
                        transform: translateY(0);
                    }
                    }

                    .cancel-btn {
                    background-color: #ffffff;
                    color: #64748b;
                    border: 1px solid #e2e8f0;

                    &:hover {
                        background-color: #f1f5f9;
                        color: #0f172a;
                        border-color: #cbd5e1;
                    }
                    }
                }
                }
            }
            }

        .team-form {
            position: fixed; /* Mieux que absolute pour les modales */
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            gap: 15px;
            width: 480px;
            max-height: 85vh;
            padding: 30px;
            background-color: #ffffff;
            border: 1px solid rgba(0, 0, 0, 0.05);
            border-radius: 16px;
            z-index: 100;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);

            /* Bouton de fermeture élégant */
            .close-btn {
                position: absolute;
                top: 15px;
                right: 15px;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: #f1f5f9;
                border: none;
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: all 0.2s ease;
                
                img {
                width: 12px;
                height: 12px;
                transform: rotate(45deg);
                filter: grayscale(1);
                }

                &:hover {
                background-color: #fee2e2;
                transform: rotate(90deg);
                }
            }

            h2 {
                font-size: 1.25rem;
                color: #1e293b;
                font-weight: 700;
                margin: 0;
                align-self: flex-start;
            }

            /* Sections de défilement (Scrollbars discrètes) */
            .members-list, .member-research-result {
                width: 100%;
                height: 180px;
                overflow-y: auto;
                padding-right: 5px;
                display: flex;
                flex-direction: column;
                gap: 12px;

                &::-webkit-scrollbar {
                width: 4px;
                }
                &::-webkit-scrollbar-thumb {
                background: #e2e8f0;
                border-radius: 10px;
                }
            }

            /* Barre de recherche */
            .team-search-section {
                width: 100%;
                background: #f8fafc;
                padding: 15px;
                border-radius: 12px;

                p {
                font-size: 0.85rem;
                color: #64748b;
                margin-bottom: 10px;
                }

                input {
                width: 100%;
                height: 40px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                padding: 0 12px;
                font-size: 0.9rem;
                transition: border-color 0.2s;
                box-sizing: border-box;

                &:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                }

                .build-btn {
                width: 100%;
                height: 40px;
                border-radius: 8px;
                background-color: #1e293b;
                color: white;
                border: none;
                margin-top: 10px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
                transition: background 0.2s;

                &:hover {
                    background-color: #334155;
                }
                
                img { width: 16px; filter: invert(1); }
                }
            }

            /* Cartes des membres (Utilisé pour la liste ET le résultat de recherche) */
            .member-item, .member-card {
                display: flex;
                align-items: center;
                padding: 10px 15px;
                background-color: #fff;
                border: 1px solid #f1f5f9;
                border-radius: 10px;
                transition: transform 0.2s, box-shadow 0.2s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);

                &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }

                .member-avatar, .member-image {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                background-color: #f1f5f9;
                }

                .member-info {
                flex: 1;
                padding: 0 12px;
                display: flex;
                flex-direction: column;

                .member-name, h3 {
                    margin: 0;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #0f172a;
                }

                .member-role, p {
                    margin: 0;
                    font-size: 0.8rem;
                    color: #64748b;
                    font-style: normal;
                }
                }

                /* Boutons d'action sur les cartes */
                .remove-btn, .invite-btn {
                    padding: 6px 12px;
                    height: auto;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .remove-btn {
                    background-color: #fff1f2;
                    color: #e11d48;
                    &:hover { background-color: #ffe4e6; }
                }

                .invite-btn {
                    background-color: #eff6ff;
                    color: #2563eb;
                    &:hover { background-color: #dbeafe; }
                }
            }
            }

            /* Overlay pour assombrir l'arrière-plan */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.4);
                backdrop-filter: blur(4px);
                z-index: 99;
            }
    
</style>
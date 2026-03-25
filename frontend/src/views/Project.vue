<script setup>
    import supabase from '../services/supabaseConfig.js'
    import { ref, onMounted, computed, watch } from 'vue'
    import Spinner from '../components/Spinner.vue'
    import { useUserStore } from '../store/index.js'
    import AddTaskBar from '../components/AddTaskBar.vue'
    import ProjectProgressChart from '../components/ProjectProgressChart.vue';
    import { useRoute } from 'vue-router'
    
    console.log("Démarrage du composant projet");
    const props = defineProps({
        deptName: {
            type: String,
            required: true
        },
        deptid: {
            type: String,
            required: true
        }
        });
    const route = useRoute()
    const deptRef = props.deptid
    const open = ref(false)
    const selectedProjectId = ref()
    const calendarContainer = ref(null); 
    const currentYear = ref(new Date().getFullYear());
    const daysInYear = ref([]);
    const hoveredTaskDetails = ref(null);
    const currentMonth = ref(new Date().getMonth());
    const userStore = useUserStore()
    const projects = ref()
    const success = ref(false)
    const errors = ref(false)
    const isProjectsLoading = ref(true)
    const isCurrentLoading =  ref(false)
    const searchKey = ref('')
    const searchMember = ref('')
    const isOverviewOpen = ref(true)
    const isDashboardOpen = ref(false)
    const isReportOpen = ref(false)
    const isSendingReport = ref(false)
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
    const isTaskSubmmitting = ref(false)
    const newTaskName = ref('')
    const newTaskBudget = ref(0)
    const newTaskStart = ref('')
    const newTaskEnd = ref('')
    const newTaskDesc = ref('')
    const selectedRole = ref('Member')
    const foundMember = ref(null)
    const projectReports = ref([])
    const newReport = ref({ content: '', progress: 0 });

    const getProjectStats = () => {
        const bgt = userStore.currentProject.tasks.reduce((acc, t) => acc + (t.task_budget || 0), 0) || 0;
        const exp = userStore.currentProject.tasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + (Number(t.task_budget) || 0), 0);
        const expectedProfit = userStore.currentProject.project.gain - bgt
        const prof = expectedProfit - exp
        const mar = bgt - exp
        const remdDays = (() => {
            const endDate = new Date(userStore.currentProject.project.end_date);
            const now = new Date();
            const diffTime = endDate - now;
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        })();

        const stats = {
            budget: bgt,
            expenses: exp,
            profit: prof,
            margin: mar,
            expectation: expectedProfit,
            completionRate: calculateOverallProgress(),
            reamainingDays: remdDays
        };

        return stats;
    };

    const projectStats = ref(
        {
            budget: 0,
            expenses: 0,
            profit: 0,
            margin: 0,
            expectation: 0,
            completionRate: 0,
            reamainingDays: 0
        }
    );

    const markProjectAsDelivered = async () => {
        const project = userStore.currentProject.project;
        
        try {
            // 1. Mettre à jour le statut du projet
            const { error: updateError } = await supabase
                .from('project')
                .update({ status: 'delivered', delivered_at: new Date() })
                .eq('projectref', project.projectref);

            if (updateError) throw updateError;

            // 2. Créer la transaction financière de revenu (Le Gain -> Caisse)
            const { error: transacError } = await supabase
                .from('finance_transactions')
                .insert([{
                    amount: project.gain,
                    category: 'income',
                    label: `Paiement Client : ${project.projectname}`,
                    project_ref: project.projectref,
                    companyref: userStore.user.employe.companyref,
                    type: 'credit'
                }]);

            if (transacError) throw transacError;

            triggerToast("Projet livré et gain transféré en caisse !", "success");
        } catch (err) {
            console.error("Erreur livraison:", err);
        }
    };

    // Calculer le % d'avancement basé sur les tâches complétées
    function calculateOverallProgress() {
        const tasks = userStore.currentProject.tasks || [];
        if (tasks.length === 0) return 0;
        const completedTasks = tasks.filter(t => t.status === 'validated' || t.status === 'completed').length;
        return Math.round((completedTasks / tasks.length) * 100);
    };

    const submitProjectReport = async () => {
        if (!newReport.value.content) return;
        
        isSendingReport.value = true
        const { data, error } = await supabase
            .from('project_reports')
            .insert([{
                project_ref: userStore.currentProject.project.projectref,
                author_ref: userStore.user.user.userref,
                content: newReport.value.content,
                progress_at_time: projectStats.value.completionRate,
                company_ref: userStore.user.employe.companyref
            }]);
        if(error){
            console.error("Error submitting report:", error);
        }else{
            newReport.value.content = '';
            isSendingReport.value = false
            fetchProjectReports(); // Rafraîchir la liste
        }
    };

    const fetchProjectReports = async () => {
        const { data } = await supabase
            .from('project_reports')
            .select('*, user:author_ref(firstname, lastname)')
            .eq('project_ref', userStore.currentProject.project.projectref)
            .order('created_at', { ascending: false });
        projectReports.value = data || [];
    };
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
            const assRef = `ASS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

            const {data, error} = await supabase
            .from('assignments')
            .insert({ 
                assref: assRef,
                taskref: taskRef,
                collabref: collabRef,
                userref: userRef
            })
            if(error) throw error
            if (data) {
                /*userStore.currentProjecct.asssignments.push({
                    assref: assRef,
                    taskref: taskRef,
                    collabref: collabRef,
                    userref: userRef
                    user: {
                       firstname:memberData.firstname 
                    }
                })*/
                // Rafraîchir les tâches après assignation
                await userStore.getProjects(deptRef);
                return true;
            }
        } catch (error) {
            console.error("Error assigning member:", error);
            return false;
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

const removeFromTeam = async (collabRef) => {
    if (!confirm("Voulez-vous vraiment retirer ce membre du projet ?")) return;

    try {
        const { error } = await supabase
            .from('team')
            .delete()
            .eq('collabref', collabRef);

        if (error) throw error;

        // Mise à jour locale du store
        userStore.currentProject.team = userStore.currentProject.team.filter(
            m => m.collabref !== collabRef
        );
        
        // Optionnel : Désassigner aussi les tâches de ce membre
        await supabase
            .from('assignment')
            .delete()
            .eq('collabRef', collabRef);

    } catch (err) {
        console.error("Erreur lors de la suppression du membre:", err);
        triggerToast("Erreur lors de la suppression du membre.", "error");
    }
};

const submitTask = async () => {
    try {
        isTaskSubmmitting.value = true
        if (!newTaskName.value || !newTaskStart.value || !newTaskEnd.value) return;
        
        const taskRef = 'TASK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        const { data, error } = await supabase
            .from('task')
            .insert({ 
                taskref: taskRef,
                taskname: newTaskName.value,
                description: newTaskDesc.value, // Ajouté
                startdate: newTaskStart.value,
                enddate: newTaskEnd.value,
                task_budget: newTaskBudget.value,
                status: 'pending',
                projectref: userStore.currentProject.project.projectref,
            })
            .select();

        if (error) throw error;

        if (data) {
            success.value = true;
            userStore.currentProject.tasks.push(data[0]);
            await userStore.getProjects(deptRef);
            isTaskFormOpen.value = false;
            isTaskSubmmitting.value = false
            resetTaskForm();
        }
    } catch (error) {
        console.error("Erreur lors de l'ajout de la tâche:", error);
        errors.value = true;
    }
};

const resetTaskForm = () => {
    newTaskName.value = '';
    newTaskDesc.value = '';
    newTaskStart.value = '';
    newTaskEnd.value = '';
    newTaskBudget.value = 0; // Reset budget
};

const setTaskStatus = async (status, taskRef) => {
    try{
        userStore.currentProject.project.tasks.filter(t => t.taskref === taskRef)[0].status = status;
        const {data, error}= await supabase
        .from('task')
        .update({status: status})
        .eq('taskref', taskRef)
        .select()

        if (data) {
            if(status === "ongoing"){
                ///initier la transaction finacière
                const {data: taskData, error: taskError} = await supabase
                .from('finance_transactions')
                .insert([{
                    amount: userStore.currentProject.project.tasks.filter(t => t.taskref === taskRef)[0].task_budget,
                    category: 'expense',
                    label: `Coût Tâche : ${userStore.currentProject.project.tasks.filter(t => t.taskref === taskRef)[0].taskname}`,
                    project_ref: userStore.currentProject.project.projectref,
                    companyref: userStore.user.employe.companyref,
                    type: 'debit'
                }]);
                if (taskError) throw taskError;
                
            }
            success.value = true
            await userStore.getProjects(deptRef)
        }
    }catch(err){
        console.error("Error adding task:", err)
        errors.value = true
    }
}

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
    const addToTeam = async (teamRef, email, role) => {
        try {
            if (!foundMember.value) return;
            //Récupérer la ref de l'utilisateur
            const {data: userData, error: userError} = await supabase.from('user')
                .select('*')
                .eq('email', email)
                .single()
            
                if(userError) throw error

                const userRef = userData.userref

            // --- 4. ENREGISTREMENT DU COLLABORATEUR (Chef de projet) ---
            const collabRef = 'COL-' + Math.random().toString(36).substr(2, 9).toUpperCase()
            const { data: collabData, error: collabError } = await supabase.from('collaborator').insert([{
                collabref: collabRef,
                userref: userRef,
                teamref: teamRef,
                role: role
            }])
            .select('*, user:userref(*)')
            .single();

            if (collabError) throw collabError

            userStore.currentProject.team.push({
                collabref: collabRef,
                role: role,
                user: userData
            });
            searchMember.value = '';
            foundMember.value = null;
            success.value = true;

        } catch (err) {
            console.error("Erreur ajout équipe:", err);
        }
    };

    onMounted(async () => {
        if(deptRef){
            await userStore.getProjects(deptRef);
            projects.value = userStore.projects;
            fetchProjectReports()
        }

        isProjectsLoading.value = false
        daysInYear.value = generateYearCalendar(currentYear.value);
    });

    // On observe la propriété réactive du store
    watch(() => userStore.currentProject, (newVal) => {
        if (newVal && Object.keys(newVal).length > 0) {
            // Met à jour les stats du projet après le changement des données
            projectStats.value = getProjectStats();
            
            // Remplit le calendrier avec les tâches
            populateTasksInCalendar();

            console.log('projet: ', userStore.currentProject);
            console.log('stats du projet: ', projectStats.value);
        }
    }, { deep: true, immediate: true });
    /*watch(() => route.params.id, async (newId) => {
    if (newId) {
        selectedProjectId.value = newId;
        await userStore.getProjectDetails(newId);
        // --- NOUVEAUX APPELS ---
        //await fetchProjectFinancials(newId);
        await fetchProjectReports(newId);
    }
    userStore.currentProject().then(() => {
        // Met à jour les stats du projet après le chargement des détails
        projectStats.value = getProjectStats();
        // Remplit le calendrier avec les tâches
        populateTasksInCalendar();
            console.log('projet: ', userStore.currentProject)
            console.log('stats du projet: ', projectStats.value)
    });
}, { immediate: true });*/

</script>

<template>
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
                            <div class="data" @click="{userStore.setCurrentProject(project.project.projectref); open = !open}">
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
                            <li :class="isOverviewOpen ? 'active' : ''" @click="openOverview">Overview</li>
                            <li :class="isDashboardOpen ? 'active' : ''" @click="openDashboard">Dashboard</li>
                            <li :class="isReportOpen ? 'active' : ''" @click="openReport">Activity Report</li>
                            <li :class="isTasksOpen ? 'active' : ''" @click="openTasks">Tasks</li>
                        </ul>
                    </div>
                </div>
                <div class="overview-ctn" v-show="isOverviewOpen">
                    <div class="overview" v-if="userStore.currentProject.project">
                        <div class="details">
                            <div>
                                <h3>Description</h3>
                                <p v-if="userStore.currentProject.project&& userStore.currentProject.project.description">
                                    <span v-html="userStore.currentProject.project.description.replace(/\n/g, '<br>')"></span>
                                </p>
                                <p v-else>
                                    No Description provided
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
                            <div>
                                <h3>Budget alloué</h3>
                                <p v-if="userStore.currentProject.project&& userStore.currentProject.project.budget">
                                    {{ projectStats.budget }}
                                </p>
                                <p v-else>
                                    No Budget provided
                                </p>
                            </div>
                            <div>
                                <h3>Profit estimé</h3>
                                <p v-if="userStore.currentProject.project&& userStore.currentProject.project.gain">
                                    {{ userStore.currentProject.project.gain }}
                                </p>
                                <p v-else>
                                    No profit provided
                                </p>
                            </div>
                            <div class="attachments">
                                <h3>Document du projet</h3>
                                <div v-if="userStore.currentProject.project.doc_url">
                                    <div  class="file">
                                        <p><a :href="userStore.currentProject.project.doc_url" target="blank">Voir le document du projet</a></p>
                                    </div>
                                </div>
                                <p v-else>No attachments provided</p>
                            </div>
                        </div>
                    </div>
                    <div class="overview" v-else>
                        <p> Select a project to view details </p>
                    </div>
                </div>
                <div class="dashboard-ctn" v-show="isDashboardOpen">
                    <h2>Project Dashboard</h2>
                    <p v-if="userStore.currentProject.project">
                        <div class="finance-kpi-bar">
                            <div class="kpi-card" :class="projectStats.margin < 0 ? 'bg-red-light' : ''">
                                <label>Budget Consommé</label>
                                <span class="val">{{ projectStats.expenses }} XAF/ {{ projectStats.budget }} XAF</span>
                                <small v-if="projectStats.margin < 0">Dépassement de budget !</small>
                            </div>

                            <div class="kpi-card">
                                <label>Profit Attendu </label>
                                <span class="val text-blue">{{ projectStats.expectation }} XAF</span>
                            </div>

                            <div class="kpi-card">
                                <label>Profit réel</label>
                                <span class="val text-blue">{{ projectStats.profit }} XAF</span>
                            </div>

                            <div class="kpi-card">
                                <label>Marge de sécurité</label>
                                <span class="val" :class="projectStats.margin >= 0 ? 'text-green' : 'text-red'">
                                    {{ projectStats.margin}} XAF
                                </span>
                            </div>
                            
                            <button 
                                v-if="userStore.currentProject.project.status !== 'delivered'"
                                class="add-btn" 
                                @click="markProjectAsDelivered"
                            >
                                <AppIcon name="CHECK" /> Livrer le Projet
                            </button>
                        </div>
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
                                <p>Budget/tâche</p>
                                <p>Status</p>
                                <p>Start Date</p>
                                <p>End Date</p>
                            </div>
                            <div v-if="userStore.currentProject.tasks && userStore.currentProject.tasks.length > 0" class="tasks-list">
                                <ul>
                                    <li v-for="task in userStore.currentProject.tasks" :key="task.taskref">
                                        <p>{{ task.taskname }}</p>
                                        <p>{{ task.task_budget }}</p>
                                        <p>{{ task.status }}</p>
                                        <p>{{ task.startdate }}</p>
                                        <p>{{ task.enddate }}</p>
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
                <ProjectProgressChart />

                <div class="manager-reports-zone">
                    <h3>Rapports de rentabilité & Avancement</h3>
                    <div class="input-group">
                        <textarea v-model="newReport.content" placeholder="Note pour le manager sur la santé du projet..."></textarea>
                        <button class="submit-btn" @click="submitProjectReport">{{isSendingReport ? 'Envoi en cours...' : 'Envoyer le rapport'}}</button>
                    </div>
                    
                    <div class="reports-list">
                        <div v-for="rep in projectReports" :key="rep.id" class="report-item">
                            <div class="rep-header">
                                <strong>{{ rep.user.firstname }}</strong> — <span>{{ new Date(rep.created_at).toLocaleDateString() }}</span>
                            </div>
                            <p>{{ rep.content }}</p>
                        </div>
                    </div>
                </div>
            </div>
                <div class="tasks-ctn" v-show="isTasksOpen">
                    <h2>Project Tasks</h2>
                    <div v-if="userStore.currentProject.project">
                        <div class="head">
                            <div class="tabs">
                                <div class="tab-items">
                                    <div :class="{ 't-item': true, 'active': isListTabActive }" @click="openListView">List</div>
                                    <div :class="{ 't-item': true, 'active': isKanbanTabActive }"@click="openKanbanView">Kanban</div>
                                    <!-- <div :class="{ 't-item': true, 'active': isTimelineTabActive }" @click="openTimelineView">Timeline</div> -->
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
                                                    <p class="status">{{task.status}}</p> <p class="remain">{{ calculateTimeRemaining(task.startdate, task.enddate) }} remaining</p>
                                                </div>
                                                <div class="elem-members" v-if="userStore.currentProject.assignments.length > 0">
                                                    <template v-for="assignment in userStore.currentProject.assignments" :key="assignment.assref">
                                                        <img v-if="assignment.taskref === task.taskref"
                                                            :src="assignment.user?.profilephotourl || '../assets/images/default-avatar.png'"
                                                            :alt="assignment.user?.firstname"
                                                            :title="`${assignment.user?.firstname} ${assignment.user?.lastname}`"
                                                            class="assignee-avatar">
                                                    </template>
                                                </div>
                                                <button class="btn" @click="setTaskStatus('ongoing', task.taskref)">Start</button>
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
                                                <div class="elem-members" v-if="userStore.currentProject.assignments.length > 0">
                                                    <template v-for="assignment in userStore.currentProject.assignments" :key="assignment.assref">
                                                        <img v-if="assignment.taskref === task.taskref"
                                                            :src="assignment.user?.profilephotourl || '../assets/images/default-avatar.png'"
                                                            :alt="assignment.user?.firstname"
                                                            :title="`${assignment.user?.firstname} ${assignment.user?.lastname}`"
                                                            class="assignee-avatar">
                                                    </template>
                                                </div>
                                                
                                                <button class="btn" @click="setTaskStatus('completed', task.taskref)">Mark as Completed</button>
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
                                                <div class="elem-members" v-if="userStore.currentProject.assignments.length > 0">
                                                    <template v-for="assignment in userStore.currentProject.assignments" :key="assignment.assref">
                                                        <img v-if="assignment.taskref === task.taskref"
                                                            :src="assignment.user?.profilephotourl || '../assets/images/default-avatar.png'"
                                                            :alt="assignment.user?.firstname"
                                                            :title="`${assignment.user?.firstname} ${assignment.user?.lastname}`"
                                                            class="assignee-avatar">
                                                    </template>
                                                </div>
                                                <button class="btn" @click="setTaskStatus('verified', task.taskref)">Verify</button>
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
                                                <div class="elem-members" v-if="userStore.currentProject.assignments.length > 0">
                                                    <template v-for="assignment in userStore.currentProject.assignments" :key="assignment.assref">
                                                        <img v-if="assignment.taskref === task.taskref"
                                                            :src="assignment.user?.profilephotourl || '../assets/images/default-avatar.png'"
                                                            :alt="assignment.user?.firstname"
                                                            :title="`${assignment.user?.firstname} ${assignment.user?.lastname}`"
                                                            class="assignee-avatar">
                                                    </template>
                                                </div>
                                                <button class="btn">Completed</button>
                                            </div>
                                        </div>
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
        
        <div class="modal-overlay" v-if="isTaskFormOpen && userStore.currentProject.project" @click.self="isTeamFormOpen = false">
        <div class="addTask-form">
            <div class="task-form">
                <h3>🚀 Nouvelle Tâche</h3>
                <form @submit.prevent="submitTask">
                    <div class="input-group">
                        <label>Nom de la tâche</label>
                        <input type="text" v-model="newTaskName" required>
                    </div>
                    <div class="input-group">
                        <label>Description</label>
                        <textarea v-model="newTaskDesc" required></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="input-group">
                            <label>Début</label>
                            <input type="date" v-model="newTaskStart" required>
                        </div>
                        <div class="input-group">
                            <label>Échéance</label>
                            <input type="date" v-model="newTaskEnd" required>
                        </div>
                    </div>

                    <div class="input-group">
                        <label>Budget alloué (XAF)</label>
                        <input type="number" v-model="newTaskBudget" placeholder="Optionnel">
                    </div>

                    <div class="btn-ctn">
                        <button type="submit" class="submit-btn" :disabled="isTaskSubmmitting">Ajouter la tâche</button>
                        <button type="button" @click="isTaskFormOpen = false" class="cancel-btn">Annuler</button>
                    </div>
                </form>
            </div>
        </div> </div>

        <div class="modal-overlay" v-if="isTeamFormOpen && userStore.currentProject.project" @click.self="isTeamFormOpen = false">
        <div class="team-form" >
            <button class="close-btn" @click="isTeamFormOpen = false">&times;</button>
            
            <div class="members-list">
                <h2>👥 Équipe du Projet</h2>
                <div v-if="!userStore.currentProject.team?.length">
                    <p class="empty-msg">Aucun membre assigné pour le moment.</p>
                </div>
                <div v-else class="member-grid">
                    <div v-for="member in userStore.currentProject.team" :key="member.collabref" class="member-item">
                        <img :src="member.user?.profilephotourl || DefaultAvatar" class="member-avatar">
                        <div class="member-info">
                            <p class="member-name">{{ member.user?.firstname }} {{ member.user?.lastname }}</p>
                            <span class="role-tag">{{ member.role || 'Collaborateur' }}</span>
                        </div>
                        <button class="remove-btn" @click="removeFromTeam(member.collabref)">✕</button>
                    </div>
                </div>
            </div>
                
            <div class="add-section">
                <h2>🔍 Recruter un membre</h2>
                <div class="team-search-section">
                    <input type="email" v-model="searchMember" placeholder="Email de l'employé..." class="project-input" />
                    <button class="build-btn" @click="searchMemberByEmail(searchMember)">Rechercher</button>
                </div>

                <div class="member-research-result">
                    <Spinner v-if="isMembersLoading"/>
                    
                    <div v-else-if="foundMember" class="member-card">
                        <img :src="foundMember.profilephotourl || DefaultAvatar" class="member-image">
                        <div class="member-info">
                            <h3>{{ foundMember.firstname }} {{ foundMember.lastname }}</h3> 
                            <p>{{ foundMember.email }}</p>
                            <select v-model="selectedRole" class="role-select">
                                <option value="Member">Membre</option>
                                <option value="Lead">Chef d'équipe</option>
                                <option value="Expert">Expert Consultant</option>
                            </select>
                        </div>
                        <button class="invite-btn" @click="addToTeam(userStore.currentProject.project.team[0].teamref, foundMember.email, selectedRole)">
                            Ajouter au projet
                        </button>
                    </div>
                    <p v-else-if="searchMember" class="no-result">Aucun employé trouvé.</p>
                </div>
            </div>
        </div></div>
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
                                &:hover, &.active{
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
                                            align-items: center;
                                            height: 50px;
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
                    &:disabled {
                        background: #94a3b8;
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
    display: flex; justify-content: center; align-items: center;
    z-index: 200;
}

/* --- AJOUTS CIBLÉS SANS TOUCHER AU RESTE --- */

/* Alignement des nouveaux KPIs financiers dans ton dashboard existant */
.finance-kpi-bar {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.kpi-card {
    flex: 1;
    min-width: 180px;
    background: #ffffff;
    padding: 15px;
    border-radius: 12px;
    border: 1px solid #50518183;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.kpi-card label {
    display: block;
    font-size: 0.7rem;
    color: #505181;
    font-weight: bold;
    margin-bottom: 5px;
}

.kpi-card .val {
    font-size: 1.1rem;
    font-weight: 800;
}

/* Couleurs de rentabilité */
.text-green { color: #2ecc71 !important; }
.text-red { color: #e74c3c !important; }

/* Style pour le bloc de rapports dans l'onglet Activity */
.report-layout {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.report-form textarea {
    width: 100%;
    min-height: 80px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.report-bubble {
    background: #f8fafc;
    border-left: 4px solid #004581;
    padding: 12px;
    margin-bottom: 10px;
    border-radius: 4px;
}

/* Fix pour les input-groups dans tes modales existantes */
.input-group {
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
}

.input-group label {
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 4px;
    color: #505181;
}

.input-group input, .input-group select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 5px;
}

/* Style du badge d'avancement dans les rapports */
.badge {
    font-size: 0.7rem;
    background: #c2dff8;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: bold;
}

/* --- STRUCTURE DES GROUPES D'ENTRÉE --- */
.input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 15px;
    width: 100%;
}

.input-group label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
    text-align: left;
}

/* Style uniforme pour tous les types d'inputs dans les modales */
.input-group input, 
.input-group select, 
.input-group textarea {
    padding: 10px 12px;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    background: #ffffff;
    width: 100%;
    box-sizing: border-box; /* Important pour que le padding ne dépasse pas */
}

/* Effets de focus pour une meilleure UX */
.input-group input:focus, 
.input-group select:focus, 
.input-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Gestion des lignes doubles (ex: Dates de début et fin côte à côte) */
.form-row {
    display: flex;
    gap: 15px;
    width: 100%;
}

.form-row .input-group {
    flex: 1; /* Les deux colonnes prennent la même largeur */
}

/* Style spécifique pour le sélecteur de rôle dans la modale équipe */
.role-select {
    margin-top: 8px;
    background-color: #f8fafc;
    cursor: pointer;
    font-weight: 500;
}

/* Style pour les boutons d'action des formulaires */
.btn-ctn {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    justify-content: flex-end;
}

.submit-btn {
    background-color: #004581;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
}

.submit-btn:hover {
    background-color: #003366;
}

.cancel-btn {
    background-color: #f1f5f9;
    color: #64748b;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

/* --- ADAPTATION MOBILE (< 768px) --- */
@media (max-width: 768px) {
    .project-page {
        display: block; /* On casse le flex pour empiler les éléments */
        overflow-x: hidden;
    }

    .project-sideBar {
        position: absolute;
        top: 0;
        left:0;
        width: 100%;
        padding: 10px;
        border-right: none;
        border-bottom: 2px solid #eee;
        background: #f9f9f9;
    }

    /* La liste des projets devient un ruban horizontal */
    .collapse-elem ul {
        display: flex;
        overflow-x: auto;
        gap: 10px;
        padding: 10px 0;
        list-style: none;
        -webkit-overflow-scrolling: touch;
    }

    .projName {
        flex: 0 0 200px; /* Largeur fixe pour chaque carte projet dans le ruban */
        background: white;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 8px;
    }

    .project-desc {
        display: none; /* On cache la description longue pour gagner de la place */
    }
}
@media (max-width: 768px) {
    .proj-header {
        padding: 10px;
    }

    .proj-title p {
        font-size: 1.1rem;
        font-weight: bold;
    }

    /* Menu horizontal scrollable */
    .proj-menu ul {
        display: flex;
        overflow-x: auto;
        gap: 5px;
        padding: 10px 0;
        border-bottom: 1px solid #eee;
    }

    .proj-menu li {
        padding: 8px 15px;
        font-size: 13px;
        white-space: nowrap; /* Empêche le texte de revenir à la ligne */
        background: #f0f0f0;
        border-radius: 20px;
    }

    .proj-menu li.active {
        background: #2c3e50; /* Ton code couleur principal */
        color: white;
    }

    /* Ajustement de l'équipe */
    .proj-team .team {
        flex-direction: column;
        gap: 10px;
    }
    
    .team-members img {
        width: 30px;
        height: 30px;
    }
}
@media (max-width: 768px) {
    .overview {
        display: block; /* On empile tout */
        padding: 15px;
    }

    .details, .estimations {
        width: 100%;
        margin-bottom: 20px;
    }

    .details div, .estimations div {
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px dashed #eee;
    }

    /* Adaptation des graphiques ou stats */
    .project-stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr; /* 2 colonnes seulement sur mobile */
        gap: 10px;
    }
}
@media (max-width: 768px) {
    .overview {
        display: block; /* On empile tout */
        padding: 15px;
    }

    .details, .estimations {
        width: 100%;
        margin-bottom: 20px;
    }

    .details div, .estimations div {
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px dashed #eee;
    }

    /* Adaptation des graphiques ou stats */
    .project-stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr; /* 2 colonnes seulement sur mobile */
        gap: 10px;
    }
}
</style>
<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import supabase from '../services/supabaseConfig'
import { useUserStore } from '../store/index'
import Header from '../components/Header.vue'
import Spinner from '../components/Spinner.vue'
import AddTaskBar from '../components/AddTaskBar.vue'
import ProjectProgressChart from '../components/ProjectProgressChart.vue'

// --- ÉTATS ORIGINAUX DE TA V1 ---
const open = ref(true)
const selectedProjectId = ref(null)
const calendarContainer = ref(null)
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
const daysInYear = ref([])
const hoveredTaskDetails = ref(null)
const success = ref(false)
const errors = ref(false)
const isProjectsLoading = ref(true)
const isCurrentLoading = ref(false)
const searchKey = ref('')
const searchMember = ref('')

// États des onglets (Navigation)
const isOverviewOpen = ref(true)
const isDashboardOpen = ref(false)
const isReportOpen = ref(false)
const isTasksOpen = ref(false)
const isSubmenuOpen = ref(false)
const isTaskFormOpen = ref(false)
const isTeamFormOpen = ref(false)

const userStore = useUserStore()
const route = useRoute()

// --- COMPUTED ---
const projects = computed(() => userStore.projects)
const currentProject = computed(() => userStore.currentProject)

// --- LOGIQUE SUPABASE ---

const fetchProjects = async () => {
    isProjectsLoading.value = true
    await userStore.getProjects() // Appelle la méthode Supabase définie dans le store
    isProjectsLoading.value = false
}

const handleProjectClick = async (projectRef) => {
    selectedProjectId.value = projectRef
    isCurrentLoading.value = true
    
    try {
        // Jointure Supabase pour récupérer Projet + Tâches + Équipe (Users)
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
            .eq('projectref', projectRef)
            .single()

        if (error) throw error
        
        // On met à jour le store avec la même structure que ta V1
        userStore.currentProject = data
        
        // Recalcul du calendrier une fois les données chargées
        nextTick(() => {
            generateCalendar()
        })
    } catch (err) {
        console.error("Erreur chargement projet:", err.message)
    } finally {
        isCurrentLoading.value = false
    }
}

const deleteProject = async (projectRef) => {
    if (!confirm("Confirm deletion?")) return
    const { error } = await supabase.from('project').delete().eq('projectref', projectRef)
    if (!error) {
        userStore.currentProject = null
        await fetchProjects()
    }
}

// --- TA LOGIQUE DE CALENDRIER / GANTT (CONSERVÉE) ---

const generateCalendar = () => {
    const days = []
    const date = new Date(currentYear.value, 0, 1)
    while (date.getFullYear() === currentYear.value) {
        days.push(new Date(date))
        date.setDate(date.getDate() + 1)
    }
    daysInYear.value = days
}

const getTaskStyle = (task) => {
    if (!task.start_date || !task.deadline) return {}
    const start = new Date(task.start_date)
    const end = new Date(task.deadline)
    const startIdx = daysInYear.value.findIndex(d => d.toDateString() === start.toDateString())
    const endIdx = daysInYear.value.findIndex(d => d.toDateString() === end.toDateString())
    
    if (startIdx === -1 || endIdx === -1) return { display: 'none' }
    
    return {
        left: `${startIdx * 40}px`,
        width: `${(endIdx - startIdx + 1) * 40}px`,
        backgroundColor: '#4338ca',
        position: 'absolute'
    }
}

const hoverTask = (task, event) => {
    hoveredTaskDetails.value = task
    // Logique de positionnement du tooltip comme dans ton code
}

// --- NAVIGATION ---
const toggleTab = (tab) => {
    isOverviewOpen.value = tab === 'overview'
    isDashboardOpen.value = tab === 'dashboard'
    isReportOpen.value = tab === 'report'
    isTasksOpen.value = tab === 'tasks'
}

onMounted(() => {
    generateCalendar()
    fetchProjects()
})

// Watcher pour réagir aux changements de route (ton code original)
watch(() => route.params.userref, () => {
    fetchProjects()
})
</script>

<template>
    <div class="project-page">
        <Header />

        <div class="main-ctn">
            <div class="sidebar" :class="{ 'close': !open }">
                <div class="side-header">
                    <div class="title-ctn" v-if="open">
                        <h3>Projects</h3>
                    </div>
                </div>

                <div class="add-project" v-if="open">
                    <AddTaskBar />
                </div>

                <div class="projects-list" v-if="!isProjectsLoading">
                    <div 
                        v-for="p in projects" 
                        :key="p.projectref" 
                        class="project-item"
                        :class="{ 'selected': selectedProjectId === p.projectref }"
                        @click="handleProjectClick(p.projectref)"
                    >
                        <div class="project-icon">
                        </div>
                        <div class="project-info" v-if="open">
                            <h4>{{ p.projectname }}</h4>
                            <p>{{ p.tasks?.length || 0 }} tasks</p>
                        </div>
                        <div class="more" @click.stop="openSubmenu(p.projectref)" v-if="open">
                            <div class="submenu" v-if="isSubmenuOpen && selectedProjectId === p.projectref">
                                <ul>
                                    <li @click="deleteProject(p.projectref)" class="delete">Delete</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="loader">
                    <Spinner />
                </div>
            </div>

            <div class="content">
                <div v-if="isCurrentLoading" class="loader-main">
                    <Spinner />
                </div>

                <div v-else-if="currentProject" class="project-details">
                    <div class="project-header">
                        <div class="top">
                            <h2>{{ currentProject.projectname }}</h2>
                            <button @click="isTeamFormOpen = true" class="team-btn">
                                Team
                            </button>
                        </div>
                        <nav class="tabs">
                            <span :class="{ active: isOverviewOpen }" @click="toggleTab('overview')">Overview</span>
                            <span :class="{ active: isDashboardOpen }" @click="toggleTab('dashboard')">Dashboard</span>
                            <span :class="{ active: isTasksOpen }" @click="toggleTab('tasks')">Tasks List</span>
                            <span :class="{ active: isReportOpen }" @click="toggleTab('report')">Reports</span>
                        </nav>
                    </div>

                    <div class="tab-body">
                        <div v-if="isOverviewOpen" class="overview-section">
                            <div class="calendar-controls">
                                <button @click="currentYear--">&lt;</button>
                                <span>{{ currentYear }}</span>
                                <button @click="currentYear++">&gt;</button>
                            </div>

                            <div class="gantt-container" ref="calendarContainer">
                                <div class="months-row">
                                    <div v-for="month in 12" :key="month" class="month-label">
                                        {{ new Date(0, month - 1).toLocaleString('default', { month: 'long' }) }}
                                    </div>
                                </div>

                                <div class="gantt-grid">
                                    <div v-for="day in daysInYear" :key="day" class="day-cell"></div>
                                    
                                    <div 
                                        v-for="task in currentProject.tasks" 
                                        :key="task.id" 
                                        class="task-bar"
                                        :style="getTaskStyle(task)"
                                        @mouseover="hoverTask(task, $event)"
                                        @mouseleave="hoveredTaskDetails = null"
                                    >
                                        <span class="task-title">{{ task.title }}</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="hoveredTaskDetails" class="task-tooltip">
                                <h4>{{ hoveredTaskDetails.title }}</h4>
                                <p>Status: {{ hoveredTaskDetails.status }}</p>
                                <p>From: {{ hoveredTaskDetails.start_date }}</p>
                                <p>To: {{ hoveredTaskDetails.deadline }}</p>
                            </div>
                        </div>

                        <div v-if="isDashboardOpen" class="dashboard-section">
                            <div class="stats-grid">
                                <div class="chart-card">
                                    <h3>Project Completion</h3>
                                    <ProjectProgressChart :tasks="currentProject.tasks" />
                                </div>
                                <div class="task-summary">
                                    <div class="stat-item">
                                        <span class="label">Total Tasks</span>
                                        <span class="val">{{ currentProject.tasks?.length }}</span>
                                    </div>
                                    </div>
                            </div>
                        </div>

                        <div v-if="isTasksOpen" class="tasks-list-section">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Task Name</th>
                                        <th>Assigned To</th>
                                        <th>Status</th>
                                        <th>Deadline</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="task in currentProject.tasks" :key="task.id">
                                        <td>{{ task.title }}</td>
                                        <td>{{ task.assigned_user || 'Unassigned' }}</td>
                                        <td><span :class="'status-pill ' + task.status">{{ task.status }}</span></td>
                                        <td>{{ task.deadline }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div v-else class="empty-state">
                    <p>Select a project to start working or create a new one.</p>
                </div>
            </div>
        </div>

        <div class="team-modal" v-if="isTeamFormOpen">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Project Team</h3>
                    <button @click="isTeamFormOpen = false" class="close-x">×</button>
                </div>
                
                <div class="member-search">
                    <input type="text" v-model="searchMember" placeholder="Add member by email...">
                    <button @click="buildTeam(currentProject.projectref, currentProject.projectname)">Add</button>
                </div>

                <div class="members-list">
                    <div v-for="m in currentProject.team" :key="m.userref" class="member-row">
                        <img :src="m.user?.profilephotourl || '/Default-avatar.png'" alt="">
                        <div class="m-names">
                            <p>{{ m.user?.firstname }} {{ m.user?.lastname }}</p>
                            <span>{{ m.role }}</span>
                        </div>
                        <button @click="removeMember(m.userref)" class="btn-remove">Remove</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .project-page{
        width: 100%;
        display: flex;
        justify-content: space-between;
        margin-top: 50px;
        padding-top: 30px;

        @media (max-width: 768px) {
            flex-direction: column;
            align-items: center;
            
        }

        .project-sideBar{
            padding: 20px;
            width: 20%;

            @media (max-width: 768px) {
                width: 100%;
                margin-bottom: 20px;
            }

            .search{
                display: flex;
                gap: 0;
                justify-content: center;
                width: 100%;
                padding: 10px;

                input{
                    width: 65%;
                    border-top-left-radius: 5px;
                    border-bottom-left-radius: 5px;
                    border: 1px solid #948a8a42;
                    border-right: none;
                    margin-right:0;
                    padding-left: 10px;
                    font-size: 0.8rem;
                }
                button{
                    width: 35px;
                    border-top-right-radius: 5px;
                    border-bottom-right-radius: 5px;
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
                    }

                    .collapse-elem {
                        padding: 10px;
                        background: #f8f8f8;
                        height: 65vh;
                        overflow-y: scroll;

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
            width: 85%;
            .main-ctn{
                width: 100%;
                .proj-header{
                    width: 100%;
                    height: 169px;
                    border-bottom: 2px solid #918f8f7a;
                    padding-bottom: 0;
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
                                    width: 180px;
                                    border: none;
                                    font-weight: 700;
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
                        justify-content: space-between;
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
                            gap: 20px;
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
                            box-shadow: 0 0 50px rgba(0, 0, 0, 0.3);

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
                            box-shadow: 0 0 50px rgba(0, 0, 0, 0.3);

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
                            box-shadow: 0 0 50px rgba(0, 0, 0, 0.3);
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
                        box-shadow: 0 0 50px rgba(0, 0, 0, 0.3);

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
                                    width: 200px;
                                    height: 30px;
                                    background-color: #004581;
                                    border-radius: 12px;
                                    color: #eee;
                                    border: none;
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
                                        box-shadow: 0 0 100px rgba(0, 0, 0, 0.3);
                                        background-color: #eee;
                                        padding: 20px;
                                        padding-top: 5px;
                                        margin-top: 20px;
                                        overflow-y: scroll;
                                        overflow-x: hidden;

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
                                width: 100%;
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
                                            margin-right: 80px;

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
        .addTask-form{
            position: absolute;
            top: 50vh;
            left: 50vw;
            transform: translateX(-50%)translateY(-50%);
            background-color: #c2dff8;
            width: 450px;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 100px rgba(0, 0, 0, 0.4);
            z-index: 10;
            .task-form{
                form{
                    display: flex;
                    flex-direction: column;
                    gap: 20px;

                    label{
                        font-size: 0.8rem;
                        color: #505181;
                    }
                    input{
                        height: 30px;
                        padding: 5px;
                        border-radius: 5px;
                        border: 1px solid #00458171;
                        background-color: transparent;
                        font-size: 0.8rem;
                    }
                    .btn-ctn{
                        display: flex;
                        justify-content: space-between;
                        gap: 10px;
                        button{
                            width: 100%;
                            padding: 10px;
                            border-radius: 5px;
                            border: none;
                            background-color: #004581;
                            color: #c2dff8;
                            font-weight: bold;
                            cursor: pointer;
                        }
                        .cancel-btn{
                            background-color: #c2dff8;
                            color: #004581;
                            border: 1px solid #004581;
                        }
                    }
                    
                }
            }
            .task-form h3{
                margin: 0;
                font-size: 1.2rem;
                text-align: center;
            }
            .task-form p{
                margin: 0;
                font-size: 0.8rem;
                text-align: center;
            }
        }
        .team-form{
            position: absolute;
            left: 50vw;
            top: 50vh;
            transform: translate(-50%, -40%);
            display: flex;
            flex-direction: column;
            gap: 10px;
            justify-content: center;
            align-items: center;
            width: 450px;
            padding: 20px;
            background-color: #c2dff8;
            border: 1px solid #948a8a42;
            border-radius: 12px;
            z-index: 10;
            box-shadow: 0 0 100px rgba(0, 0, 0, 0.3);
            .close-btn{
                transform: rotate(45deg);
                background-color: transparent;
                border: none;
                cursor: pointer;
            }
            h2{
                font-size: 1.5rem;
                color: #004581;
            }
            .team-search-section{
                width: 100%;
                p{
                    font-size: 0.8rem;
                    color: #004581;
                    text-align: center;
                }
                input{
                    width: 97%;
                    height: 30px;
                    border-radius: 5px;
                    border: 1px solid #948a8a42;
                    padding-left: 10px;
                    font-size: 0.8rem;
                }
                .build-btn,.invite-btn{
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 10px; 
                    width: 100%;
                    height: 30px;
                    border-radius: 5px;
                    border: none;
                    margin-top: 10px;
                    background-color: #004581;
                    color: #eee;
                    font-weight: 700;
                    cursor: pointer;
                    img{
                        width: 20px;
                        height: 20px;
                    }
                }
            }
            .member-research-result{
                display: flex;
                flex-direction: column;
                gap: 10px;
                width: 100%;
                height: 200px;
                overflow-y: auto;
                padding: 10px;
                border: 1px solid #948a8a42;   
                border-radius: 8px;
                .member-card{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    width: 95%;
                    height: 50px;
                    padding: 10px;
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    .member-image{
                        width: 50px;
                        height: 50px;
                        border-radius: 50%;
                        object-fit: cover;
                        background-color: #004581;
                    }
                    .member-info{
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        gap: 5px;
                        width: 55%;
                        h3{
                            margin: 0;
                            font-size: 1rem;
                            color:#004581;
                            text-align: center;
                            vertical-align: middle; 
                        }
                        p{
                            margin: 0;
                            font-size: 0.8rem;
                            color:#004581;
                            text-align: center;
                            vertical-align: middle;  
                            font-style: italic;
                        }
                    }
                    .invite-btn{
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        gap: 10px; 
                        width: 25%;
                        height: 30px;
                        border-radius: 5px;
                        border: none;
                        background-color: #004581;
                        color: #eee;
                        font-weight: 700;
                        cursor: pointer;
                    }
                }
            }
            .members-list{
                display: flex;
                flex-direction: column;
                gap: 10px;
                width: 100%;
                height: 200px;
                overflow-y: auto;
                padding: 10px;
                border: 1px solid #948a8a42;   
                border-radius: 8px;

                div{
                    width: 100%;
                    margin:0;
                    padding:0;

                    .member-item{
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 10px;
                        width: 95%;
                        height: 50px;
                        padding: 10px;
                        background-color: #fff;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        
                        .member-avatar{
                            width: 50px;
                            height: 50px;
                            border-radius: 50%;
                            object-fit: cover;
                            background-color: #004581;
                        }
                        .member-info{
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            gap: 5px;
                            width: 55%;
                            
                            .member-name{
                                margin: 0;
                                font-size: 1rem;
                                color:#004581;
                                text-align: center;
                                vertical-align: middle; 
                            }
                            .member-role{
                                margin: 0;
                                font-size: 0.8rem;
                                color:#004581;
                                text-align: center;
                                vertical-align: middle;  
                                font-style: italic;
                            }
                        }
                        .remove-btn{
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            gap: 10px; 
                            width: 25%;
                            height: 30px;
                            border-radius: 5px;
                            border: none;
                            background-color: #004581;
                            color: #eee;
                            font-weight: 700;
                            cursor: pointer;
                        }
                    }
                }
            }
            .close{
                width: 35px;
                height: 35px;
                border-radius: 50px;
                background-color: #c2dff8;
                border: none;
                cursor: pointer;
                img{
                    transform: rotate(45deg);
                    object-fit: cover;
                    object-position: center;
                }
            }
        }
    
</style>
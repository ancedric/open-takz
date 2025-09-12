<template>
    <section class="tasks-page">
        <div class="tasks-ctn">
            <div class="tasksList">
                <p class="link" @click="backHome">Home</p> 
                <form @submit="handleSearch">
                    <input type="search" class="searchBar" v-model="searchKey" placeholder="search a task">
                    <button class=" searchBtn">Search</button>
                </form> 
                <div class="tags">
                    <p :class="{tag: true, current: all}" @click="setAllTasks">All</p>
                    <p :class="{tag: true, current: completed}" @click="setCompletedTasks">Completed</p>
                    <p :class="{tag: true, current: inProgress}" @click="setInProgressTasks">In progress</p>
                </div>         
                <div v-if="displayedTasks.length === 0">
                    Aucune tâche...
                </div>
                <ul v-else>
                    <li 
                        v-for="todo in displayedTasks"
                        :class="{task: true, current: open && todo.id === selectedTodoId}" 
                        :key="todo.id"
                        @mouseover="displayOptions(todo.id)"
                        @mouseleave="hideOptions(todo.id)"
                        @click="displayTodo(todo.id, todo.title, todo.description, todo.steps, todo.progression, todo.date, todocompleted)"
                    >
                        <div class="data">
                            <label>
                                <input type="checkbox" v-model="todo.completed"/>
                                {{todo.title}}
                            </label>
                            <ProgressBar :percent="todo.progression"/>
                        </div>
                        <div class="progress">{{todo.progression}} %</div>
                        <div :class="{options:true, visible: showOptions && todo.id === selectedTodoId}" 
                            v-if="showOptions"
                            @click="openOptions = true"
                        >
                            <div class="dot"></div>
                            <div class="dot"></div>
                            <div class="dot"></div>
                        </div>
                        <div class="todoOptions" v-if="openOptions && todo.id === selectedTodoId">
                            <div class="option" @click="editTask(todo.id, todo.title, todo.description)">
                                <img src="/src/assets/images/edit.png">
                            </div>
                            <div class="option" @click="deleteTask(todo.id)">
                                <img src="/src/assets/images/corbeille.png">
                            </div>
                        </div>
                    </li>
                    
                </ul>
                
            </div>

            <div class="task-details">
                <div class="headers">
                    <ul class="caption-list">
                        <li :class="{caption: true, selected: stepsOpen}" @click="displaySteps">Steps</li>
                        <li :class="{caption: true, selected: descOpen}" @click="displayDesc">Description</li>
                        <li :class="{caption: true, selected: statsOpen}" @click="displayStats">Statistics</li>
                        <li :class="{caption: true, selected: attachmentOpen}" @click="displayAttachment">Attachments</li>
                    </ul>
                </div>
                <div class="contents">
                    <div class="descView" v-if="descOpen">
                        <div class="desc-ctn">
                            <h3> {{currentTodo.title}} <div class="progress">{{currentTodo.progression}} %</div> </h3>
                            <p class="desc"> {{currentTodo.description}} </p>
                        </div>
                    </div>
                    <div class="statsView" v-else-if="statsOpen">
                    <div class="desc-ctn">
                        <ProgressBar :percent="currentTodo.progression"/>
                        <p> Stats : {{currentTodo.date}} </p>
                    </div>
                    </div>
                    <div class="attachmentView" v-else-if="attachmentOpen">
                    <div class="desc-ctn">
                        <p>Here goes your files...</p>
                    </div>
                    </div>
                    <div class="stepsView" v-else>
                        <div class="steps">
                            <ul clas="step-list">
                                <li class="list-elem" v-for="step in currentTodo.steps" :key="step.id">
                                    <div v-if="step.taskID === currentTodo.id" :class="{label: true, done:step.done === true}" @click="switchArrow(step.id)">
                                        <p class="step-name">
                                            {{step.title}} 
                                        </p>
                                        <svg v-if="step.done" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#75FB4C">
                                            <path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
                                        </svg>
                                        <svg v-if="step.id === currentStepId && showStep" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#EFEFEF">
                                            <path d="m296-345-56-56 240-240 240 240-56 56-184-183-184 183Z"/>
                                        </svg>
                                        <svg  v-else xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#EFEFEF">
                                            <path d="M480-345 240-585l56-56 184 183 184-183 56 56-240 240Z"/>
                                        </svg>
                                    </div>
                                    <div class="step-details" v-if="step.id === currentStepId && showStep">
                                        <div class="deadlines">
                                            <div class="times-ctn">
                                                <div class="times">
                                                    <div class="time">
                                                        <div  class="c green">
                                                            <div class="time-title">{{step.start}}</div>
                                                        </div>
                                                    </div>
                                                    <div class="time">
                                                        <div class="c red">
                                                            <div class="time-title">{{step.end}}</div>
                                                        </div>
                                                    </div>
                                                    <div class="time">
                                                        <div class="c orange">
                                                            <div class="time-title">{{step.end}}</div>
                                                        </div>
                                                    </div>
                                                    <div class="time">
                                                        <div class="c blue">
                                                            <div class="time-title">{{step.end}}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="timer">
                                                    <div class="diagram">00 : 00 : 00</div>
                                                    <button :class="{check: step.done, checked: !step.done}" @click="check(step.id, step)">
                                                        {{!step.done ? "Stop" : "Start"}}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="legend">
                                            <div class="data">
                                                <div class="c green">
                                                    <div class="info">start time</div>
                                                </div>
                                            </div>
                                            <div class="data">
                                                <div class="c red">
                                                    <div class="info">end time</div>
                                                </div>
                                            </div>
                                            <div class="data">
                                                <div class="c orange">
                                                    <div class="info">completion time</div>
                                                </div>
                                            </div>
                                            <div class="data">
                                                <div class="c blue">
                                                    <div class="info">extra time</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    <Alert type="danger" action="error" v-if="errors"/>
    <Alert type="success" action="added" v-if="success"/>
    </section>
</template>

<script setup>
    import axios from 'axios'
    import { ref, computed, onMounted } from 'vue'
    import ProgressBar from '../components/ProgressBar.vue'
    import {useRouter} from "vue-router" 
    import { useProfileStore } from '../store/profile'

    const hideCompleted = ref(false)
    const currentTodo = ref('')
    const tasks = ref([])
    const steps = ref([])
    const open = ref(false)
    const selectedTodoId= ref(null)
    const currentStepId = ref(null)
    const router = useRouter()
    const profileStore = useProfileStore()
    const showOptions = ref(false)
    const openOptions= ref(false)
    const all = ref(true)
    const completed = ref(false)
    const inProgress = ref(false)
    const success = ref(false)
    const errors = ref(false)
    const descOpen = ref(false)
    const statsOpen = ref(false)
    const attachmentOpen = ref(false)
    const stepsOpen = ref(true)
    const showStep = ref(false)

    const getTaskSteps = async (taskId) => {
        const { data, error } = await supabase 
        .from('TaskSteps')
        .select('*')
        .eq('taskID', taskId)

        if(error){
            console.log(error);
            return []
        }
        if(data){
            return data
        }
    };

    const getTasks = async () => {
  const storedTasks = localStorage.getItem('tasks');
  if (storedTasks) {
    tasks.value = JSON.parse(storedTasks);
  } else {
    const { data, error } = await supabase
      .from('Tasks')
      .select('*')
      .eq('ownerId', profileStore.profile.id);

    if (error) {
      console.log(error);
      return [];
    }
    if (data) {
      const tasksWithSteps = await Promise.all(data.map(async (task) => {
        const steps = await getTaskSteps(task.id);
        return { ...task, steps };
      }));
      tasks.value = tasksWithSteps;
      localStorage.setItem('tasks', JSON.stringify(tasks.value));
      console.log('tasks :', tasks.value);
      return tasksWithSteps;
    }
  }
  displayedTasks.value = sortedTasks()
};

const switchArrow = (stepId) => {
    currentStepId.value = stepId
    showStep.value = !showStep.value
}

const displaySteps = () => {
    stepsOpen.value = true
    statsOpen.value = false
    descOpen.value = false
    attachmentOpen.value = false
}
const displayDesc = () => {
    descOpen.value = true
    stepsOpen.value = false
    statsOpen.value = false
    attachmentOpen.value = false
}
const displayStats = () => {
    statsOpen.value = true
    stepsOpen.value = false
    descOpen.value = false
    attachmentOpen.value = false
}
const displayAttachment = () => {
    attachmentOpen.value = true
    stepsOpen.value = false
    statsOpen.value = false
    descOpen.value = false
}
const handleSearch = () =>{}
    
onMounted(async () => {
  await getTasks();
});
    

    const sortedTasks = () => {
        all.value = true
        completed.value = false
        inProgress.value = false
        if(tasks.value.length === 0 || tasks.value === undefined ){
            return []
        }
        return tasks.value.sort((a, b) => a.id > b.id ? -1 : 1)
    }

    const alreadyCompletedTasks = () => {
        all.value = false
        completed.value = true
        inProgress.value = false
        if(tasks.value.length === 0 || tasks.value === undefined ){
            return []
        }
        return tasks.value.sort((a, b) => a.id > b.id ? -1 : 1).filter(t => hideCompleted.value === true || t.completed === true)
    }
    const tasksInProgress = () => {
        all.value = false
        completed.value = false
        inProgress.value = true
        if(tasks.value.length === 0 || tasks.value === undefined ){
            return []
        }
        return tasks.value.sort((a, b) => a.id > b.id ? -1 : 1).filter(t => hideCompleted.value === false || t.completed === false)
    }

    
    const displayedTasks = ref(sortedTasks())

    const setAllTasks = computed( () =>{
        console.log('setAllTasks is called')
        displayedTasks.value = sortedTasks()
        console.log(displayedTasks.value)
    })
    const setCompletedTasks = computed(() =>{
        console.log('setCompletedTasks is called')
        displayedTasks.value = alreadyCompletedTasks()
        console.log(displayedTasks.value)
    })
    const setInProgressTasks = computed(() =>{
        console.log('setInProgressTasks is called')
        displayedTasks.value = tasksInProgress()
        console.log(displayedTasks.value)
    })
    
    //setAllTasks()
    const displayTodo = (id, title, description, steps, progression, date, completed) =>{
    open.value = true
    selectedTodoId.value = id
    currentTodo.value = {
        id,
        title,
        description,
        steps,
        progression,
        date,
        completed,
    }
}
const displayOptions = (id) =>{
    showOptions.value = true
    selectedTodoId.value = id
}
const hideOptions = (id) =>{
    selectedTodoId.value = id
    showOptions.value = false
    openOptions.value = false
}

const editTask = (id, title, description) => {
    router.replace({path: `/editTask/${id}/title/${title}/desc/${description}`})
}
const deleteTask = async (id) => {
    const { data, error } = await supabase
        .from('Tasks')
        .delete()
        .eq('id', id)

        if(error){
            console.log("Erreur lors de la mise à jour de la tâche :",error)
            errors.value = true

            setTimeout(() => error.value = false , 3000)
        }
        if(data){
            success.value = true
            router.push('/tasks')

            setTimeout(() => success.value = false , 3000)
        }
    }

    const check = async (stepId) => {
        const stepIndex = currentTodo.value.steps.findIndex((step) => step.id === stepId)
        const step = currentTodo.value.steps[stepIndex]

        if (step.done) {
            // Décocher l'étape
            step.done = false
            const { data, error } = await supabase
            .from('TaskSteps')
            .update({ done: false })
            .eq('id', stepId)

            // Mettre à jour la progression de la tâche
            const nbDoneSteps = currentTodo.value.steps.filter((step) => step.done).length
            const progression = (nbDoneSteps / currentTodo.value.steps.length) * 100
            currentTodo.value.progression = progression
            await supabase
            .from('Tasks')
            .update({ progression: progression })
            .eq('id', currentTodo.value.id)

            // Vérifier si la tâche est toujours complétée
            if (currentTodo.value.completed) {
            // Mettre à jour l'attribut completed
            currentTodo.value.completed = false
            await supabase
                .from('Tasks')
                .update({ completed: false })
                .eq('id', currentTodo.value.id)
            }
        } else {
            // Cocher l'étape
            step.done = true
            const { data, error } = await supabase
            .from('TaskSteps')
            .update({ done: true })
            .eq('id', stepId)

            // Mettre à jour la progression de la tâche
            const nbDoneSteps = currentTodo.value.steps.filter((step) => step.done).length
            const progression = (nbDoneSteps / currentTodo.value.steps.length) * 100
            currentTodo.value.progression = progression
            await supabase
            .from('Tasks')
            .update({ progression: progression })
            .eq('id', currentTodo.value.id)

            // Vérifier si toutes les étapes sont complétées
            if (nbDoneSteps === currentTodo.value.steps.length) {
            // Mettre à jour l'attribut completed
            currentTodo.value.completed = true
            await supabase
                .from('Tasks')
                .update({ completed: true })
                .eq('id', currentTodo.value.id)
            }
        }
    }
const backHome = () =>{
    router.push({path: "/home"})
}
</script>

<style scoped>
    .tasks-page{
        margin: 0;
        padding: 0;
        width:100%;
        height:100%;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        &::-webkit-scrollbar{
            display: none;
        }
    }
    .link{
        padding-left: 50px;
        font-family: Inter;
        font-size: 0.8rem;
        font-weight: 400;
        text-decoration: none;
        color: #004581;
        cursor: pointer;
    }
    .tasks-ctn{
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin: 0;
        background-color: #eee;
        &::-webkit-scrollbar{
            display: none;
        }
        @media screen and (max-width: 860px){
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
        }
    }

    .searchBar{
        width: 60%;
        height: 25px;
        padding-left: 10px;
        margin-right: 5px;
        border: 1px solid;
        border-radius: 5px;
    }

    .searchBtn{
        height: 25px;
        margin-left: 5px;
        border: none;
        background-color:#2a2f4f;
        color: #eee;
        border-radius: 5px;
    }
    .tasksList{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 33vw;
        height: 100vh;
        background-color: #4e4f5048;
        overflow-y: scroll;
        overflow-x: hidden;
        &::-webkit-scrollbar{
            width: 5px;
            background-color: #4e4f5048;
            border-radius: 50px;
        }
        @media screen and (max-width: 860px){
            width: 100%;
        }
    }
    .tasksList ul{
        width: 100%;
        
        @media screen and (max-width: 860px){
            height: 60%;
        }
    }
    .tasksList ul .task{
        list-style-type: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding-left: 10px;
        font-family: Inter;
        font-weight: 400;
        font-size: 1rem;
        text-align: left;
        width: 300px;
        height: 60px;
        background-color: #97cbdc;
        color: #004581;
        margin-bottom: 10px;
        border-radius: 10px;
        transition: all 0.3s ease;
        position: relative;
        @media screen and (max-width: 860px){
            width: 80%;
            justify-content: flex-start;
        }
    }
    .tasksList ul .task .options{
        opacity: 0;
        width: 30px;
        height: 30px;
        transition: all 0.3s ease;
        cursor: pointer;
    }
    .tasks-list ul .task .visible{
        opacity: 1;
    }
    .tasksList ul .task .options .dot{
        width: 5px;
        height: 5px;
        margin-bottom: 3px;
        border-radius: 50px;
        background-color: #0e0e0e;
    }

    .tasksList ul .task .todoOptions{
        position: absolute;
        right: -30px;
        width: 60px;
        height: 50px;
    }
    .tasksList ul .task .todoOptions .option{
        width: 50%;
        height: 50%;
        color: grey;
        padding-left: 25px;
    }
    .tasksList ul .task .todoOptions .option img{
        width: 100%;
        height: 100%;
    }
    .task-details{
        width: 65vw;
        height: 100vh;
        overflow-y: scroll;
        overflow-x: hidden;
        background-color: #eee;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        color: #348feb;
        padding: 10px;
        font-family: Inter;
        &::-webkit-scrollbar{
            width: 5px;
            background-color: #4e4f5048;
            border-radius: 50px;
        }
        @media screen and (max-width: 860px){
            justify-content: flex-start;
            width: 100%;
            font-size: 0.8rem;
            padding: 10px;
        }
    }
    .task-details .details-ctn{
        width: 100%;
        height: 100%;
        margin: 0;
        @media screen and (max-width: 860px){
            width: 80%;
        }
    }
    .headers{
        width: 100%;
        border-bottom : 1px solid;
        padding-bottom: 0;
    }
    .caption-list{
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0;
    }
    .caption{
        list-style-type: none;
        background-color: #c0bfbf;
        width: 23%;
        height: 30px;
        padding: 5px;
        text-align: center;
        cursor: pointer;
        transition: all .3s ease; 
    }
    .caption.selected{
        background-color: #eee;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        box-shadow: 0 -5px 10px rgba(0, 0, 0, 0.5);
    }
    .task-details .details-ctn .steps{
        padding: 0;
    }
    .contents{
        width: 100%;
        height:80%;
        padding: 25px;
    }
    .statsView,
    .stepsView,
    .descView,
    .attachmentView{
        width:100%;
        height: 100%;
    }
    .desc-ctn{
        text-align: center;
    }
    .desc-ctn h3{
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        width: 100%;
        height: 50px;
        @media screen and (max-width: 860px){
            gap: 5px;
            width: 80%;
            height:30px;
            font-size: 1rem;
        }
    }
    /*.task-details .details-ctn .desc{
        width: 300px;
        height: 70px;
        border: 1px solid #6b3e26;
        font-weight: 300;
        font-size: 0.8rem;
        padding: 20px;
        @media screen and (max-width: 860px){
            width: 90%;
            height: 70px;
            font-size: 0.8rem;
        }
    }*/
    .list-elem{
        list-style-type: none;
        margin-left: 0;
    }
    .list-elem .label{
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: Inter;
        font-weight: 400;
        font-size: 0.7rem;
        width: 100%;
        background-color:rgb(146, 145, 221);
        color: #eee;
        margin-bottom: 0;
        margin-top: 10px;
        border-radius: 5px;
        @media screen and (max-width: 860px){
            width:100%;
            height: 30px;
            font-size: 0.7rem;
        }
    }
    .step-details{
        width: 100%;
        background-color: #c0bfbf;
        margin-top:0;
    }
    .times-ctn{
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    }
    .deadlines{
        width: 100%;
    }
    .legend{
        display: flex;
        justify-content: space-between;
        width: 100%;
    }
    .legend .data{
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 15px;
        width: 100%;
    }
    .legend .info{
        width: 200px;
        margin-left: 20px;
        padding-left: 10px;
        font-size: 0.8rem;
    }
    .times{
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        margin: 15px;
        width: 85%;
    }
    .time{
        display: flex;
        justify-content: space-between;
        align-items:center;
        width: 100%;
        height: 50px;
    }
    .time .time-title{
        width: 200px;
        margin-left: 20px;
        padding-left: 10px;
    }
    .c.green{
        background-color: green;
    }
    .c.red{
        background-color: red;
    }
    .c.orange{
        background-color: orange;
    }
    .c.blue{
        background-color: blue;
    }
    .c.green,
    .c.red,
    .c.orange,
    .c.blue{
        width: 20px;
        height:20px;
        border-radius: 50px;
        margin-right: 20px;
    }
    .timer{
        display: flex;
        flex-direction: column;
        justify-content: center; 
        align-items: center;
        width: 100%;
    }
    .diagram{
        display: flex;
        justify-content: center;
        align-items: center;
        width: 200px;
        height: 200px;
        border: 20px solid yellow;
        border-radius: 50%;
        margin: 10px;
    }
    .step-name{
        text-wrap: nowrap;
        padding-left: 5px;
        margin-right: 5px;
        font-size: 1rem;
    }
    .tasks-list ul .task .data{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: start;
        width: 200px;
        @media screen and (max-width: 860px){
            width: 80%;
        }
    }
    .progress{
        color: #ff9201;
        font-weight: 700;
        font-size: 1.2rem;
        width: 80px;
    }
    .tasks-list ul .task.current{
        background-color: #8fc79a;
        color: #2d8d79;
        box-shadow: 1px 1px 50px rgba(0, 0, 0, 0.3);
    }
    .steps{
        padding: 30px;
        height: 100%;
        overflow-y: scroll;
        &::-webkit-scrollbar{
            width: 5px;
        }
        &::-webkit-scrollbar-thumb{
            background: none;
            border-radius: 10px;
        }
        @media screen and (max-width: 860px){
            height:300px;
            width: 100%;
            padding: 0;
            font-size: 0.8rem;
        }
    }
    .tags{
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
    }
    .tag{
        height: 20px;
        padding-left: 5px;
        padding-right: 5px;
        font-family: Inter;
        font-size: 0.8rem;
        text-align: center;
        border-radius: 5px;
        background-color: #778fa5;
        cursor: pointer;
    }
    .tag.current, .current{
        background-color: #8fc79a;
        color: #2d8d79;
        box-shadow: 1px 1px 50px rgba(0, 0, 0, 0.3);
    }
    .check,
    .checked{
        width: 250px;
        height: 35px;
        border: none;
        border-radius: 5px;
        color: #eee;
        cursor: pointer;
    }
    .check{
        background-color:#0c0e79;
    }
    .checked{
        background-color:#f80b0b;
    }
</style>
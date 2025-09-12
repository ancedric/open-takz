import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from './views/LandingPage.vue'
import Home from './views/Home.vue'
import Project from './views/Project.vue'
import ProjectViewer from './views/ProjectViewer.vue'
import Teams from './views/Teams.vue'
import TeamViewer from './views/TeamViewer.vue'
import AddTask from './components/AddTask.vue'
import EditTask from './views/EditTask.vue'
import Tasks from './views/Tasks.vue'
import Profile from './views/Profile.vue'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import ConfirmEmail from './views/ConfirmEmail.vue'
import EditProfile from './views/EditProfile.vue'
import SetProfile from './views/SetProfile.vue'
import Pricing from './views/Pricing.vue'
import UsersConditions from './views/UserSConditions.vue'
import PrivacyPolicy from './views/PrivacyPolicy.vue'
import LegalNotice from './views/LegalNotice.vue'
import Support from './views/Support.vue'

const routes = [
  { path: '*', component: Home },
  { path: '/', component: LandingPage },
  { path: '/home', component: Home },
  { path: '/project/:userRef', component: Project },
  { path: '/project-viewer', component: ProjectViewer },
  { path: '/teams', component: Teams },
  { path: '/team-viewer', component: TeamViewer },
  { path: '/addTask/:title', component: AddTask },
  { path: '/editTask/:id/title/:title/desc/:description', component: EditTask },
  { path: '/tasks', component: Tasks },
  { path: '/profile', component: Profile },
  { path: '/auth', component: Login },
  { path: '/register', component: Register },
  { path: '/confirmation', component: ConfirmEmail },
  { path: '/editProfile', component: EditProfile },
  { path: '/setProfile', component: SetProfile },
  { path: '/pricing', component: Pricing },
  { path: '/usersConditions', component: UsersConditions },
  { path: '/privacyPolicy', component: PrivacyPolicy },
  { path: '/legalNotice', component: LegalNotice },
  { path: '/support', component: Support },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
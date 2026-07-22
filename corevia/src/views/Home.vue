<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import supabase from '../services/supabaseConfig.js';
import defaultNews from '../assets/images/news.jpg';
import companyImg from '../assets/images/company.png';
import { useUserStore } from '../store/index.js';
import AppIcon from '../components/AppIcon.vue';

const {t} = useI18n()
const userStore = useUserStore();
const jobs = ref([]);
const filterSearch = ref('');
const filterType = ref('all');
const selectedJob = ref(null);
const isUploading = ref(false);
const selectedFile = ref(null);
const myApplications = ref([]);

const formApp = ref({
  firstname: '',
  lastname: '',
  email: '',
  resume_url: ''
});

const userStats = ref({
    appliedCount: 0,
    interviewsCount: 0,
    savedCount: 0
});

const toast = ref({ show: false, message: '', type: 'success' });
const showCompanyModal = ref(false);
const selectedCompany = ref(null);
const showDetailsModal = ref(false);
const jobDetails = ref(null);
const openJobDetails = (job) => {
    jobDetails.value = job;
    showDetailsModal.value = true;
    console.log(jobDetails.value);
};

  const triggerToast = (message, type = 'success') => {
      toast.value = { show: true, message, type };
      setTimeout(() => {
          toast.value.show = false;
      }, 4000); // Disparaît après 4 secondes
  };

const openApplyModal = (job) => {
    selectedJob.value = job;
};

const hasApplied = (jobRef) => {
    return myApplications.value.some(app => app.jobref === jobRef);
};

const viewCompanyProfile = (company) => {
    selectedCompany.value = company;
    showCompanyModal.value = true;
};

const fetchMyApplications = async () => {
    try {
        const userEmail = userStore.user?.email || userStore.user?.user?.email;
        if (!userEmail) return;

        const { data, error } = await supabase
            .from('applications')
            .select('jobref') // On ne récupère que les références pour la comparaison
            .eq('email', userEmail);

        if (!error) {
            myApplications.value = data || [];
        }
    } catch (err) {
        console.error("Erreur lors de la récupération des candidatures:", err);
    }
};

const fetchUserStats = async () => {
    try {
        // On récupère l'email de l'utilisateur connecté via le store
        const userEmail = userStore.user?.user.email;
        if (!userEmail) return;

        // 1. Compter les candidatures envoyées
        const { count: applied, error: err1 } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('email', userEmail);

        // 2. Compter les invitations (status 'accepted' ou 'reviewed')
        const { count: interviews, error: err2 } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('email', userEmail)
            .in('status', ['accepted', 'reviewed']);

        if (!err1 && !err2) {
            userStats.value.appliedCount = applied || 0;
            userStats.value.interviewsCount = interviews || 0;
        }
    } catch (err) {
        console.error("Erreur stats utilisateur:", err);
    }
};

// Récupérer les annonces actives
const itemsPerPage = 5;
const currentPage = ref(0);
const hasMore = ref(true);
const isLoadingMore = ref(false);

const fetchJobs = async (isFirstLoad = true) => {
    if (isFirstLoad) {
        currentPage.value = 0;
        jobs.value = [];
        hasMore.value = true;
    }
    
    if (!hasMore.value || isLoadingMore.value) return;

    isLoadingMore.value = true;
    
    const start = currentPage.value * itemsPerPage;
    const end = start + itemsPerPage - 1;

    const { data, error } = await supabase
        .from('jobs')
        .select('*, company:companyref (*)')
        //.gt('deadline', new Date().toISOString())
        .order('created_at', { ascending: false })
        .range(start, end); // pagination ici

    if (!error) {
        if (data.length < itemsPerPage) hasMore.value = false;
        jobs.value = [...jobs.value, ...data];
        currentPage.value++;
    }
    isLoadingMore.value = false;
};

// Détecter le scroll
const handleScroll = () => {
    const scrollContainer = document.documentElement;
    if ((window.innerHeight + window.scrollY) >= scrollContainer.offsetHeight - 500) {
        fetchJobs(false);
    }
};

const savedJobsList = ref([]);

const fetchSavedJobs = async () => {
    const userRef = userStore.user?.user?.userref; // Vérifie bien ton chemin d'accès au store
    if (!userRef) return;

    const { data, error } = await supabase
        .from('saved_jobs')
        .select(`
            id,
            jobref,
            jobs:jobref (
                *,
                company:companyref (companyname, logo_url)
            )
        `)
        .eq('userref', userRef);

    if (!error) {
        savedJobsList.value = data || [];
        userStats.value.savedCount = data.length; // On met à jour le compteur en même temps
    }
};

// Filtrage dynamique
const filteredJobs = computed(() => {
  if (!jobs.value || jobs.value.length === 0) return [];

  return jobs.value.filter(j => {
    const title = j.title || j.jobname || ""; 
    const matchSearch = title.toLowerCase().includes(filterSearch.value.toLowerCase());
    const matchType = filterType.value === 'all' || j.type === filterType.value;

    return matchSearch && matchType;
  });
});

const handleFileUpload = (event) => {
    selectedFile.value = event.target.files[0];
};

const uploadToStorage = async (file) => {
    try {
        // Validation basique avant l'envoi
        if (file.size > 5 * 1024 * 1024) { // Limite à 5Mo
            throw new Error("Le fichier est trop volumineux (max 5Mo)");
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `applications/${fileName}`;

        const { data, error } = await supabase.storage
            .from('recruitment')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            // Ici, l'erreur vient souvent du Bucket (nom mal orthographié ou pas public)
            throw error;
        }

        const { data: publicUrlData } = supabase.storage
            .from('recruitment')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    } catch (error) {
        // On remonte l'erreur pour qu'elle soit captée par publishAnnounce
        throw error; 
    }
};

const submitApplication = async () => {
    isUploading.value = true;
    try {
        let fileUrl = null;

        if (selectedFile.value) {
            // Afficher un toast de chargement si nécessaire
            triggerToast("Téléchargement de l'image...", "info");
            
            fileUrl = await uploadToStorage(selectedFile.value);
            formApp.value.resume_url = fileUrl
            
            if (!fileUrl && selectedJob.value.type === 'recrutement') throw new Error("Impossible de générer l'URL du fichier");
        }

        const appRef = 'APP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        // 1. Insertion dans la table applications
        const { error: appError } = await supabase.from('applications').insert({
            appref: appRef,
            candidate_ref: userStore.user.user.userref,
            jobref: selectedJob.value.jobref,
            ...formApp.value,
            status: 'pending'
        });

        if (appError) throw appError;

        // 2. Insertion dans ta table notifications existante
        const notifRef = 'NOTIF-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        await supabase.from('notifications').insert({
            notifref: notifRef,
            title: "Nouvelle Candidature",
            content: `${formApp.value.firstname} a postulé pour : ${selectedJob.value.title}`,
            isread: false,
            userref: selectedJob.value.created_by,
            createdat: new Date().toISOString()
        });

        // --- AUTOMATISATION : Sauvegarder le job  ---
        if (!isJobSaved(selectedJob.value.jobref)) {
            await supabase.from('saved_jobs').insert({ 
                userref: userStore.user?.user?.ref, 
                jobref: selectedJob.value.jobref 
            });
            await fetchSavedJobs(); 
        }
        toggleSaveJob(selectedJob.value);
        userStats.value.appliedCount += 1;
        myApplications.value.push({ jobref: selectedJob.value.jobref });
        // 3. Déclenchement du Pop-up au lieu de l'alert
        triggerToast("Candidature envoyée avec succès !", "success");
        selectedJob.value = null;

    } catch (err) {
        triggerToast("Erreur lors de l'envoi", "error");
    } finally {
        isUploading.value = false;
    }
};

const toggleSaveJob = async (job) => {
    const userRef = userStore.user?.user?.userref;
    if (!userRef) return triggerToast("Connectez-vous !", "error");

    const index = savedJobsList.value.findIndex(s => s.jobref === job.jobref);

    if (index !== -1) {
        // Suppression locale immédiate pour la réactivité
        savedJobsList.value.splice(index, 1);
        
        const { error } = await supabase
            .from('saved_jobs')
            .delete()
            .eq('userref', userRef)
            .eq('jobref', job.jobref);

        if (error) {
            fetchSavedJobs(); // Recharger en cas d'échec
            triggerToast("Erreur lors de la suppression", "error");
        } else {
            triggerToast("Retiré des favoris", "info");
        }
    } else {
        // Ajout local immédiat (Optimistic UI)
        const newFavorite = { jobref: job.jobref, jobs: job };
        savedJobsList.value.push(newFavorite);

        const { error } = await supabase
            .from('saved_jobs')
            .insert({ userref: userRef, jobref: job.jobref });

        if (error) {
            fetchSavedJobs(); // Recharger en cas d'échec
            triggerToast("Erreur lors de l'enregistrement", "error");
        } else {
            triggerToast("Annonce enregistrée !", "success");
        }
    }
    fetchUserStats(); 
};

// Fonction utilitaire pour le template
const isJobSaved = (jobRef) => {
    return savedJobsList.value.some(s => s.jobref === jobRef);
};

onMounted(async () => {
    await fetchJobs();
    await fetchUserStats();
    await fetchSavedJobs();
    await fetchMyApplications();
});
onMounted(() => {
    window.addEventListener('scroll', handleScroll);
    fetchJobs();
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});

</script>
<template>
    <transition name="toast-fade">
        <div v-if="toast.show" :class="['toast-popup', toast.type]">
            <div class="toast-content">
                <img v-if="toast.type === 'success'" src="../assets/icons/checked.png" class="icon">
                <p>{{ toast.message }}</p>
            </div>
            <div class="progress-bar"></div>
        </div>
    </transition>
  <div class="job-board">
    <header class="board-header">
      <h1>{{t('home.news')}} </h1>
      <p>{{t('home.join')}}</p>
      
      <div class="filters">
        <input type="text" v-model="filterSearch" :placeholder="t('home.search-post')">
        <select v-model="filterType">
          <option value="all">{{t('home.all-types')}}</option>
          <option value="recrutement">{{t('home.recruitments')}}</option>
          <option value="evenement">{{t('home.events')}}</option>
        </select>
      </div>
    </header>

    <div class="feed-container">
      
      <main class="jobs-feed">
          <div v-for="job in filteredJobs" :key="job.jobref" class="social-card">
            <div class="card-header">
                <img :src="job.company?.logo_url || companyImg" class="company-avatar">
                <div class="header-info">
                    <span class="company-name-link" @click="viewCompanyProfile(job.company)">
                        {{ job.company?.companyname }}
                    </span>
                    <span class="post-date">{{ job.created_at.split('T')[0] }} • <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg> {{ job.location }}</span>
                </div>
                <div class="job-badge" :class="job.type">{{ job.type }}</div>
            </div>

            <div class="card-content">
                <h2 class="job-title">{{ job.title }}</h2>
                <p class="description">{{ job.description }}</p>
            </div>

            <div class="job-cover" v-if="job.file_url">
                <img :src="job.file_url" alt="Cover">
            </div>

            <div class="card-footer">
                <button @click="openApplyModal(job)" class="apply-btn-social">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
                        <path d="M9 12H4s.5-1 1-4c2 1 3 2 4 4z"></path>
                    </svg>
                    {{ job.type === 'recrutement' ? t('home.apply') : t('home.book') }}
                </button>
                
                <button @click="toggleSaveJob(job)" class="save-btn" :class="{ 'is-saved': isJobSaved(job.jobref) }">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
                    </svg>
                    {{ isJobSaved(job.jobref) ? t('home.registered') : t('home.register') }}
                </button>
            </div>

            <span class="post-date">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {{ job.location }}
            </span>
        </div>
        <div v-if="isLoadingMore" class="loading-trigger">
            <span class="spinner"></span> {{t('home.loading-opportunities')}}
        </div>
        <div v-if="!hasMore && jobs.length > 0" class="loading-trigger">
                ✨ {{t('home.seen-recent-opportunities')}}
        </div>
    </main>

    <aside class="sidebar">
        <div class="sidebar-widget profile-widget">
            <div class="widget-header">{{t('home.my-career')}}</div>
            <div class="profile-stats-grid">
                <div class="stat-item">
                    <div class="icon-box blue">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <div class="stat-info">
                        <strong>{{ userStats.appliedCount }}</strong>
                        <span>{{t('home.applied')}}</span>
                    </div>
                </div>
                
                <div class="stat-item">
                    <div class="icon-box green">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <div class="stat-info">
                        <strong>{{ userStats.interviewsCount }}</strong>
                        <span>{{t('home.responses')}}</span>
                    </div>
                </div>
            </div>
        </div>

            <div class="sidebar-widget saved-jobs-widget">
                <div class="widget-header">{{t('home.not-to-miss')}}</div>
                <div class="saved-list">
                    <div v-for="event in jobs.filter(j => j.type === 'evenement').slice(0,2)" :key="event.jobref" @click="openJobDetails(event)" class="saved-card-mini">
                        <img :src="event.company?.logo_url || companyImg" class="mini-logo">
                        <div class="mini-details">
                            <p class="mini-title">{{ event.title }}</p>
                            <p class="mini-company">{{ event.company?.companyname }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="sidebar-widget saved-jobs-widget">
                <div class="widget-header">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="header-icon">
                        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
                    </svg>
                    {{t('home.my-favourites')}}
                </div>
                
                <div class="saved-list">
                    <div v-for="saved in savedJobsList" :key="saved.id"  @click="openJobDetails(saved.jobs)" class="saved-card-mini" >
                        <img :src="saved.jobs?.company?.logo_url || companyImg" class="mini-logo">
                        <div class="mini-details">
                            <p class="mini-title">{{ saved.jobs?.title }}</p>
                            <p class="mini-company">{{ saved.jobs?.company?.companyname }}</p>
                            <span v-if="hasApplied(saved.jobref)" class="mini-status-tag">{{t('home.sent')}}</span>
                        </div>
                        <button @click="toggleSaveJob(saved.jobs)" class="remove-favorite">✕</button>
                    </div>
                    
                    <div v-if="savedJobsList.length === 0" class="empty-favorites">
                        <p>{{t('home.no-anouncement-registered')}}</p>
                    </div>
                </div>
            </div>
        </aside>

    </div>

    </div>
    <div class="modal-overlay" v-if="showCompanyModal" @click.self="showCompanyModal = false">
        <div class="company-modal">
            <div class="modal-banner"></div>
            
            <button class="modal-close-icon" @click="showCompanyModal = false">✕</button>

            <div class="modal-body">
                <div class="company-header">
                    <img :src="selectedCompany?.logo_url || companyImg" class="modal-logo">
                    <div class="header-titles">
                        <h3>{{ selectedCompany?.companyname }}</h3>
                        <span class="location-tag">📍 {{ selectedCompany?.country || t('home.undefined-country') }}</span>
                    </div>
                </div>

                <div class="company-section">
                    <h4>{{t('home.about')}}</h4>
                    <p class="company-bio">{{ selectedCompany?.about || t('home.no-description-provided') }}</p>
                </div>

                <div class="company-info-grid">
                    <div class="info-item">
                        <label>{{t('home.activity-sector')}}</label>
                        <span>{{ selectedCompany?.activity || t('home.undefined') }}</span>
                    </div>
                    <div class="info-item">
                        <label>{{t('home.official-email')}}</label>
                        <span>{{ selectedCompany?.email || t('home.undefined') }}</span>
                    </div>
                    <div class="info-item">
                        <label>{{t('home.contact')}}</label>
                        <span>{{ selectedCompany?.phone || t('home.undefined') }}</span>
                    </div>
                    <div class="info-item">
                        <label>{{t('home.headquarters')}}</label>
                        <span>{{ selectedCompany?.address || t('home.undefined') }}</span>
                    </div>
                    <div class="info-item">
                        <label>{{t('home.legal-form')}}</label>
                        <span>{{ selectedCompany?.legal_form || t('home.undefined')}}</span>
                    </div>
                    <div class="info-item">
                        <label>{{t('home.register-number')}}</label>
                        <span>{{ selectedCompany?.register_number || t('home.undefined') }}</span>
                    </div>
                    <div class="info-item">
                        <label>{{t('home.creation-date')}}</label>
                        <span>{{ selectedCompany?.createdat.split('T')[0].toLocaleString() || t('home.undefined') }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

        <div class="modal-overlay" v-if="selectedJob">

            <div class="apply-modal">

                <h3>{{t('home.apply-for')}} {{ selectedJob.title }}</h3>

                <form @submit.prevent="submitApplication">

                    <div class="form-row">

                        <input type="text" v-model="formApp.firstname" placeholder="{{t('signup.first-name')}}" required>

                        <input type="text" v-model="formApp.lastname" placeholder="{{t('signup.last-name')}}" required>

                    </div>

                    <input type="email" v-model="formApp.email" placeholder="{{t('home.your-email')}}" required>


                    <div class="file-upload" v-show="selectedJob.type === 'recrutement'">

                        <label>{{t('home.upload-your-cv')}}</label>

                        <input type="file" @change="handleFileUpload" accept=".pdf" :required="selectedJob.type === 'recrutement'">

                    </div>



                    <div class="modal-actions">

                        <button type="submit" class="confirm-btn" :disabled="isUploading">

                        {{ isUploading ? t('home.sending') : !isUploading && selectedJob.type === 'recrutement' ? t('home.send-application') : t('home.send-reservation') }}

                        </button>

                        <button type="button" @click="selectedJob = null" class="close-btn">{{t('home.cancel')}}</button>

                    </div>

                </form>

            </div>

        </div>
        <div class="modal-overlay" v-if="showDetailsModal" @click.self="showDetailsModal = false">
            <div class="job-details-modal">
                <div class="details-header">
                    <img :src="jobDetails?.company?.logo_url || companyImg" class="details-logo">
                    <div class="details-titles">
                        <h3>{{ jobDetails?.title }}</h3>
                        <p>{{ jobDetails?.company?.companyname }} • {{ jobDetails?.location }}</p>
                    </div>
                    <button class="close-x" @click="showDetailsModal = false">✕</button>
                </div>
                <div class="details-body">
                    <div class="details-tags">
                        <span class="tag">{{ jobDetails?.type }}</span>
                        <span class="tag"><app-icon name="CALENDAR" size="20" /> {{t('home.expire-at')}} {{ jobDetails?.deadline }}</span>
                    </div>
                    
                    <div class="details-content">
                        <h4>{{t('home.description')}} {{jobDetails.type=== 'evenement' ? t('home.of-the-event' ): t('home.of-the-position')}}</h4>
                        <p v-html="jobDetails?.description.replace(/\n/g, '<br>')"></p>
                    </div>
                </div>
                <div class="job-cover" v-if="jobDetails.file_url" >
                    <img :src="jobDetails.file_url" alt="Cover">
                </div>
                <div class="details-footer">
                    <button class="apply-btn-social" @click="openApplyModal(jobDetails); showDetailsModal = false">
                        {{t('home.apply-again')}}
                    </button>
                </div>
            </div>
        </div>

    <transition name="toast-fade">

        <div v-if="toast.show" :class="['toast-popup', toast.type]">

            <div class="toast-content">

                <img v-if="toast.type === 'success'" src="../assets/icons/check-96.png" class="icon">

                <p>{{ toast.message }}</p>

            </div>

            <div class="progress-bar"></div>

        </div>

    </transition>
</template>

<style scoped>
.job-board {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
}

.board-header {
  text-align: center;
  margin-bottom: 50px;
}

/* --- SECTION FILTRES AMÉLIORÉE --- */
.filters {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-top: 30px;
    padding: 10px;
}

/* Style commun pour la recherche et le sélecteur */
.filters input[type="text"],
.filters select {
    padding: 12px 18px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.95rem;
    color: #505181;
    background-color: #ffffff;
    transition: all 0.3s ease;
    outline: none;
}

/* Spécificité pour le champ de recherche */
.filters input[type="text"] {
    width: 350px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: 15px center;
    background-size: 20px;
    padding-left: 45px; /* Laisse la place pour l'icône loupe */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

/* Spécificité pour le menu déroulant (Select) */
.filters select {
    cursor: pointer;
    appearance: none; /* Enlève la flèche par défaut */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23505181'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: calc(100% - 15px) center;
    background-size: 16px;
    padding-right: 45px;
    min-width: 180px;
}

/* États au focus et survol */
.filters input:hover,
.filters select:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.filters input:focus,
.filters select:focus {
    border-color: #004581;
    box-shadow: 0 0 0 4px rgba(0, 69, 129, 0.1);
    background-color: #fff;
}

/* Adaptabilité mobile */
@media (max-width: 768px) {
    .filters {
        flex-direction: column;
        width: 100%;
        padding: 0 20px;
    }
    
    .filters input[type="text"],
    .filters select {
        width: 100%;
    }
}

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.job-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  transition: transform 0.2s;
  border: 1px solid #e2e8f0;
}

.job-card:hover { transform: translateY(-5px); }

.job-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
}

.job-badge.recrutement { background: #dcfce7; color: #166534; }
.job-badge.evenement { background: #dbeafe; color: #1e40af; }

.apply-btn {
  background: #004581;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

/* Modale */
/* --- OVERLAY (Arrière-plan sombre) --- */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.7); /* Bleu nuit très transparent */
    backdrop-filter: blur(4px); /* Effet de flou derrière la modale */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    padding: 20px;
}

/* --- LA MODALE DE CANDIDATURE --- */
.apply-modal {
    background: white;
    width: 100%;
    max-width: 550px;
    border-radius: 20px;
    padding: 35px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    position: relative;
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.apply-modal h3 {
    font-size: 1.5rem;
    color: #004581;
    margin-bottom: 25px;
    text-align: center;
    font-weight: 800;
}

/* --- FORMULAIRE À L'INTÉRIEUR --- */
.apply-modal form {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.apply-modal .form-row {
    display: flex;
    gap: 15px;
}

.apply-modal input[type="text"],
.apply-modal input[type="email"] {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.95rem;
    transition: border-color 0.2s;
}

.apply-modal input:focus {
    outline: none;
    border-color: #004581;
}

/* --- ZONE D'UPLOAD CV --- */
.file-upload {
    background: #f8fafc;
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    transition: all 0.2s;
}

.file-upload:hover {
    border-color: #004581;
    background: #f1f5f9;
}

.file-upload label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #505181;
    margin-bottom: 10px;
    cursor: pointer;
}

.file-upload input[type="file"] {
    font-size: 0.8rem;
    color: #64748b;
}

/* --- BOUTONS D'ACTION --- */
.modal-actions {
    display: flex;
    gap: 15px;
    margin-top: 20px;
}

.confirm-btn {
    flex: 2;
    background: #004581;
    color: white;
    border: none;
    padding: 14px;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
}

.confirm-btn:hover:not(:disabled) {
    background: #002d54;
}

.confirm-btn:disabled {
    background: #94a3b8;
    cursor: not-allowed;
}

.close-btn {
    flex: 1;
    background: #f1f5f9;
    color: #64748b;
    border: none;
    padding: 14px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
}

.close-btn:hover {
    background: #e2e8f0;
}

/* Mobile */
@media (max-width: 500px) {
    .apply-modal .form-row {
        flex-direction: column;
    }
}

.toast-popup {
    position: fixed;
    top: 20px;
    right: 20px;
    min-width: 300px;
    background: white;
    padding: 16px;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    z-index: 9999;
    border-left: 5px solid #004581;
    overflow: hidden;
}

.toast-popup.success { border-left-color: #2ecc71; }
.toast-popup.error { border-left-color: #e74c3c; }

.toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.toast-content p {
    margin: 0;
    font-size: 0.9rem;
    color: #333;
    font-weight: 500;
}

.progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: rgba(0,0,0,0.1);
    animation: progress 4s linear forwards;
}

@keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
}

/* Animation Vue.js */
.toast-fade-enter-active, .toast-fade-leave-active {
    transition: all 0.4s ease;
}
.toast-fade-enter-from {
    transform: translateX(100%);
    opacity: 0;
}
.toast-fade-leave-to {
    transform: translateX(100%);
    opacity: 0;
}
.job-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 15px;
}

.company-logo {
    width: 45px;
    height: 45px;
    border-radius: 8px;
    object-fit: cover;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
}

.company-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.company-name {
    font-size: 0.9rem;
    font-weight: 700;
    color: #1e293b;
}

.job-title {
    font-size: 1.2rem;
    color: #004581;
    margin: 10px 0;
}

/* On ajuste un peu le badge pour qu'il soit plus discret en haut */
.job-badge {
    align-self: flex-start;
    font-size: 0.6rem;
    padding: 2px 8px;
}
.job-card {
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Pour que l'image respecte les bords arrondis */
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    transition: 0.3s;
}

.job-cover {
    width: 100%;
    height: 160px;
    overflow: hidden;
}

.job-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover; /* Remplit l'espace sans déformer */
}

.job-content {
    padding: 20px;
}

.company-name {
    cursor: pointer;
    color: #004581;
    text-decoration: none;
}

.company-name:hover {
    text-decoration: underline;
}

/* Style de la modale Profil Entreprise */
/* --- STYLE MODALE ENTREPRISE --- */
.company-modal {
    background: white;
    width: 100%;
    max-width: 500px;
    border-radius: 20px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    animation: modalSpring 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes modalSpring {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}

.modal-banner {
    height: 80px;
    background: linear-gradient(135deg, #004581 0%, #002d54 100%);
}

.modal-close-icon {
    position: absolute;
    top: 15px;
    right: 15px;
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    transition: 0.3s;
}

.modal-body {
    padding: 0 30px 30px;
    margin-top: -40px; /* Fait remonter le logo sur la bannière */
}

.company-header {
    display: flex;
    align-items: flex-end;
    gap: 15px;
    margin-bottom: 25px;
}

.modal-logo {
    width: 90px;
    height: 90px;
    border-radius: 15px;
    border: 4px solid white;
    background: white;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    object-fit: cover;
}

.header-titles h3 {
    margin: 0;
    font-size: 1.4rem;
    color: #1e293b;
}

.location-tag {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 500;
}

.company-section h4 {
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
    margin-bottom: 10px;
}

.company-bio {
    font-size: 0.95rem;
    color: #475569;
    line-height: 1.6;
    margin-bottom: 25px;
}

/* Grille d'informations */
.company-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    background: #f8fafc;
    padding: 20px;
    border-radius: 12px;
}

.info-item label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 4px;
}

.info-item span {
    font-size: 0.9rem;
    color: #1e293b;
    word-break: break-all;
}

.modal-footer {
    padding: 20px 30px;
    border-top: 1px solid #f1f5f9;
    text-align: right;
}

.btn-primary-close {
    background: #004581;
    color: white;
    border: none;
    padding: 10px 25px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
}

.btn-primary-close:hover {
    background: #003366;
}
/* Container global */
.feed-container {
  display: flex;
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;
  align-items: flex-start;
}

/* Colonne des annonces (2/3) */
.jobs-feed {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Colonne latérale (1/3) */
.sidebar {
  flex: 1;
  position: sticky;
  top: 80px; /* Reste visible au scroll */
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Carte style Réseau Social */
.social-card {
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.social-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.company-avatar {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  object-fit: cover;
}

.header-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.company-name-link {
  font-weight: 700;
  color: #1e293b;
  cursor: pointer;
}

.post-date {
  font-size: 0.75rem;
  color: #64748b;
}

.card-content {
  padding: 0 16px 12px 16px;
}

.job-title {
  font-size: 1.1rem;
  margin: 0 0 8px 0;
  color: #004581;
}

.description {
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.5;
}

/* Image de couverture large */
.job-cover img {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-top: 1px solid #f1f5f9;
}

.card-footer {
    display: flex;
    padding: 12px 16px;
    gap: 12px;
    border-top: 1px solid #f1f5f9;
}

/* Bouton Postuler - Style Primaire */
.apply-btn-social {
    flex: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #004581;
    color: white;
    border: none;
    padding: 10px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s ease;
}

.apply-btn-social:hover {
    background: #003366;
    transform: translateY(-1px);
}

/* Bouton Enregistrer - Style Secondaire / Icone */
.save-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
    padding: 10px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.save-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #1e293b;
}

/* État quand l'annonce est SAUVEGARDÉE */
.save-btn.is-saved {
    background: #e0f2fe;
    color: #0369a1;
    border-color: #7dd3fc;
}

.save-btn.is-saved svg {
    fill: #0369a1; 
}

/* Styles Widgets Sidebar */
.sidebar-widget {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
}

.widget-header {
  font-weight: 700;
  margin-bottom: 12px;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 8px;
}

.profile-preview {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stat span {
  display: block;
  font-size: 0.7rem;
  color: #64748b;
}

.widget-list {
  list-style: none;
  padding: 0;
}

.widget-list li {
  margin-bottom: 10px;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
}

/* Mobile */
@media (max-width: 850px) {
  .feed-container { flex-direction: column; }
  .sidebar { width: 100%; order: -1; }
}
.profile-widget {
    background: linear-gradient(to bottom, #004581 50px, white 50px);
    padding-top: 10px;
}

.widget-header {
    color: white; /* Sur le fond bleu */
    border: none;
    text-align: center;
    font-size: 0.9rem;
    margin-bottom: 40px;
}

.profile-preview {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 10px 0;
}

.divider {
    width: 1px;
    height: 30px;
    background: #e2e8f0;
}

.stat strong {
    font-size: 1.4rem;
    color: #004581;
    display: block;
}

.view-all-btn {
    width: 100%;
    margin-top: 15px;
    padding: 8px;
    background: transparent;
    border: 1px solid #004581;
    color: #004581;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
}

.save-btn {
    background: transparent;
    border: none;
    color: #64748b;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
}

.save-btn:hover {
    color: #004581;
}
.btn-icon {
    margin-right: 8px;
    flex-shrink: 0;
}

.apply-btn-social {
    display: flex;
    align-items: center;
    justify-content: center;
    /* ... reste du style précédent ... */
}

/* Style des boîtes d'icônes dans la sidebar */
.profile-stats-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border-radius: 8px;
    transition: background 0.2s;
}

.icon-box {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-box.blue { background: #e0f2fe; color: #0369a1; }
.icon-box.green { background: #dcfce7; color: #15803d; }

.stat-info strong {
    display: block;
    font-size: 1.1rem;
    line-height: 1;
}

.stat-info span {
    font-size: 0.75rem;
    color: #64748b;
}
/* --- ANIMATION DU BOUTON AU CLIC --- */
@keyframes heartBeat {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.save-btn.is-saved {
    background: #e0f2fe !important;
    color: #0369a1 !important;
    border-color: #7dd3fc !important;
    animation: heartBeat 0.3s ease-in-out;
}

.save-btn.is-saved svg {
    fill: #0369a1;
}

.event-widget {
    padding: 0 !important; /* On gère le padding à l'intérieur */
    overflow: hidden;
}

.event-widget .widget-header {
    padding: 15px;
    background: #004581;
    margin-bottom: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
}

/* --- DESIGN DU WIDGET FAVORIS --- */
.saved-jobs-widget {
    padding: 0 !important; /* On gère le padding à l'intérieur */
    overflow: hidden;
}

.saved-jobs-widget .widget-header {
    padding: 15px;
    background: #004581;
    margin-bottom: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
}

.saved-list {
    max-height: 300px;
    overflow-y: auto;
}

.saved-card-mini {
    display: flex;
    align-items: center;
    padding: 12px;
    gap: 10px;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.2s;
    position: relative;
}

.saved-card-mini:hover {
    background: #f1f5f9;
}

.mini-logo {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    object-fit: cover;
}

.mini-details {
    flex: 1;
    min-width: 0; /* Important pour le troncage */
}

.mini-title {
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mini-company {
    font-size: 0.75rem;
    margin: 0;
    color: #64748b;
}

.remove-favorite {
    background: transparent;
    border: none;
    color: #cbd5e1;
    cursor: pointer;
    font-size: 14px;
    padding: 5px;
}

.remove-favorite:hover {
    color: #ef4444;
}

.empty-favorites {
    padding: 30px 15px;
    text-align: center;
    color: #94a3b8;
    font-size: 0.8rem;
}

.job-details-modal {
    background: white;
    width: 90%;
    max-width: 650px;
    border-radius: 16px;
    padding: 24px;
    position: relative;
    box-shadow: 0 20px 25px rgba(0,0,0,0.2);
}

.details-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 15px;
}

.details-logo {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    object-fit: cover;
}

.details-titles h3 {
    margin: 0;
    color: #004581;
}

.details-titles p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 0.9rem;
}

.details-tags {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.tag {
    background: #f1f5f9;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    color: #475569;
    font-weight: 600;
}

.details-content h4 {
    color: #1e293b;
    margin-bottom: 10px;
}

.details-content p {
    line-height: 1.6;
    color: #334155;
    white-space: pre-line; /* Respecte les retours à la ligne */
}

.close-x {
    position: absolute;
    top: 20px;
    right: 20px;
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #94a3b8;
}
.mini-status-tag {
    font-size: 0.65rem;
    background: #dcfce7;
    color: #166534;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    text-transform: uppercase;
}
/* Spinner de chargement en bas de page */
.loading-trigger {
    padding: 20px;
    text-align: center;
    color: #64748b;
    font-weight: 600;
}

.spinner {
    width: 20px;
    height: 20px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #004581;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block;
    margin-right: 10px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
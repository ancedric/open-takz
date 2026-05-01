<template>
  <div class="presentation-dashboard">
    <header class="module-header">
      <div class="header-content">
        <div class="brand">
          <div class="icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
          </div>
          <div>
            <h1>Corevia Presenter</h1>
            <p>Créez des présentations professionnelles pour vos réunions</p>
          </div>
        </div>
        <button @click="createNewPresentation" class="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nouvelle Présentation
        </button>
      </div>
    </header>

    <main class="dashboard-content">
      <section class="templates-section">
        <div class="section-header">
          <h2>Démarrer avec un modèle</h2>
        </div>
        <div class="templates-grid">
          <div v-for="temp in templates" :key="temp.id" class="template-card" @click="useTemplate(temp)">
            <div class="template-preview" :style="{ background: temp.bg }">
              <div class="mock-content"></div>
            </div>
            <span>{{ temp.name }}</span>
          </div>
        </div>
      </section>

      <section class="recent-section">
        <div class="section-header">
          <h2>Vos présentations récentes</h2>
          <div class="search-box">
            <input type="text" v-model="searchQuery" placeholder="Rechercher un projet...">
          </div>
        </div>

        <div v-if="loading" class="empty-state">
           <div class="spinner"></div>
           <p>Chargement de vos projets...</p>
        </div>

        <div v-else-if="filteredPresentations.length > 0" class="presentations-grid">
            <div v-for="pres in filteredPresentations" :key="pres.id" class="pres-card">
                
                <div 
                class="pres-preview" 
                @click="openEditor(pres.id)"
                :style="{ background: pres.theme_config?.background || '#cbd5e1' }"
                >
                <div class="mini-content">
                    <span :style="{ color: pres.theme_config?.color || '#333' }">
                        {{ pres.title }}
                    </span>
                </div>
                <div class="overlay">
                    <button class="btn-edit">Modifier</button>
                </div>
                </div>

                <div class="pres-info">
                <div>
                    <h3>{{ pres.title }}</h3>
                    <p>Modifié le {{ new Date(pres.updated_at).toLocaleDateString() }}</p>
                </div>
                <div class="actions">
                    <button @click="deletePres(pres.id)" class="btn-icon delete" title="Supprimer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
                </div>

            </div>
            </div>

        <div v-else class="empty-state">
          <img :src="Empty" alt="Vide" v-if="!searchQuery">
          <p>Aucune présentation trouvée. Commencez par en créer une !</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../store/index';
import supabase from '../../services/supabaseConfig';
import Empty from '../../assets/images/empty.jpg'

const router = useRouter();
const userStore = useUserStore();

const presentations = ref([]);
const loading = ref(true);
const searchQuery = ref("");

const templates = [
  { id: 'blank', name: 'Vide', bg: '#ffffff' },
  { id: 'report', name: 'Rapport d\'activité', bg: 'linear-gradient(135deg, #2563eb, #1e40af)' },
  { id: 'pitch', name: 'Pitch Deck', bg: '#1f2937' },
  { id: 'training', name: 'Formation RH', bg: '#fef3c7' }
];

const fetchPresentations = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('company_ref', userStore.user.company.companyref)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    presentations.value = data;
  } catch (err) {
    console.error("Erreur chargement présentations:", err);
  } finally {
    loading.value = false;
  }
};

const filteredPresentations = computed(() => {
  return presentations.value.filter(p => 
    p.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const createNewPresentation = () => useTemplate(templates[0]);

const useTemplate = async (template) => {
  loading.value = true;
  try {
    // 1. Créer la présentation avec le thème du modèle
    const { data: pres, error: presError } = await supabase
      .from('presentations')
      .insert([{
        title: `Nouveau : ${template.name}`,
        company_ref: userStore.user.company.companyref,
        created_by: userStore.user.user.userref,
        theme_config: { 
          font: 'Poppins, Arial', 
          color: template.bg.includes('gradient') ? '#ffffff' : '#2563eb',
          background: template.bg 
        }
      }])
      .select()
      .single();

    if (presError) throw presError;

    // 2. Créer une slide par défaut (Slide de titre)
    const { error: slideError } = await supabase
      .from('slides')
      .insert([{
        presentation_id: pres.id,
        order_index: 0,
        background_config: { type: 'theme', value: template.bg },
        elements: [
          {
            id: Date.now(),
            type: 'text',
            content: 'Cliquez pour modifier le titre',
            x: 100, y: 150,
            style: { fontSize: '48px', fontWeight: 'bold', color: 'inherit' }
          }
        ]
      }]);

    if (!slideError) openEditor(pres.id);
  } catch (err) {
    console.error("Erreur lors de l'application du modèle:", err);
  } finally {
    loading.value = false;
  }
};

const openEditor = (id) => {
  router.push(`/home/presentation/edit/${id}`);
};

const deletePres = async (id) => {
  if (confirm("Supprimer cette présentation ?")) {
    await supabase.from('presentations').delete().eq('id', id);
    fetchPresentations();
  }
};

onMounted(() => {
  fetchPresentations();
});
</script>

<style scoped>
.presentation-dashboard {
  min-height: 100vh;
  background-color: #f8fafc;
  color: #1e293b;
}

.module-header {
  background: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.icon-box {
  background: #2563eb;
  color: white;
  padding: 0.75rem;
  border-radius: 12px;
}

.brand h1 { font-size: 1.5rem; font-weight: 700; margin: 0; }
.brand p { font-size: 0.875rem; color: #64748b; margin: 0; }

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Templates Grid */
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
  margin-bottom: 3rem;
}

.template-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.template-card:hover { transform: translateY(-5px); }

.template-preview {
  height: 100px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-bottom: 0.5rem;
}

/* Presentations Grid */
.presentations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 1.5rem;
}
.presentations-grid-enter-active,
.presentations-grid-leave-active {
  transition: all 0.3s ease;
}
.presentations-grid-enter-from,
.presentations-grid-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.pres-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  transition: box-shadow 0.3s;
}

.pres-card:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }

.pres-preview {
  height: 150px;
  background: #cbd5e1;
  position: relative;
  cursor: pointer;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.pres-preview:hover .overlay { opacity: 1; }

.pres-info {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.pres-info h3 { font-size: 1rem; margin: 0; }
.pres-info p { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  cursor: pointer;
}

.btn-icon.delete { color: #ef4444; background: none; border: none; cursor: pointer; }

.empty-state {
  text-align: center;
  padding: 4rem;
  color: #64748b;
}

.empty-state img {
  max-width: 200px;
  margin-bottom: 1.5rem;
  opacity: 0.8;
}

.recent-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.recent-section .search-box {
  margin-left: auto;
  width: 300px;
}
.recent-section .search-box input {
  width: 100%;
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

/* Bouton Primaire Pulse */
.btn-primary:active {
  transform: scale(0.98);
}

/* Style des miniatures dans les cartes */
.mini-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 10px;
  text-align: center;
  pointer-events: none;
}

.mini-content span {
  font-weight: 700;
  font-size: 0.9rem;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1); /* Aide à lire sur des fonds clairs */
  max-width: 80%;
}

.btn-edit {
  background: white;
  color: #2563eb;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* Spinner amélioré */
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
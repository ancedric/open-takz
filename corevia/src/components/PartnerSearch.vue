<script setup>
import { ref, onMounted, watch } from 'vue';
import supabase from '../services/supabaseConfig'; 
import { useUserStore } from '../store/index';

const userStore = useUserStore();
const searchQuery = ref('');
const selectedSector = ref('');
const selectedCity = ref('');
const companies = ref([]);
const loading = ref(false);

// Liste des secteurs pour le filtre (peut être récupérée en DB plus tard)
const sectors = ["Aéronautique & spatial",
                  "Agroalimentaire",
                  "Assurances",
                  "Automobile",
                  "Banque",
                  "Bâtiment et construction",
                  "Bien-être",
                  "Commerce",
                  "Cosmétique",
                  "Education",
                  "Énergie",
                  "Entretien & nettoyage",
                  "Esthétique & soins corporels",
                  "Finances & comptabilité",
                  "Hôtellerie et Restauration",
                  "Industrie",
                  "Informatique & Services IT",
                  "Juridique",
                  "Mines",
                  "Pharmaceutique",
                  "Recherhe & développement",
                  "Ressources humaines",
                  "Santé",
                  "Sécurité",
                  "Services",
                  "Services publics",
                  "Sport",
                  "Télécommunictions",
                  "Tourisme",
                  "Transport"
                ];

const fetchCompanies = async () => {
  loading.value = true;
  try {
    let query = supabase
      .from('company')
      .select('companyref, companyname, activity, address, about')
      .eq('is_public', true); // On ne cherche que les entreprises publiques

    // Filtre par Nom
    if (searchQuery.value) {
      query = query.ilike('companyname', `%${searchQuery.value}%`);
    }

    // Filtre par Secteur
    if (selectedSector.value) {
      query = query.eq('activity', selectedSector.value);
    }

    // Filtre par Ville
    if (selectedCity.value) {
      query = query.ilike('address', `%${selectedCity.value}%`);
    }

    const { data, error } = await query.limit(20);

    if (error) throw error;
    companies.value = data;
  } catch (err) {
    console.error('Erreur recherche:', err.message);
  } finally {
    loading.value = false;
  }
};

// Déclencher la recherche quand les filtres changent
watch([searchQuery, selectedSector, selectedCity], () => {
  fetchCompanies();
});

onMounted(() => {
  fetchCompanies();
});

const contactPartner = async (targetCompany) => {
  const myCompanyRef = userStore.user.company.companyref;
  const myUserRef = userStore.user.user.userref;

  console.log("Cible:", targetCompany, "Mon entreprise:", myCompanyRef, "Mon userref:", myUserRef);

  // Validation Anti-Auto-Envoi
  if (targetCompany.companyref === myCompanyRef) {
    alert("Action impossible de contacter votre propre entreprise.");
    return;
  }

  // Génération d'une ref pour la nouvelle room
  const newRoomRef = `B2B-${Date.now()}`;

  const { data: room, error } = await supabase
    .from('chat_rooms')
    .insert([{ 
      ref: newRoomRef,
      name: `Partenariat: ${targetCompany.companyname}`, 
      type: 'b2b',
      company_ref: myCompanyRef // L'entreprise qui initie
    }])
    .select()
    .single();

  if (room) {
    // Ajout des participants via leurs refs
    await supabase.from('chat_participants').insert([
      { room_ref: room.ref, user_ref: myUserRef }
      // Ici, il faudra aussi ajouter le user_ref de l'admin de l'entreprise cible
    ]);
  }
};
</script>

<template>
  <div class="partner-search-container">
    <h2 class="search-title">Trouver des Partenaires & Clients</h2>

    <div class="filters-grid">
      <input 
        v-model="searchQuery"
        type="text" 
        placeholder="Rechercher par nom..." 
        class="search-input"
      />
      
      <select v-model="selectedSector" class="search-select">
        <option value="">Tous les secteurs</option>
        <option v-for="s in sectors" :key="s" :value="s">{{ s }}</option>
      </select>

      <input 
        v-model="selectedCity"
        type="text" 
        placeholder="Ville (ex: Yaoundé)..." 
        class="search-input"
      />
    </div>

    <div v-if="loading" class="loading-state">Chargement...</div>
    
    <div v-else class="companies-grid">
      <div v-for="company in companies" :key="company.id" class="company-card">
        <div class="card-header">
          <div class="company-info">
            <h3 class="company-name">{{ company.companyname }}</h3>
            <span class="company-sector">{{ company.activity }}</span>
          </div>
          <span class="company-location">
            <i class="pi pi-map-marker"></i> {{ company.address }}
          </span>
        </div>
        
        <p class="company-description">
          {{ company.about || 'Aucune description disponible.' }}
        </p>
        
        <button 
          @click="contactPartner(company)"
          class="contact-button"
        >
          <i class="pi pi-envelope"></i> Contacter
        </button>
      </div>
    </div>

    <div v-if="companies.length === 0 && !loading" class="empty-results">
      Aucune entreprise ne correspond à vos critères.
    </div>
  </div>
</template>

<style scoped>
/* Mise en page globale */
.partner-search-container {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.search-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #1f2937;
}

/* Grille des filtres */
.filters-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .filters-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.search-input, .search-select {
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  width: 100%;
  font-size: 1rem;
}

.search-input:focus, .search-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* Grille des entreprises */
.companies-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 640px) {
  .companies-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .companies-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Carte Entreprise */
.company-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.company-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.company-name {
  font-weight: bold;
  font-size: 1.125rem;
  margin: 0;
  color: #111827;
}

.company-sector {
  display: inline-block;
  font-size: 0.75rem;
  background-color: #eff6ff;
  color: #1d4ed8;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-weight: 600;
  margin-top: 0.4rem;
}

.company-location {
  font-size: 0.875rem;
  color: #6b7280;
}

.company-description {
  font-size: 0.875rem;
  color: #4b5563;
  margin: 0.75rem 0 1.5rem 0;
  font-style: italic;
  flex-grow: 1;
  /* Limiter à 2 lignes */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Bouton */
.contact-button {
  width: 100%;
  background-color: #2563eb;
  color: white;
  padding: 0.6rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.contact-button:hover {
  background-color: #1d4ed8;
}

/* Divers */
.loading-state, .empty-results {
  text-align: center;
  color: #6b7280;
  margin-top: 2.5rem;
}
</style>
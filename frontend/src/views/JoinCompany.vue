<script setup>
import { ref, watch } from 'vue';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();
const search = ref('');
const suggestions = ref([]);
const loading = ref(false);
const userref = router.currentRoute.value.params.userref;

// Recherche en temps réel dès que l'utilisateur tape 3 caractères
watch(search, async (val) => {
  if (val.length > 2) {
    const { data } = await supabase
      .from('company')
      .select('companyname, companyref, logo_url')
      .ilike('companyname', `%${val}%`)
      .limit(5);
    suggestions.value = data;
  } else {
    suggestions.value = [];
  }
});

const handleJoin = async (company) => {
  loading.value = true;
  // Mise à jour du profil de l'employé
  const { error } = await supabase
    .from('user')
    .update({ 
      companyref: company.companyref,
      privilege: 'user' 
    })
    .eq('userref', userref);

  if (!error) {
    // Mise à jour du store local
    userStore.user.companyref = company.companyref;
    router.push('/home');
  }
  loading.value = false;
};
</script>

<template>
  <div class="page setup-ctn">
    <div class="auth-ctn">
      <h3>Rejoindre une entreprise</h3>
      <div class="input-ctn">
        <div class="label">Rechercher le nom</div>
        <input v-model="search" class="set-input" placeholder="Ex: Ma Super Entreprise">
      </div>

      <div class="results-list" v-if="suggestions.length">
        <div v-for="c in suggestions" :key="c.companyref" class="company-item" @click="handleJoin(c)">
          <img :src="c.logo_url || 'https://via.placeholder.com/40'" class="mini-logo">
          <span>{{ c.companyname }}</span>
          <button class="join-btn">Rejoindre</button>
        </div>
      </div>
      <p v-else-if="search.length > 2" class="no-result">Aucune entreprise trouvée.</p>
    </div>
  </div>
</template>

<style scoped>
/* Réutilisation de vos styles Register.vue pour la cohérence */
.setup-ctn { display: flex; justify-content: center; align-items: center; height: 100vh; }
.results-list { width: 300px; margin-top: 20px; border: 1px solid #9da6e0; border-radius: 10px; overflow: hidden; }
.company-item { display: flex; align-items: center; padding: 10px; background: white; cursor: pointer; border-bottom: 1px solid #eee; transition: 0.2s; }
.company-item:hover { background: #f0f2ff; }
.mini-logo { width: 30px; height: 30px; border-radius: 5px; margin-right: 10px; object-fit: cover; }
.join-btn { margin-left: auto; font-size: 0.7rem; background: #2a2f4f; color: white; border: none; padding: 5px 10px; border-radius: 5px; }
</style>
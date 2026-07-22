<script setup>
import { onMounted, onUnmounted } from 'vue';
import supabase from './services/supabaseConfig';
import { useUserStore } from './store/index';

const userStore = useUserStore();
let presenceChannel = null;

onMounted(async() => {
  await userStore.init();
  // On ne lance la présence que si l'utilisateur est connecté
  if (userStore.user) {
    presenceChannel = supabase.channel('opentask-online');

    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // On envoie les infos de l'utilisateur au canal
        await presenceChannel.track({
          user_id: userStore.user.id,
          name: `${userStore.user.employe.firstname} ${userStore.user.employe.lastname}`,
          company: userStore.user.company.companyname,
          online_at: new Date().toISOString(),
        });
      }
    });
  }
});

onUnmounted(() => {
  if (presenceChannel) presenceChannel.unsubscribe();
});
</script>

<template>
  <div v-if="userStore.isLoading" class="loading-screen">
     <p>Chargement des données...</p>
  </div>                                          
  <RouterView v-else/>
</template>

<style scoped>

</style>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="feedback-modal">
      <header>
        <h2>Votre avis nous intéresse</h2>
        <button class="close-btn" @click="close">✕</button>
      </header>

      <div class="modal-body">
        <p>Comment évaluez-vous votre expérience sur OpenTask ?</p>
        
        <div class="star-rating">
          <span v-for="star in 5" :key="star" 
                @click="form.rating = star"
                :class="{ active: star <= form.rating }">
            ★
          </span>
        </div>

        <div class="form-group">
          <label>Catégorie</label>
          <select v-model="form.category">
            <option value="compliment">🌟 Compliment</option>
            <option value="suggestion">💡 Suggestion</option>
            <option value="bug">🪲 Signalement de bug</option>
            <option value="other">📝 Autre</option>
          </select>
        </div>

        <div class="form-group">
          <label>Commentaire</label>
          <textarea v-model="form.comment" placeholder="Dites-nous en plus..."></textarea>
        </div>

        <button :disabled="isSending" @click="submitFeedback" class="submit-btn">
          {{ isSending ? 'Envoi en cours...' : 'Envoyer mon avis' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';

const userStore = useUserStore();
const isOpen = ref(false);
const isSending = ref(false);

const form = reactive({
  rating: 5,
  category: 'compliment',
  comment: ''
});

const open = () => (isOpen.value = true);
const close = () => (isOpen.value = false);

const submitFeedback = async () => {
  if (!form.comment) return alert("N'oubliez pas de laisser un petit mot !");
  
  isSending.value = true;
  try {
    const { error } = await supabase.from('app_feedbacks').insert({
      companyref: userStore.user.company.companyref,
      employeref: `${userStore.user.employe.firstname} ${userStore.user.employe.lastname}`,
      rating: form.rating,
      comment: form.comment,
      category: form.category
    });

    if (error) throw error;

    alert("Merci ! Votre retour a bien été enregistré.");
    close();
    form.comment = ''; // Reset
  } catch (err) {
    alert("Erreur lors de l'envoi : " + err.message);
  } finally {
    isSending.value = false;
  }
};

// Exposer la méthode 'open' pour le composant parent
defineExpose({ open });
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.feedback-modal {
  background: white; padding: 30px; border-radius: 20px;
  width: 90%; max-width: 450px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.close-btn { background: none; border: none; font-size: 20px; cursor: pointer; }

.star-rating {
  font-size: 40px; text-align: center; margin-bottom: 20px;
}
.star-rating span {
  cursor: pointer; color: #e2e8f0; transition: color 0.2s;
}
.star-rating span.active { color: #f59e0b; }

.form-group { margin-bottom: 15px; }
.form-group label { display: block; font-size: 14px; margin-bottom: 5px; font-weight: 600; }
select, textarea {
  width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-family: inherit;
}
textarea { height: 100px; resize: none; }

.submit-btn {
  width: 100%; padding: 12px; background: #2563eb; color: white;
  border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
}
.submit-btn:disabled { background: #94a3b8; }
</style>
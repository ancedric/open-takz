<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button @click="$emit('close')" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <slot></slot> </div>

        <div class="modal-footer">
          <button @click="$emit('close')" class="btn-secondary">Annuler</button>
          <button @click="$emit('confirm')" class="btn-primary" :disabled="loading">
            {{ loading ? 'Traitement...' : confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>
<style scoped>
    /* --- MODAL SYSTEM --- */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center; justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-container {
  background: white;
  width: 90%;
  max-width: 500px;
  border-radius: 16px;
  padding: 20px;
  animation: slideUp 0.3s ease-out;
}

/* Version Mobile : Bottom Sheet */
@media (max-width: 768px) {
  .modal-overlay {
    align-items: flex-end; /* On pousse la modale vers le bas */
  }
  
  .modal-container {
    width: 100%;
    max-width: none;
    border-radius: 20px 20px 0 0; /* Arrondi uniquement en haut */
    padding-bottom: 30px; /* Espace pour la barre de navigation mobile */
    animation: slideUpMobile 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }
}

@keyframes slideUpMobile {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Style interne pour le résumé de paie */
.pay-summary-box {
  background: #f8fafc;
  border-radius: 10px;
  padding: 15px;
  margin: 15px 0;
  border-left: 4px solid #004581;
}

.summary-row {
  display: flex; justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.total-row {
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
  font-weight: bold;
  font-size: 1.1rem;
  color: #1e293b;
}
</style>
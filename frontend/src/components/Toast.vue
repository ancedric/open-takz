<script setup>
    import { toast } from '../services/toast';
</script>
 <template>
    <div v-if="toast.show" :class="['toast-popup', toast.type]">
        <div class="toast-content">
            <img v-if="toast.type === 'success'" src="../assets/icons/checked.png" class="icon">
            <p>{{ toast.message }}</p>
        </div>
        <div class="progress-bar"></div>
    </div>
 </template>

 <style scoped>
    .toast-popup {
    position: fixed;
    top: 20px;
    right: 20px;
    min-width: 300px;
    background: white;
    padding: 16px;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    z-index: 99999;
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
</style>
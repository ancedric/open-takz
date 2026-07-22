<template>
    <div class="module-overlay" @click.self="$emit('close')">
        <div class="module-card">
            <div class="module-header">
                <h4>Modules Externes</h4>
                <button @click="$emit('close')" class="close-btn">&times;</button>
            </div>
            <div class="module-grid">
                <div 
                    v-for="mod in availableModules" 
                    :key="mod.id" 
                    class="module-item" 
                    :class="{ 'is-locked': isLocked(mod.id), 'can-activate': canManageModules && isLocked(mod.id) }"
                    @click="handleModuleClick(mod)"
                >
                    <div class="module-icon-wrapper">
                        <div class="module-icon" :style="{ backgroundColor: isLocked(mod.id) ? '#94a3b8' : mod.color }">
                            <i :class="'pi pi-' + mod.icon"></i> 
                        </div>
                        <div v-if="isLocked(mod.id)" class="lock-badge" :class="{ 'activation-ready': canManageModules }">
                            <svg v-if="!canManageModules" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            <span v-else>+</span>
                        </div>
                    </div>
                    <span>{{ mod.name }}</span>
                    <small v-if="isLocked(mod.id) && canManageModules" class="activate-label">Activer</small>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '../store/index'
import supabase from '../services/supabaseConfig'
import { useRouter } from 'vue-router';

const router = useRouter();

const userStore = useUserStore()
const emit = defineEmits(['close', 'refresh'])

// 1. Détection des droits d'administration
const canManageModules = computed(() => {
    return ['owner', 'admin'].includes(userStore.user?.employe?.privilege);
});

const activeModules = computed(() => userStore.user.company?.active_modules || []);

const availableModules = [
    { id: 'inventory', name: 'Stocks & Ventes', color: '#004581', link: `https://store.getcorevia.net/${userStore.user?.user?.userref}`, icon: 'box' },
    { id: 'factory', name: 'RH & Paie', color: '#10b981', link: '#', icon: 'users' },
    { id: 'payment', name: 'Paiement', color: '#f59e0b', link: '/home/payment', icon: 'dollar' },
    { id: 'presentation', name: 'Présentation', color: '#2563eb', link: '/home/presentation', icon: 'desktop' }
]

const isLocked = (moduleId) => {
    if (moduleId === 'inventory') return false; 
    return !activeModules.value.includes(moduleId);
};

const handleModuleClick = async (mod) => {
    if (isLocked(mod.id)) {
        if (canManageModules.value) {
            await activateModule(mod);
        } else {
            alert("Ce module n'est pas activé. Contactez votre administrateur.");
        }
        return;
    }
    
    // Logique d'ouverture
    if (mod.id === 'presentation') {
        // Redirection interne
        console.log('Redirection vers le module de présentation', mod.link);
        router.push(mod.link);
    }else if (mod.id === 'payment') {
        // Redirection interne
        console.log('Redirection vers le module de paiement', mod.link);
        router.push(mod.link);
    } else if (mod.link !== '#') {
        router.push('/home');
    }
}

// 2. Fonction d'activation en base de données
const activateModule = async (mod) => {
    const confirmActivation = confirm(`Voulez-vous activer le module "${mod.name}" pour votre entreprise ?`);
    
    if (confirmActivation) {
        const companyRef = userStore.user.company.companyref;
        const newModules = [...activeModules.value, mod.id];

        const { error } = await supabase
            .from('company')
            .update({ active_modules: newModules })
            .eq('companyref', companyRef);

        if (!error) {
            // 1. Mise à jour du store local
            userStore.user.company.active_modules = newModules;
            
            // 2. Notification de succès
            alert(`Module ${mod.name} activé ! Ouverture en cours...`);

            // 3. LOGIQUE D'OUVERTURE AUTOMATIQUE
            // On réutilise la même logique que handleModuleClick mais sans le check isLocked
            emit('close'); // On ferme d'abord le lanceur (le menu overlay)

            if (mod.id === 'presentation') {
                // Utilise router.push si tu es dans la même application
                // ou window.location si c'est un changement de contexte
                router.push(mod.link); 
            } else if (mod.link !== '#') {
                window.open(mod.link, '_blank');
            }
        } else {
            console.error(error);
            alert("Erreur lors de l'activation.");
        }
    }
}
</script>

<style scoped>
.module-overlay {
    position: absolute;
    top: 55px;
    right: 0;
    width: 320px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    border: 1px solid #eee;
    z-index: 1000;
    padding: 15px;
}
.module-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin-top: 15px;
}
.module-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: transform 0.2s;
}
.module-item:hover { transform: translateY(-3px); }
.module-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}
.module-item span { font-size: 0.75rem; font-weight: 500; color: #333; }

.module-item.is-locked {
    cursor: not-allowed;
    filter: grayscale(0.8);
    opacity: 0.7;
}

.module-item.is-locked:hover {
    transform: none; /* Pas d'animation pour les modules bloqués */
}

.module-icon-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}

.lock-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    background: #555;
    color: white;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
}

.module-item span {
    font-size: 0.7rem;
    text-align: center;
    color: #444;
}

.module-item.can-activate:hover {
    transform: scale(1.05);
    filter: none; /* On retire le gris au survol pour les admins */
}

.lock-badge.activation-ready {
    background: #2563eb; /* Bleu Corevia pour indiquer une action possible */
    cursor: pointer;
}

.activate-label {
    font-size: 0.6rem;
    color: #2563eb;
    font-weight: bold;
    text-transform: uppercase;
}

.module-icon-wrapper {
    position: relative;
}

.is-locked i {
    opacity: 0.5;
}
</style>
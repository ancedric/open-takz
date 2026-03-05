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
                :class="{ 'is-locked': isLocked(mod.id) }"
                @click="openModule(mod)"
            >
                <div class="module-icon-wrapper">
                    <div class="module-icon" :style="{ backgroundColor: isLocked(mod.id) ? '#ccc' : mod.color }">
                    <i :class="'pi pi-' + mod.icon"></i> 
                    </div>
                    <div v-if="isLocked(mod.id)" class="lock-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                </div>
                <span>{{ mod.name }}</span>
            </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed } from 'vue'
    import { useUserStore } from '../store/index'
    const userStore = useUserStore()

    // On récupère les modules activés (ex: stockés dans company.active_modules sous forme de tableau)
    const activeModules = computed(() => userStore.user.company?.active_modules || []);

    const availableModules = [
        { 
            id: 'inventory',
            name: 'Stocks & Ventes', 
            color: '#004581', 
            link: `https://openstorm-ifs6.onrender.com/inventory/${userStore.user.user.id}`,
            icon: 'box' 
        },
        { 
            id: 'hr',
            name: 'RH & Paie', 
            color: '#10b981', 
            link: '#', 
            icon: 'users' 
        },
        { 
            id: 'finance',
            name: 'Comptabilité', 
            color: '#f59e0b', 
            link: '#', 
            icon: 'dollar-sign' 
        }
    ]

    const isLocked = (moduleId) => {
        // Le module 'inventory' est peut-être gratuit/par défaut, les autres sont vérifiés
        if (moduleId === 'inventory') return false; 
        return !activeModules.value.includes(moduleId);
    };

    const openModule = (mod) => {
        if (isLocked(mod.id)) {
            alert("Ce module n'est pas activé dans votre offre actuelle.");
            return;
        }
        if (mod.link !== '#') window.open(mod.link, '_blank');
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
</style>
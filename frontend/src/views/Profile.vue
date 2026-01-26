<template>
    <section class="profile-pg">
        <div class="profile-card">
            <aside class="profile-sidebar">
                <button class="back-btn" @click="backHome">← Dashboard</button>
                
                <div v-if="!userStore.user?.user" class="loading-state">
                    Chargement...
                </div>

                <div v-else class="sidebar-inner">
                    <div class="profile-header">
                        <div class="photo-wrapper" @click="triggerFileInput" :class="{ 'is-uploading': uploading }">
                            <img :src="data.profileImage" :alt="data.firstName">
                            
                            <div class="photo-overlay">
                                <span>{{ uploading ? '⌛' : '📷' }}</span>
                            </div>
                            
                            <div class="status-indicator"></div>
                            
                            <input 
                                type="file" 
                                ref="fileInput" 
                                @change="uploadProfileImage" 
                                accept="image/*" 
                                hidden
                            >
                        </div>
                        <h3 class="user-name">{{data.firstName}} {{data.lastName}}</h3>
                        <span class="badge-privilege">{{data.plan}}</span>
                    </div>

                    <nav class="profile-nav">
                        <hr>
                        <router-link to="/users-conditions" class="nav-link">📄 Conditions</router-link>
                        <router-link to="/privacyPolicy" class="nav-link">🔒 Confidentialité</router-link>
                        <router-link to="/support" class="nav-link">🎧 Support</router-link>
                        <button @click="logOut" class="nav-link logout">🚪 Déconnexion</button>
                    </nav>
                </div>
            </aside>

            <main class="profile-main">
                <header class="main-header">
                    <h2>Informations Personnelles</h2>
                    <p>Gérez vos données de compte OpenTask</p>
                </header>

                <div class="details-grid">
                    <div class="detail-item" @click="startEdit('firstName')">
                        <label>Prénom <span class="edit-icon">✏️</span></label>
                        <input v-if="editingField === 'firstName'" 
                            v-model="data.firstName" 
                            @blur="updateField('firstName', data.firstName)"
                            @keyup.enter="updateField('firstName', data.firstName)"
                            autoFocus
                            class="edit-input">
                        <p v-else>{{data.firstName}}</p>
                    </div>

                    <div class="detail-item" @click="startEdit('lastName')">
                        <label>Nom <span class="edit-icon">✏️</span></label>
                        <input v-if="editingField === 'lastName'" 
                            v-model="data.lastName" 
                            @blur="updateField('lastName', data.lastName)"
                            @keyup.enter="updateField('lastName', data.lastName)"
                            autoFocus
                            class="edit-input">
                        <p v-else>{{data.lastName}}</p>
                    </div>

                    <div class="detail-item" @click="startEdit('city')">
                        <label>Ville <span class="edit-icon">✏️</span></label>
                        <input v-if="editingField === 'city'" 
                            v-model="data.city" 
                            @blur="updateField('city', data.city)"
                            @keyup.enter="updateField('city', data.city)"
                            autoFocus
                            class="edit-input">
                        <p v-else>{{data.city || 'Cliquez pour ajouter'}}</p>
                    </div>

                    <div class="detail-item" @click="startEdit('country')">
                        <label>Pays <span class="edit-icon">✏️</span></label>
                        <input v-if="editingField === 'country'" 
                            v-model="data.country" 
                            @blur="updateField('country', data.country)"
                            @keyup.enter="updateField('country', data.country)"
                            autoFocus
                            class="edit-input">
                        <p v-else>{{data.country || 'Cliquez pour ajouter'}}</p>
                    </div>
                </div>
            </main>
        </div>
    </section>
</template>

<script setup>
    import Header from '../components/Header.vue'
    import {ref, toRaw} from 'vue'
    import {useRouter} from "vue-router" 
    import { useUserStore } from '../store/index'
    import supabase from '../services/supabaseConfig'

    const router = useRouter()
    const userStore = useUserStore()

    const fileInput = ref(null)
    const editingField = ref(null);
    const uploading = ref(false)
    
    // 1. Déclencher le clic sur l'input masqué
const triggerFileInput = () => {
    fileInput.value.click()
}

// 2. Gérer l'upload et la mise à jour
const uploadProfileImage = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    uploading.value = true
    const userRef = userStore.user.user.userref
    const fileExt = file.name.split('.').pop()
    const filePath = `profiles/${userRef}/${Date.now()}.${fileExt}`

    try {
        // A. Upload dans le bucket
        const { error: uploadError } = await supabase.storage
            .from('opentasks_bucket')
            .upload(filePath, file)

        if (uploadError) throw uploadError

        // B. Récupérer l'URL publique
        const { data: urlData } = supabase.storage
            .from('opentasks_bucket')
            .getPublicUrl(filePath)

        const publicUrl = urlData.publicUrl

        // C. Mettre à jour la table 'user'
        const { error: updateError } = await supabase
            .from('user')
            .update({ profilephotourl: publicUrl })
            .eq('userref', userRef)

        if (updateError) throw updateError

        // D. Mettre à jour le store local pour un effet instantané
        userStore.user.user.profilephotourl = publicUrl
        data.profileImage = publicUrl // Mettre à jour la variable réactive locale
        
        alert("Photo de profil mise à jour !")
    } catch (err) {
        console.error("Erreur d'upload :", err.message)
        alert("Erreur lors de la mise à jour de la photo.")
    } finally {
        uploading.value = false
    }
}

const updateField = async (fieldName, newValue) => {
    const userRef = userStore.user.user.userref;
    
    // Éviter l'envoi si la valeur est vide ou identique
    if (!newValue || newValue === data[fieldName]) {
        editingField.value = null;
        return;
    }

    try {
        const { error } = await supabase
            .from('user')
            .update({ [fieldName.toLowerCase()]: newValue }) // On s'assure que le nom correspond à la colonne SQL
            .eq('userref', userRef);

        if (error) throw error;

        // Mise à jour locale du store et de l'affichage
        userStore.user.user[fieldName.toLowerCase()] = newValue;
        data[fieldName] = newValue;
        
        console.log(`${fieldName} mis à jour avec succès`);
    } catch (err) {
        console.error("Erreur de mise à jour:", err.message);
        alert("Impossible de sauvegarder la modification.");
    } finally {
        editingField.value = null;
    }
};

const startEdit = (fieldName) => {
    editingField.value = fieldName;
};

    // Données calculées pour le profil
const profileData = () => {
    if (!userStore.user) return null

    return {
        firstName: toRaw(userStore.user?.user.firstname),
        lastName: toRaw(userStore.user?.user.lastname),
        profileImage: userStore.user?.user.profilephotourl || '../assets/images/Default-avatar.png',
        email: toRaw(userStore.user?.user.email),
        country: toRaw(userStore.user?.user.country),
        city: toRaw(userStore.user?.user.city),
        createdAt: toRaw(userStore.user?.user.createdat),
        plan: toRaw(userStore.user?.user.privilege) || 'user'
    }
}
const data = profileData()
    if(toRaw(userStore.user?.user.email)=== null || toRaw(userStore.user?.user.email) === undefined){
        router.push('/auth')
    }

    const logOut = async () => {
        const { data, error } = await supabase.signOut

        if(error){
            console.error('Erreur lors de la déconnexion :', error)
        }
        if(data){
            userStore.logout()
        }
    }
</script>

<style scoped>
/* Conteneur Principal */
.profile-pg {
    min-height: calc(100vh - 80px);
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f0f4f8;
    padding: 20px;
}

.profile-card {
    display: flex;
    width: 100%;
    max-width: 1000px;
    min-height: 600px;
    background: white;
    border-radius: 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

/* Sidebar */
.profile-sidebar {
    width: 320px;
    background: #1e293b;
    color: white;
    padding: 30px;
    display: flex;
    flex-direction: column;
}

.back-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    text-align: left;
    margin-bottom: 30px;
    transition: 0.3s;
}

.back-btn:hover { color: white; }

.profile-header {
    text-align: center;
    margin-bottom: 40px;
}

.photo-wrapper {
    position: relative;
    width: 130px;
    height: 130px;
    margin: 0 auto 15px;
    cursor: pointer;
    overflow: hidden;
    border-radius: 50%;
}

.photo-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 1.5rem;
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 50%;
}

.photo-wrapper:hover .photo-overlay {
    opacity: 1;
}

.is-uploading {
    pointer-events: none;
    opacity: 0.7;
}

.photo-wrapper img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid #334155;
    transition: transform 0.3s ease;
}

.photo-wrapper:hover img {
    transform: scale(1.1);
}

.status-indicator {
    position: absolute;
    bottom: 5px;
    right: 5px;
    width: 18px;
    height: 18px;
    background: #10b981;
    border: 3px solid #1e293b;
    border-radius: 50%;
}

.user-name {
    font-size: 1.4rem;
    margin-bottom: 8px;
}

.badge-privilege {
    background: #3b82f6;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    text-transform: uppercase;
}

/* Navigation */
.profile-nav {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.nav-link {
    color: #cbd5e1;
    text-decoration: none;
    padding: 10px 15px;
    border-radius: 10px;
    transition: 0.3s;
    font-size: 0.9rem;
}

.nav-link:hover {
    background: #334155;
    color: white;
}

.nav-link.highlight {
    background: #3b82f6;
    color: white;
}

.logout {
    text-align: left;
    background: transparent;
    border: none;
    color: #ef4444;
    cursor: pointer;
    margin-top: 20px;
}

/* Main Content */
.profile-main {
    flex: 1;
    padding: 50px;
    background: #ffffff;
}

.main-header {
    margin-bottom: 40px;
}

.main-header h2 {
    color: #1e293b;
    font-size: 1.8rem;
}

.main-header p {
    color: #64748b;
}

.details-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
}

.detail-item label {
    display: block;
    color: #94a3b8;
    font-size: 0.8rem;
    text-transform: uppercase;
    margin-bottom: 5px;
    letter-spacing: 0.5px;
}

.detail-item p {
    color: #1e293b;
    font-weight: 500;
    padding: 12px 0;
    border-bottom: 1px solid #f1f5f9;
}

/* RESPONSIVE */
@media screen and (max-width: 860px) {
    .profile-card {
        flex-direction: column;
        border-radius: 0;
        min-height: 100vh;
    }

    .profile-sidebar {
        width: 100%;
        padding: 40px 20px;
    }

    .profile-main {
        padding: 40px 20px;
    }

    .details-grid {
        grid-template-columns: 1fr;
        gap: 20px;
    }
}
.detail-item {
    cursor: pointer;
    padding: 10px;
    border-radius: 8px;
    transition: background 0.2s;
}

.detail-item:hover {
    background: #f8fafc;
}

.edit-icon {
    font-size: 0.7rem;
    opacity: 0;
    transition: opacity 0.2s;
    margin-left: 5px;
}

.detail-item:hover .edit-icon {
    opacity: 1;
}

.edit-input {
    width: 100%;
    border: none;
    border-bottom: 2px solid #3b82f6;
    background: transparent;
    padding: 8px 0;
    font-size: 1rem;
    font-weight: 500;
    color: #1e293b;
    outline: none;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}

/* On désactive l'édition sur les champs sensibles si besoin */
.detail-item.readonly {
    cursor: default;
    background: transparent !important;
}
</style>
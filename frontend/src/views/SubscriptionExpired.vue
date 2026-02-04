<template>
    <div class="subscription-container">
        <div class="glass-card">
        <div class="icon-warning">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        
        <h1>Session Suspendue</h1>
        <p class="subtitle">Votre période d'accès à <strong>OpenTask</strong> est arrivée à terme. Vos données sont en sécurité, mais l'accès aux modules est restreint.</p>

        <div class="plans-grid">
            <div class="plan-card">
            <h3>Mensuel</h3>
            <div class="price">29€<span>/mois</span></div>
            <ul>
                <li>Accès illimité aux modules</li>
                <li>Support prioritaire</li>
                <li>Gestion de stock inclus</li>
            </ul>
            <button @click="requestRenewal('mensuel')" class="btn-primary">Choisir</button>
            </div>

            <div class="plan-card popular">
            <div class="badge">Économisez 20%</div>
            <h3>Annuel</h3>
            <div class="price">290€<span>/an</span></div>
            <ul>
                <li>2 mois offerts</li>
                <li>Fonctionnalités Beta</li>
                <li>Multi-entreprises</li>
            </ul>
            <button @click="requestRenewal('annuel')" class="btn-gold">Choisir</button>
            </div>
        </div>

        <input 
            type="file" 
            ref="fileInput" 
            style="display: none" 
            accept="image/*" 
            @change="handleFileUpload"
            />

        <button @click="logout" class="btn-ghost">Se déconnecter</button>
        </div>
    </div>
</template>

<script setup>
    import { ref } from 'vue';
    import { useUserStore } from '../store/index';
    import { useRouter } from 'vue-router';
    import supabase from '../services/supabaseConfig';

    const userStore = useUserStore();
    const router = useRouter();

    const requestRenewal = async (plan) => {
    // Ici, tu pourrais rediriger vers une page de paiement 
    // ou simplement ouvrir une modale pour uploader la preuve de virement (capture)
    console.log(`Demande de renouvellement : ${plan}`);
    // Redirection vers ton futur module de paiement ou formulaire de capture
    };

    const fileInput = ref(null);
    const selectedPlan = ref(null);

    // 1. Déclencher l'explorateur de fichiers
    const requestRenewal = (plan) => {
    selectedPlan.value = plan;
    fileInput.value.click(); 
    };

    // 2. Traiter le fichier et envoyer à Supabase
    const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const companyRef = userStore.user.company.companyref;
        const fileName = `${companyRef}_${Date.now()}_${file.name}`;

        // A. Upload de l'image dans un bucket nommé 'renewals-captures'
        const { data: storageData, error: storageError } = await supabase.storage
        .from('renewals-captures')
        .upload(fileName, file);

        if (storageError) throw storageError;

        // B. Insertion de la demande dans la table SQL
        const { error: dbError } = await supabase
        .from('subscription_renewals')
        .insert({
            companyref: companyRef,
            userplan: selectedPlan.value,
            capture: storageData.path, // On stocke le chemin de l'image
            status: 'pending'
        });

        if (dbError) throw dbError;

        alert("Votre demande de renouvellement a été envoyée ! Un administrateur va la valider sous peu.");
        
    } catch (error) {
        console.error("Erreur lors du renouvellement:", error.message);
        alert("Une erreur est survenue lors de l'envoi de la preuve de paiement.");
    }
    };
    const logout = () => {
    userStore.logout();
    router.push('/auth');
    };
</script>

<style scoped>
    .subscription-container {
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8fafc;
        padding: 20px;
    }

    .glass-card {
        background: white;
        padding: 40px;
        border-radius: 24px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        text-align: center;
        max-width: 800px;
        width: 100%;
    }

    .plans-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin: 40px 0;
    }

    .plan-card {
        border: 2px solid #e2e8f0;
        padding: 30px;
        border-radius: 16px;
        transition: all 0.3s ease;
    }

    .plan-card.popular {
        border-color: #f59e0b;
        position: relative;
        transform: scale(1.05);
    }

    .badge {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: #f59e0b;
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
    }

    .price {
        font-size: 32px;
        font-weight: 800;
        margin: 20px 0;
    }

    .price span {
        font-size: 16px;
        color: #64748b;
    }

    .btn-gold {
        background: #f59e0b;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        width: 100%;
    }
</style>
<script setup>
import { ref } from 'vue';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();
const companyName = ref('');
const logoFile = ref(null);
const loading = ref(false);
const userref = router.currentRoute.value.params.userref;

const onFileChange = (e) => {
  logoFile.value = e.target.files[0];
};

const handleCreate = async () => {
  if (!companyName.value) return alert("Nom requis");
  loading.value = true;
  
  const companyRef = 'COMP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  let publicLogoUrl = null;

  try {
    // 1. Upload du Logo si présent
    if (logoFile.value) {
      const fileExt = logoFile.value.name.split('.').pop();
      const fileName = `${companyRef}.${fileExt}`;
      const filePath = `company/logos/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('opentasks_bucket')
        .upload(filePath, logoFile.value);

      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName);
      publicLogoUrl = urlData.publicUrl;
    }

    // 2. Création de l'entreprise
    const { error: compError } = await supabase
      .from('company')
      .insert([{ 
        companyref: companyRef, 
        companyname: companyName.value, 
        logo_url: publicLogoUrl,
        owner_ref: userref 
      }]);

    if (compError) throw compError;

    // 3. Promotion de l'utilisateur en Owner
    await supabase
      .from('user')
      .update({ companyref: companyRef, privilege: 'owner' })
      .eq('userref', userref);

    router.push('/home');
  } catch (err) {
    alert(err.message);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="page setup-ctn">
    <div class="auth-ctn">
      <h3>Enregistrez votre entreprise</h3>
      <div class="input-ctn">
        <div class="label">Nom de l'entreprise</div>
        <input v-model="companyName" class="set-input" placeholder="Nom officiel">
      </div>
      <div class="input-ctn">
        <div class="label">Logo</div>
        <input type="file" @change="onFileChange" class="set-input">
      </div>
      <button @click="handleCreate" class="auth-btn" :disabled="loading">
        {{ loading ? 'Création...' : 'Créer mon espace' }}
      </button>
    </div>
  </div>
</template>
<style scoped>
.page.setup-ctn {
  justify-content: center;
  align-items: center;

  .auth-ctn{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 70vw;
        height: 80vh;
        margin-left: 50%;
        transform: translate(-50%, 5%);
        background-color: #eee;
        border-radius: 30px;
        box-shadow: 1px 1px 200px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        @media screen and (max-width: 860px){
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            width: 95vw;
            height: 95vh;
            padding: 0;
        }
    }
    .auth-ctn form{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 80%;
        width: 300px;
        margin-top: 20px;
        border-radius: 15px;
        border: 2px solid #9da6e0;
    }
    .auth-ctn .input-ctn .set-input{
        height: 40px;
        width: 100%;
        border-radius: 10px;
        background-color: #eee;
        color: #9da6e0;
        padding-left: 10px;
        font-family: Poppins;
        margin-left: 0;
        border: 1px solid;
    }
    .auth-ctn form .input-ctn{
        height: 43px;
        width: 200px;
        color: #9da6e0;
        margin: 15px;
        padding-right: 25px;
        font-family: Poppins;
        position: relative;
    }
    .input-ctn .label{
        position: absolute;
        top: -5px;
        left: 30px;
        font-size: 0.8rem;
        background-color: #eee;
        padding-left: 5px;
        padding-right: 5px;
        z-index: 1;
    }
    .auth-btn{
        display: flex;
        justify-content: center;
        align-items: center;
        height: 40px;
        width: 200px;
        border: none;
        border-radius: 10px;
        background-color: #2a2f4f;
        color: #eee;
        font-family: Poppins;
        font-weight: 600;
        cursor: pointer;
        margin-top: 10px;
    }
}
</style>
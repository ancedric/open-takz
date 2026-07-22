<script setup>
import { ref, onMounted } from 'vue';
import supabase from '../services/supabaseConfig';
import { useUserStore } from '../store/index';

const userStore = useUserStore();
const documents = ref([]);
const loading = ref(true);
const uploading = ref(false);
const fileInput = ref(null);

// Champs pour l'upload
const selectedCategory = ref('technical');
const targetProject = ref('');

const fetchDocuments = async () => {
  loading.value = true;
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('companyref', userStore.user.companyref)
    .order('createdat', { ascending: false });
  documents.value = data || [];
  loading.value = false;
};

const handleUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  uploading.value = true;
  const fileExt = file.name.split('.').pop();
  const docRef = 'DOC-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const filePath = `documents/${userStore.user.companyref}/${docRef}.${fileExt}`;

  try {
    // 1. Envoyer le fichier physique dans le Storage
    const { error: uploadError } = await supabase.storage
      .from(import.meta.env.VITE_VUE_JS_SUPABASE_BUCKET)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Enregistrer les métadonnées en base
    await supabase.from('documents').insert([{
      doc_ref: docRef,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      category: selectedCategory.value,
      companyref: userStore.user.companyref,
      uploaded_by: userStore.user.userref
    }]);

    fetchDocuments();
  } catch (err) {
    alert("Erreur d'upload : " + err.message);
  } finally {
    uploading.value = false;
  }
};

const downloadFile = async (path, name) => {
  const { data, error } = await supabase.storage.from('documents').download(path);
  if (error) return alert("Erreur de téléchargement");
  
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', name);
  document.body.appendChild(link);
  link.click();
};

onMounted(fetchDocuments);
</script>

<template>
  <div class="ged-page">
    <div class="ged-header">
      <h2>📂 Gestion Documentaire</h2>
      
      <div class="upload-zone">
        <select v-model="selectedCategory" class="mini-select">
          <option value="technical">Spec Technique</option>
          <option value="contract">Contrat</option>
          <option value="invoice">Facture</option>
        </select>
        <input type="file" ref="fileInput" @change="handleUpload" hidden>
        <button @click="fileInput.click()" class="btn-upload" :disabled="uploading">
          {{ uploading ? 'Envoi...' : '📤 Téléverser un fichier' }}
        </button>
      </div>
    </div>

    <div class="doc-grid">
      <div v-for="doc in documents" :key="doc.id" class="doc-card">
        <div class="file-icon" :data-type="doc.category">
          {{ doc.file_name.split('.').pop().toUpperCase() }}
        </div>
        <div class="doc-info">
          <p class="doc-name">{{ doc.file_name }}</p>
          <p class="doc-meta">{{ (doc.file_size / 1024).toFixed(1) }} KB | {{ doc.category }}</p>
        </div>
        <button @click="downloadFile(doc.file_path, doc.file_name)" class="btn-download">⬇️</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ged-page { padding: 2rem; }
.ged-header { display: flex; justify-content: space-between; margin-bottom: 2rem; background: white; padding: 1.5rem; border-radius: 12px; }
.upload-zone { display: flex; gap: 10px; align-items: center; }

.doc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
.doc-card { 
  background: white; padding: 1rem; border-radius: 10px; 
  display: flex; flex-direction: column; align-items: center; text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: 0.3s;
}
.doc-card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px rgba(0,0,0,0.1); }

.file-icon { 
  width: 50px; height: 60px; background: #f1f5f9; border-radius: 5px; 
  display: flex; align-items: center; justify-content: center;
  font-weight: bold; font-size: 0.7rem; color: #64748b; margin-bottom: 10px;
  border-top: 5px solid #3b82f6;
}
.file-icon[data-type="contract"] { border-top-color: #ef4444; }
.file-icon[data-type="invoice"] { border-top-color: #22c55e; }

.doc-name { font-weight: 600; font-size: 0.9rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
.doc-meta { font-size: 0.7rem; color: #94a3b8; margin-top: 5px; }

.btn-upload { background: #1e293b; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
.btn-download { margin-top: 10px; background: none; border: 1px solid #e2e8f0; border-radius: 5px; cursor: pointer; padding: 5px 10px; }
.mini-select { padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; }
</style>
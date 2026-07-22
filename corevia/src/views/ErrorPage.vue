<template>
  <div class="error-container">
    <div class="error-content">
      <h1 class="error-code">{{ code }}</h1>
      <div class="error-icon">
        <svg v-if="code === '403'" xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
      </div>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <button @click="$router.push('/')" class="btn-home">Retour au tableau de bord</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  code: { type: String, default: '404' },
  title: { type: String, default: 'Page Introuvable' },
  message: { type: String, default: "Oups ! Il semblerait que vous vous soyez égaré dans les méandres de l'ERP." }
});
</script>

<style scoped>
.error-container {
  height: 100vh; display: flex; align-items: center; justify-content: center;
  background: #f8fafc; text-align: center; padding: 20px;
}
.error-code { font-size: 120px; font-weight: 900; color: #e2e8f0; margin: 0; line-height: 1; }
.error-content { margin-top: -50px; }
.error-icon { margin-bottom: 20px; }
h2 { color: #1e293b; font-size: 28px; margin-bottom: 10px; }
p { color: #64748b; margin-bottom: 30px; max-width: 400px; }
.btn-home {
  background: #2563eb; color: white; border: none; padding: 12px 24px;
  border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;
}
.btn-home:hover { background: #1d4ed8; }
</style>
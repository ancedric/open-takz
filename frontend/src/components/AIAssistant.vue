<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import axios from 'axios';
import { useUserStore } from '../store/index';

const userStore = useUserStore();
const activeTab = ref('suggestions'); // 'suggestions' ou 'chat'
const aiInsights = ref([]);
const isMinimized = ref(false);
const hasNewData = ref(false);
const loading = ref(false);

// Système de chat MANI
const userMessage = ref('');
const chatHistory = ref([
  { role: 'assistant', text: "Bonjour ! Je suis MANI. Comment puis-je vous aider dans la gestion de votre entreprise aujourd'hui ?" }
]);
const chatContainer = ref(null);

const quickActions = [
  "Résumé de la situation",
  "Projets en retard ?",
  "Analyse des dépenses"
];


const fetchIASuggestions = async () => {
  try {
    if (!userStore.user?.company) return;
    const currentRef = userStore.user.company.companyref; 
    const response = await axios.get(`http://localhost:8000/ai/suggestions?entreprise_ref=${currentRef}`);
    
    if (JSON.stringify(aiInsights.value) !== JSON.stringify(response.data.data)) {
      if (aiInsights.value.length > 0) hasNewData.value = true;
      aiInsights.value = response.data.data;
    }
  } catch (error) { console.error("Erreur Suggestions:", error); }
};

const sendMessage = async (text = null) => {
  const messageText = text || userMessage.value;
  if (!messageText.trim() || loading.value) return;

  chatHistory.value.push({ role: 'user', text: messageText });
  userMessage.value = '';
  loading.value = true;

  // On crée une entrée vide pour la réponse de MANI
  const aiMessageIndex = chatHistory.value.push({ role: 'assistant', text: '' }) - 1;

  try {
    const response = await fetch('http://localhost:8000/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entreprise_ref: userStore.user.company.companyref,
        message: messageText
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (isMinimized.value === undefined) break;
      
      const chunk = decoder.decode(value, { stream: true });
      // On ajoute chaque morceau de texte en temps réel
      chatHistory.value[aiMessageIndex].text += chunk;
      await scrollToBottom();
    }
  } catch (error) {
    chatHistory.value[aiMessageIndex].text = "Erreur de connexion avec MANI.";
  } finally {
    loading.value = false;
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

const toggleAssistant = () => {
  isMinimized.value = !isMinimized.value;
  if (!isMinimized.value) hasNewData.value = false;
};

let interval = null;
onMounted(() => {
  fetchIASuggestions();
  interval = setInterval(fetchIASuggestions, 120000);
});
onUnmounted(() => clearInterval(interval));
</script>

<template>
  <div class="ai-floating-container" :class="{ 'minimized': isMinimized }">
    <div class="ai-header" @click="toggleAssistant">
      <div class="header-main">
        <span class="ai-icon">🤖</span>
        <h2 v-if="!isMinimized">MANI AI</h2>
        <div v-if="hasNewData && isMinimized" class="notification-dot"></div>
      </div>
      <button class="toggle-btn">{{ isMinimized ? '▲' : '▼' }}</button>
    </div>

    <div v-if="!isMinimized" class="ai-content">
      <div class="tabs">
        <button :class="{active: activeTab === 'suggestions'}" @click="activeTab = 'suggestions'">
          Suggestions
        </button>
        <button :class="{active: activeTab === 'chat'}" @click="activeTab = 'chat'">
          Chat MANI
        </button>
      </div>

      <div v-if="activeTab === 'suggestions'" class="ai-body">
        <div v-if="aiInsights.length > 0" class="insights-list">
          <div v-for="(ins, i) in aiInsights" :key="i" class="insight-card" :class="ins.type">
            <div class="insight-title">{{ ins.title }}</div>
            <p>{{ ins.message }}</p>
          </div>
        </div>
        <div v-else class="empty-state">Analyse proactive en cours...</div>
      </div>

      <div v-if="activeTab === 'chat'" class="chat-container">
        <div class="messages-area" ref="chatContainer">
          <div v-for="(msg, i) in chatHistory" :key="i" :class="['msg', msg.role]">
            <div class="bubble">{{ msg.text }}</div>
          </div>
          <div v-if="loading" class="msg assistant"><div class="bubble">...</div></div>
        </div>
        <div class="quick-actions" v-if="chatHistory.length < 3">
          <button 
            v-for="action in quickActions" 
            :key="action" 
            @click="sendMessage(action)"
            class="action-chip"
          >
            {{ action }}
          </button>
        </div>
        <div class="input-area">
          <input v-model="userMessage" @keyup.enter="sendMessage" placeholder="Posez une question à MANI..." />
          <button @click="sendMessage" :disabled="loading">➤</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-floating-container {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 350px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  z-index: 999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.ai-floating-container.minimized {
  width: 60px; /* Réduit à une icône/bulle */
  height: 60px;
  border-radius: 30px;
  cursor: pointer;
}

.ai-header {
  padding: 15px;
  background: #1e293b;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.header-main h2 {
  font-size: 1rem;
  margin: 0;
}

.ai-icon { font-size: 1.5rem; }

/* Le point clignotant */
.notification-dot {
  width: 12px;
  height: 12px;
  background: #ef4444;
  border-radius: 50%;
  position: absolute;
  top: -5px;
  right: -5px;
  border: 2px solid #1e293b;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.ai-body {
  max-height: 400px;
  overflow-y: auto;
  padding: 15px;
  background: #f8fafc;
}

.insight-card {
  background: white;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
  border-left: 5px solid #cbd5e1;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.insight-card.danger { border-left-color: #ef4444; }
.insight-card.warning { border-left-color: #f59e0b; }
.insight-card.success { border-left-color: #10b981; }

.insight-title {
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 5px;
  color: #1e293b;
}

.insight-card p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 0.8rem;
  cursor: pointer;
}

.minimized .ai-body, .minimized h2, .minimized .toggle-btn {
  display: none;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  font-style: italic;
}

/* Onglets */
.tabs {
  display: flex;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}
.tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: #64748b;
  transition: 0.3s;
}
.tabs button.active {
  background: white;
  color: #1e293b;
  font-weight: bold;
  border-bottom: 2px solid #1e293b;
}

/* Chat Area */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 400px;
}
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scroll-behavior: smooth;
}
.msg { display: flex; width: 100%; }
.msg.user { justify-content: flex-end; }
.msg.assistant { justify-content: flex-start; }

.bubble {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  line-height: 1.4;
}
.user .bubble { background: #1e293b; color: white; border-bottom-right-radius: 2px; }
.assistant .bubble { background: #e2e8f0; color: #1e293b; border-bottom-left-radius: 2px; }

.input-area {
  padding: 10px;
  display: flex;
  gap: 5px;
  border-top: 1px solid #e2e8f0;
}
.input-area input {
  flex: 1;
  padding: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  outline: none;
}
.input-area button {
  background: #1e293b;
  color: white;
  border: none;
  padding: 0 15px;
  border-radius: 5px;
  cursor: pointer;
}

.quick-actions {
  display: flex;
  gap: 8px;
  padding: 10px;
  flex-wrap: wrap;
  background: #f8fafc;
}
.action-chip {
  background: white;
  border: 1px solid #cbd5e1;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: 0.2s;
}
.action-chip:hover {
  background: #1e293b;
  color: white;
  border-color: #1e293b;
}
</style>
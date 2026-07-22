<script setup>
import { ref, onMounted } from 'vue';
import supabase from '../../services/supabaseConfig';
import { useUserStore } from '../../store/index';

const userStore = useUserStore();
const activeRooms = ref([]); // Liste des fenêtres de chat ouvertes
const userRef = userStore.user.user.userref; 
const contactSearch = ref('');
const currentTab = ref('chats'); // 'chats' ou 'contacts'
const recentRooms = ref([]);      // Liste des rooms existantes
const openRooms = ref([]);        // Fenêtres de chat actuellement ouvertes sur le dock
const isHubMinimized = ref(false); // État du hub de chat (minimisé ou non)
const filteredEmployees = ref([]); // Liste des collègues filtrés pour la recherche

const fetchChatRooms = async () => {
  const { data: rooms, error } = await supabase
    .from('chat_rooms')
    .select(`
      *,
      chat_participants!room_ref (
        user_ref,
        user:user_ref (
          firstname, 
          lastname, 
          profilephotourl
        )
      )
    `)
    .eq('company_ref', userStore.user.company.companyref);

  if (!error) {
    recentRooms.value = rooms.map(room => ({
      ...room,
      participants: room.chat_participants?.map(p => p.user_ref) || []
    })).sort((a, b) => {
      // On met la discussion générale TOUJOURS en premier
      if (a.type === 'internal_group') return -1;
      if (b.type === 'internal_group') return 1;
      return 0;
    });
  }
}

const fetchEmployees = async () => {
  const { data: employees,error } = await supabase
    .from('employe')
    .select('userref, position, user:userref(firstname, lastname, profilephotourl)')
    .eq('companyref', userStore.user.company.companyref);
    if(error) {
      console.error("Erreur fetch employés:", error.message);
      return;
    }

  filteredEmployees.value = employees || [];
};

const subscribeToNewConversations = () => {
  supabase
    .channel('my_new_chats')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'chat_participants',
      filter: `user_ref=eq.${userRef}` // On écoute uniquement mes invitations
    }, async (payload) => {
      // 1. Récupérer les détails de la Room (nom, type, etc.)
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('ref', payload.new.room_ref)
        .single();
      
      if (room) {
        // 2. Ajouter à la liste des discussions actives (affichage auto)
        activeRooms.value.unshift(room);
      }
    })
    .subscribe();
};
const subscribeToRoomMessages = (roomRef) => {
  supabase
    .channel(`room-${roomRef}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'chat_messages',
      filter: `room_ref=eq.${roomRef}` 
    }, async (payload) => {
      const room = openRooms.value.find(r => r.ref === roomRef);
      
      if (room) {
        const exists = room.messages.some(m => m.message_ref === payload.new.message_ref);
        if (!exists) {
          const newMessage = payload.new;

          // Crucial : Si c'est un groupe, on récupère le nom de l'expéditeur
          if (room.type === 'internal_group' && newMessage.sender_ref !== userStore.user.user.userref) {
            const { data: userData } = await supabase
              .from('user')
              .select('firstname, lastname')
              .eq('userref', newMessage.sender_ref)
              .single();
            newMessage.user = userData;
          }

          room.messages.push(newMessage);
          scrollToBottom(roomRef);
        }
      }
    })
    .subscribe();
};

  // Petit helper pour le défilement automatique
  const scrollToBottom = (roomRef) => {
    setTimeout(() => {
      const container = document.getElementById(`scroll-${roomRef}`);
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100); // Petit délai pour laisser le DOM se mettre à jour
  };

// Fonction pour ouvrir (ou ramener au premier plan) une fenêtre de chat
const openChatWindow = async (room) => {
  // 1. Vérifier si elle est déjà ouverte
  const alreadyOpen = openRooms.value.find(r => r.ref === room.ref);
  if (alreadyOpen) {
    alreadyOpen.isMinimized = false;
    return;
  }

  // 2. Charger les messages existants de la room
  const { data: msgs } = await supabase
    .from('chat_messages')
    .select('*, user:sender_ref(firstname, lastname)')
    .eq('room_ref', room.ref)
    .order('created_at', { ascending: true });

  // 3. Ajouter au dock
  openRooms.value.push({
    ...room,
    messages: msgs || [],
    isMinimized: false
  });
  
  // 4. Souscrire au temps réel pour cette room spécifique
  subscribeToRoomMessages(room.ref);
};

const closeChatWindow = (roomRef) => {
  openRooms.value = openRooms.value.filter(r => r.ref !== roomRef);
};  

const initiateDiscussion = (employee) => {
  const myUserRef = userStore.user.user.userref;
  
  // 1. Est-ce qu'une discussion réelle existe déjà ?
  const existing = recentRooms.value.find(r => 
    r.type === 'direct' && r.participants?.includes(employee.userref)
  );

  if (existing) {
    openChatWindow(existing);
    return;
  }

  // 2. Sinon, on vérifie si une fenêtre "virtuelle" pour ce contact est déjà ouverte
  const virtualRef = `TEMP-${employee.userref}`;
  const alreadyOpen = openRooms.value.find(r => r.ref === virtualRef);
  
  if (alreadyOpen) {
    alreadyOpen.isMinimized = false;
    return;
  }

  // 3. On ouvre une fenêtre temporaire dans le dock
  openRooms.value.push({
    ref: virtualRef,
    name: `${employee.user.firstname} ${employee.user.lastname}`,
    type: 'direct',
    isNew: true, // Indicateur crucial
    targetUserRef: employee.userref, // On garde la trace de qui on veut contacter
    messages: [],
    isMinimized: false
  });
};

const sendMessage = async (room, event) => {
  const content = event.target.value.trim();
  if (!content) return;

  let currentRoomRef = room.ref;
  const myUserRef = userStore.user.user.userref;

  // CAS : PREMIER MESSAGE (Création de la room à la volée)
  if (room.isNew) {
    const realRef = `DIR-${Date.now()}`;
    
    // 1. Création de la room
    const { data: newRoom, error: roomErr } = await supabase
      .from('chat_rooms')
      .insert([{
        ref: realRef,
        name: room.name,
        type: 'direct',
        company_ref: userStore.user.company.companyref
      }])
      .select().single();

    if (roomErr) return;

    // 2. Ajout des participants
    const {error} = await supabase.from('chat_participants').insert([
      { room_ref: realRef, user_ref: myUserRef },
      { room_ref: realRef, user_ref: room.targetUserRef }
    ])
    if (error) console.error("Erreur ajout participants:", error.message);

    // 3. Mise à jour de l'objet dans openRooms pour qu'il devienne "réel"
    rroom.ref = realRef;
    room.isNew = false;
    currentRoomRef = realRef;

    // ACTIVER LE TEMPS RÉEL IMMÉDIATEMENT
    subscribeToRoomMessages(realRef); 
    
    recentRooms.value.unshift(newRoom);
  }

  // ENVOI DU MESSAGE (Commun aux rooms réelles et nouvelles)
  const newMessageRef = `MSG-${Date.now()}`;
  const { error: msgErr } = await supabase
    .from('chat_messages')
    .insert([{
      message_ref: newMessageRef,
      room_ref: currentRoomRef,
      sender_ref: myUserRef,
      content: content
    }]);

  if (!msgErr) {
    event.target.value = '';
    // Note: Le temps réel (subscribe) ajoutera le message visuellement
  }
};

onMounted(async () => {
    await fetchChatRooms();
    subscribeToNewConversations();
    await fetchEmployees();
    // Si l'utilisateur n'a aucune fenêtre ouverte, on ouvre la générale par défaut
    if (recentRooms.value.length > 0) {
      const generalRoom = recentRooms.value.find(r => r.type === 'internal_group');
      if (generalRoom) openChatWindow(generalRoom)
    }
})
</script>

<template>
  <div class="chat-system">
    <div :class="['messenger-hub', { 'minimized': isHubMinimized }]">
      
      <div class="hub-header" @click="isHubMinimized = !isHubMinimized">
        <div class="tabs">
          <button :class="{ active: currentTab === 'chats' }" @click.stop="currentTab = 'chats'">
            Discussions
          </button>
          <button :class="{ active: currentTab === 'contacts' }" @click.stop="currentTab = 'contacts'">
            Employés
          </button>
        </div>
        <i :class="isHubMinimized ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
      </div>

      <div v-if="!isHubMinimized" class="hub-content">
        <div v-if="currentTab === 'chats'" class="tab-pane">
          <div v-if="recentRooms.length === 0" class="empty-state">
            <p>Aucune discussion récente</p>
          </div>
          <div v-else class="list-container">
            <div v-for="room in recentRooms" :key="room.ref" 
                 @click="openChatWindow(room)" class="list-item">
                 
                 <div v-if=" room.type === 'internal_group' || room.chat_participants[0].user_ref === userStore.user.user.userref || room.chat_participants[1].user_ref === userStore.user.user.userref">
                    <div class="room-icon">💬</div>
                    <div class="list-info">
                        <span class="list-name">{{ room.type === 'direct' ? (room.chat_participants[0].user_ref === userStore.user.user.userref ? room.chat_participants[1].user.firstname + ' ' + room.chat_participants[1].user.lastname : room.chat_participants[0].user.firstname + ' ' + room.chat_participants[0].user.lastname ) : room.name }}</span>
                        <span class="list-preview">Cliquer pour ouvrir</span>
                    </div>
                 </div>
              
            </div>
          </div>
        </div>

        <div v-else class="tab-pane">
          <div class="search-box">
            <input type="text" v-model="contactSearch" placeholder="Chercher un collègue...">
          </div>
          <div class="list-container">
            <div v-for="emp in filteredEmployees" :key="emp.userref" 
                 @click="initiateDiscussion(emp)" class="list-item">
              <div class="avatar"> <img :src="emp.user.profilephotourl" :alt="`${emp.user.firstname} ${emp.user.lastname}`"> </div>
              <div class="list-info">
                <span class="list-name">{{ emp.user.firstname }} {{ emp.user.lastname }}</span>
                <span class="list-status">{{emp.position}}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-dock">
      <div v-for="room in openRooms" :key="room.ref" class="chat-window">
        <div class="window-header" @click="room.isMinimized = !room.isMinimized">
          <span>{{ room.type === 'direct' ? (room.chat_participants && room.chat_participants[0] ? (room.chat_participants[0].user_ref === userStore.user.user.userref ? room.chat_participants[1].user.firstname + ' ' + room.chat_participants[1].user.lastname : room.chat_participants[0].user.firstname + ' ' + room.chat_participants[0].user.lastname ) : '') : room.name }}</span>
          <button @click.stop="closeChatWindow(room.ref)">×</button>
        </div>
        <div v-if="!room.isMinimized" class="window-body">
          <div class="messages-list" :id="'scroll-' + room.ref">
            <div v-for="msg in room.messages" :key="msg.message_ref">
                <span v-if="room.type==='internal_group'" class="sender-name"> {{ msg.sender_ref === userStore.user.user.userref ? 'Vous' : msg.user.firstname + ' ' + msg.user.lastname }} </span>
                <div :class="['msg', msg.sender_ref === userStore.user.user.userref ? 'sent' : 'received']">
                 {{ msg.content }}
                </div>
            </div>
          </div>
          <div class="input-area">
            <input type="text" placeholder="Message..." @keyup.enter="sendMessage(room, $event)">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-system {
  position: fixed;
  bottom: 0;
  right: 20px;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  z-index: 10000;
}

/* HUB PRINCIPAL */
.messenger-hub {
  width: 300px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px 10px 0 0;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.15);
  overflow: hidden;
}

.minimized .hub-content { display: none; }

.hub-header {
  background: #1f2937;
  color: white;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  height: 45px;
}

.tabs {
  display: flex;
  gap: 5px;
}

.tabs button {
  background: transparent;
  border: none;
  color: #9ca3af;
  padding: 10px 5px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
}

.tabs button.active {
  color: white;
  border-bottom: 2px solid white;
}

.hub-content {
  height: 400px;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 0.9rem;
}

/* LISTES DANS LE HUB */
.list-container {
  overflow-y: scroll;
  flex-grow: 1;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
}

.list-item:hover { background: #f9fafb; }

.list-name { font-size: 0.9rem; font-weight: 600; display: block; }
.list-preview, .list-status { font-size: 0.75rem; color: #6b7280; }

.avatar {
  width: 38px; height: 38px; background: #3b82f6; color: white;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-weight: bold; font-size: 0.8rem;
  overflow: hidden;
}
.avatar img{
  width: 100%; height: 100%; object-fit: cover; border-radius: 50%;
}
.list-status {
  font-size: 0.75rem;
  color: #3b82f6; /* Bleu pour le poste/position */
  font-weight: 500;
}
/* DOCK DES FENÊTRES */
.chat-dock { display: flex; gap: 10px; }

.chat-window {
  width: 280px; background: white; border: 1px solid #ddd;
  border-radius: 10px 10px 0 0; box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
}

.window-header {
  background: #2563eb; color: white; padding: 8px 12px;
  display: flex; justify-content: space-between; cursor: pointer;
  border-radius: 9px 9px 0 0; font-size: 0.85rem; font-weight: bold;
}

.window-body { height: 300px; display: flex; flex-direction: column; }

.messages-list { flex-grow: 1; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.sender-name { font-size: 0.7rem; color: #6b7280; margin-bottom: -4px; }
.msg { max-width: 80%; padding: 6px 10px; border-radius: 12px; font-size: 0.8rem; }
.sent { align-self: flex-end; background: #2563eb; color: white; }
.received { align-self: flex-start; background: #f1f5f9; color: #334155; }

.input-area { padding: 8px; border-top: 1px solid #eee; }
.input-area input { width: 90%; padding: 7px 12px; border: 1px solid #ddd; border-radius: 20px; outline: none; font-size: 0.8rem; }
.tab-pane { display: flex; flex-direction: column; }
.search-box { padding: 10px; }
.search-box input { width: 90%; padding: 7px 12px; border: 1px solid #ddd; border-radius: 20px; outline: none; font-size: 0.8rem; }

</style>
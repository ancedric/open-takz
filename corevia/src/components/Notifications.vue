<template>
    <div class="notifications">
      <div class="notifications-icon" @click="showNotifs">
        <img src="/src/assets/images/notifs.png" alt="task-notifications">
        <div class="dot"> {{unread}} </div>
      </div>
      <div class="notif-ctn" v-if="displayNotif">
        <h5>Notifications</h5>
        <div v-if="notifications.length === 0" class="empty">
          <p>No notifications yet...</p>
        </div>
        <div class="contain">
          <ul>
            <li v-for="notification in notifications" :key="notification.notifref" :class="{read:notification.isread === true, unread: notification.isread === false}">
              <h3>{{ notification.title }}</h3>
              {{ notification.content }}<br/>
              {{ formatDateTime(notification.createdat) }}<br/>
              <button @click="markAsRead(notification.notifref)" class="markRead">
                {{ notification.isread ? 'Already read' : 'Mark as read' }}
              </button>
            </li>
          </ul>
        </div>
        
        <div class="close" @click="closeNotifs">close</div>
      </div> 
    </div>
  </template>
  
  <script setup>
import { ref, onMounted } from 'vue';
import supabase from '../services/supabaseConfig'; // Import Supabase
import { useUserStore } from '../store/index.js';

const userStore = useUserStore()
const notifications = ref([]);
const displayNotif = ref(false)
const unread = ref(0);

const getNotifications = async () => {
  // Récupération via Supabase
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('userref', userStore.user.userref)
    .order('createdat', { ascending: false });

  if (data) {
    notifications.value = data;
    unread.value = data.filter(n => !n.isread).length;
  }
};

const markAsRead = async (notifRef) => {
  const { error } = await supabase
    .from('notifications')
    .update({ isread: true })
    .eq('notifref', notifRef);

  if (!error) {
    const notif = notifications.value.find(n => n.notifref === notifRef);
    if (notif) notif.isread = true;
    unread.value = notifications.value.filter(n => !n.isread).length;
  }
};

onMounted(() => {
  getNotifications();
  
  // OPTIONNEL : Temps réel ! Supabase prévient quand une nouvelle notif arrive
  supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        getNotifications();
    })
    .subscribe();
});
</script>

  <style scoped>
    .notifications{
      width: 40px;
      height: 40px;
      position: relative;

      @media (max-width: 768px) {
        width: 30px;
        height: 30px;
      }
    }
    .notifications-icon{
      width: 30px;
      height: 30px;
      overflow: hidden;
      object-fit: cover;
      position: relative;
    }
    .notifications-icon img{
      width: 100%;
      height: 100%;
    }
    .dot{
      width: 15px;
      height: 15px;
      background-color: red;
      color:#eee;
      font-size: 0.8rem;
      text-align: center;
      border-radius: 50px;
      position: absolute;
      top: 0;
      right: 0;
    }
    .notif-ctn{
      position: absolute;
      top: 50%;
      left: 50%;
      background-color: #eee;
      color: #348ceb;
      border-radius: 10px;
      border: 3px solid #040649;
      box-shadow: 0 0 30px #eeeeee80;
      width: 400px;
      height: 70vh;
      padding-top: 60px;
      overflow-y: scroll; 
      overflow-x: hidden;
      z-index: 50;
      &::-webkit-scrollbar{
        width: 5px;
        border-radius: 50px;
      }
      @media screen and (max-width: 768px){
        left: -50vw;
        width: 80vw;
      }
    }
    
    .notif-ctn h5{
      position: fixed;
      top: 30px;
      width: 300px;
      height: 60px;
      padding-left: 10px;
      padding-top: 10px;
      background-color: #eee;
      border-radius: 10px;
      z-index: 5;
      @media screen and (max-width: 768px){
        width: 70%;
        left: 10%;
      }
    }
    .close{
      position: fixed;
      top: 60px;
      right: 250px;
      width: 10%;
      height: 30px;
      margin: 10px;
      background-color: #050df8;
      color: #eee;
      font-size: 1rem;
      text-align: center;
      border-radius: 5px;
      cursor: pointer;
      z-index: 5;
      @media screen and (max-width: 768px){
        right: 65px;
        width: 20%;
      }
    }
    .empty,
    .contain{
      padding: 10px;
      font-size: 0.8rem;
      text-align: center;

      ul{
        list-style: none;
        padding: 0;

        li{
          text-align: left;
          font-size: 0.9rem;
          line-height: 1.4;
          word-wrap: break-word;
        }
      }
    }
    .unread{
      background-color: #898cf580;
      color: #39329c;
      padding: 5px;
      border-radius: 5px;
      border-bottom: 1px solid;
      margin-bottom: 10px;
      box-shadow: 0 0 10px #00000080;
    }
    .read{
      background-color: #bbbbbbb4;
      color: #1d9265;
      padding: 5px;
      border-radius: 5px;
      border-bottom: 1px solid;
      margin-bottom: 10px;
      box-shadow: 0 0 10px #00000080;
    }
    .markRead{
      background-color: #b6f89cf6;
      color: #316e18f6;
      border-radius: 3px;
      border: none;
      width: 90%;
      cursor: pointer;
    }
  </style>
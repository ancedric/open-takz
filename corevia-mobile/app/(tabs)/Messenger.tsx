import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import supabase from '@/service/supabase';
import { userStore } from '@/store/index';
import { useRouter } from 'expo-router';

const DefaultAvatar = require('@/assets/images/Default-avatar.png');


export default function ChatListScreen() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useRouter();
  
  // On récupère les infos de l'utilisateur connecté depuis le store
  const { user, company } = userStore.user || {} as any;
  const myUserRef = user?.userref;

  useEffect(() => {
    fetchRooms();
    
    // Optionnel : Souscription aux nouvelles conversations comme dans Vue
    const channel = supabase
      .channel('new_rooms_mobile')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_participants',
        filter: `user_ref=eq.${myUserRef}`
      }, () => fetchRooms())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_participants (
            user_ref, 
            user:user_ref (
              firstname, 
              lastname, 
              profilephotourl
            )
          )
        `)
        .eq('company_ref', company.companyref);

      if (!error && data) {
        // Tri : Groupe interne en premier, puis le reste
        const sortedRooms = data.sort((a, b) => {
          if (a.type === 'internal_group') return -1;
          if (b.type === 'internal_group') return 1;
          return 0;
        });
        setRooms(sortedRooms);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * LOGIQUE IDENTIQUE À VUE.JS
   * Détermine le nom à afficher et l'image selon le type de room
   */
  const getRoomDisplayData = (item: any) => {
    // 1. Cas de la Discussion Générale
    if (item.type === 'internal_group') {
      return {
        name: item.name || '📢 Discussion Générale',
        image: null, // On peut mettre une icône de groupe ici
        isGroup: true
      };
    }

    // 2. Cas de la Discussion Directe
    // On cherche le participant qui n'est PAS moi
    const otherParticipant = item.chat_participants?.find(
      (p: any) => p.user_ref !== myUserRef
    );

    if (otherParticipant) {
      return {
        name: `${otherParticipant.user.firstname} ${otherParticipant.user.lastname}`,
        image: otherParticipant.user.profilephotourl,
        isGroup: false
      };
    }

    return { name: 'Discussion privée', image: null, isGroup: false };
  };

  const openDiscussion = (room: any) => {
    const display = getRoomDisplayData(room);
    
    // On passe les paramètres un par un dans l'URL
    navigate.push({
      pathname: '/ChatDetailScreen',
      params: { 
        room_ref: room.ref,       // Très important : l'ID pour Supabase
        name: display.name        // Pour afficher le titre en haut
      }
    });
  };
  const renderRoom = ({ item }: { item: any }) => {
    const display = getRoomDisplayData(item);

    return (
      <TouchableOpacity 
        style={styles.roomItem}
        onPress={() => openDiscussion(item)}
      >
        <View style={styles.avatarContainer}>
          {display.image ? (
            <Image source={{ uri: display.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
               <Text style={styles.avatarText}>{display.isGroup ? '📢' : '👤'}</Text>
            </View>
          )}
        </View>

        <View style={styles.roomInfo}>
          <Text style={styles.roomName} numberOfLines={1}>
            {display.name}
          </Text>
          <Text style={styles.lastMsg} numberOfLines={1}>
            {item.type === 'internal_group' ? 'Canal d\'entreprise' : 'Cliquer pour discuter'}
          </Text>
        </View>
        
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  if (loading) return <ActivityIndicator style={{marginTop: 50}} color="#2a2f4f" />;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>{rooms.length} discussions actives</Text>
      </View>
      
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.ref} // Utilisation de .ref comme dans Vue
        renderItem={renderRoom}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: { padding: 20, paddingTop: 30 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
  headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  roomItem: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9', 
    alignItems: 'center' 
  },
  avatarContainer: { position: 'relative' },
  avatar: { 
    width: 55, 
    height: 55, 
    borderRadius: 18, // Style un peu plus moderne (squircle)
    marginRight: 15,
  },
  avatarPlaceholder: {
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  avatarText: { fontSize: 20 },
  roomInfo: { flex: 1 },
  roomName: { fontWeight: '700', fontSize: 16, color: '#1e293b', marginBottom: 2 },
  lastMsg: { color: '#94a3b8', fontSize: 13 },
  chevron: { fontSize: 24, color: '#cbd5e1', marginLeft: 10 }
});
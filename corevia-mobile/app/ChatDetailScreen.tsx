import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import supabase from '@/service/supabase';
import { userStore } from '@/store/index';
import { useNavigation, useLocalSearchParams } from 'expo-router';

export default function ChatDetailScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  
  // On extrait la ref et le nom (passés depuis l'écran précédent)
  const roomRef = params.room_ref as string;
  const roomName = params.name as string;
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const userRef = (userStore.user as any)?.user?.userref;

  // Mise à jour du titre de la page dynamiquement
  useEffect(() => {
    if (roomName) {
      navigation.setOptions({ title: roomName });
    }
  }, [roomName]);

  useEffect(() => {
    if (!roomRef) return;

    fetchMessages();

    // TEMPS RÉEL
    const channel = supabase
      .channel(`room_${roomRef}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `room_ref=eq.${roomRef}` 
      }, payload => {
        setMessages(prev => {
            // Éviter les doublons si l'insert vient de nous-même
            if (prev.find(m => m.message_ref === payload.new.message_ref)) return prev;
            return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomRef]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_ref', roomRef)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const msg = {
      message_ref: `MSG-${Date.now()}`,
      room_ref: roomRef,
      sender_ref: userRef,
      content: newMessage.trim(),
    };

    const { error } = await supabase.from('chat_messages').insert([msg]);
    if (!error) setNewMessage('');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container} 
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.message_ref}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.msgContainer, item.sender_ref === userRef ? styles.myMsg : styles.theirMsg]}>
            <View style={[styles.bubble, item.sender_ref === userRef ? styles.myBubble : styles.theirBubble]}>
              <Text style={item.sender_ref === userRef ? styles.myText : styles.theirText}>{item.content}</Text>
            </View>
          </View>
        )}
      />
      
      <View style={styles.inputArea}>
        <TextInput 
          style={styles.input} 
          value={newMessage} 
          onChangeText={setNewMessage} 
          placeholder="Votre message..." 
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Text style={styles.sendText}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  // Conteneur global de chaque ligne de message
  msgContainer: { 
    paddingHorizontal: 12, 
    marginVertical: 4, 
    flexDirection: 'row' 
  },
  myMsg: { 
    justifyContent: 'flex-end' 
  },
  theirMsg: { 
    justifyContent: 'flex-start' 
  },
  // La bulle de texte
  bubble: { 
    padding: 12, 
    borderRadius: 18, 
    maxWidth: '80%' 
  },
  myBubble: { 
    backgroundColor: '#2a2f4f', // Couleur Corevia
    borderBottomRightRadius: 2  // Effet pointe vers l'utilisateur
  },
  theirBubble: { 
    backgroundColor: '#f1f5f9', 
    borderBottomLeftRadius: 2   // Effet pointe vers le collègue
  },
  // Couleurs du texte
  myText: { 
    color: '#fff', 
    lineHeight: 20 
  },
  theirText: { 
    color: '#1e293b', 
    lineHeight: 20 
  },
  // Zone de saisie (en bas)
  inputArea: { 
    flexDirection: 'row', 
    padding: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  input: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
    borderRadius: 25, 
    paddingHorizontal: 15, 
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sendBtn: { 
    backgroundColor: '#2a2f4f', 
    borderRadius: 25, 
    paddingVertical: 10, 
    paddingHorizontal: 18 
  },
  sendText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  }
});
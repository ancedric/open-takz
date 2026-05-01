import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import axios from 'axios';
import { userStore } from '@/store/index';

export default function ManiScreen() {
  const { user, company } = userStore.user || {};
  const [activeTab, setActiveTab] = useState<'suggestions' | 'chat'>('suggestions');
  const [userMessage, setUserMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: "Bonjour ! Je suis MANI. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // 1. FETCH SUGGESTIONS (Polling toutes les 2 minutes)
  const fetchIASuggestions = async () => {
    try {
      if (!company?.companyref) return;
      const response = await axios.get(`https://corevia-ai-backend.onrender.com/ai/suggestions`, {
        params: {
          entreprise_ref: company.companyref,
          user_ref: user.userref
        }
      });
      setAiInsights(response.data.data || []);
    } catch (error) {
      console.error("Erreur Suggestions MANI:", error);
    }
  };

  useEffect(() => {
    fetchIASuggestions();
    const interval = setInterval(fetchIASuggestions, 120000);
    return () => clearInterval(interval);
  }, []);

  // 2. ENVOI MESSAGE (Logique Chat)
  const sendMessage = async (textOverride?: string) => {
    const messageText = textOverride || userMessage;
    if (!messageText.trim() || loading) return;

    // Mise à jour interface immédiate
    const newHistory = [...chatHistory, { role: 'user', text: messageText }];
    setChatHistory([...newHistory, { role: 'assistant', text: '...' }]);
    setUserMessage('');
    setLoading(true);

    try {
      // Note: OnRender peut être lent pour le streaming sur mobile. 
      // On utilise un POST classique si le streaming fetch pose problème en natif.
      const response = await axios.post(`https://corevia-ai-backend.onrender.com/ai/chat`, {
        message: messageText,
        entreprise_ref: company.companyref,
        user_ref: user.userref
      });

      // Remplacement du "..." par la réponse réelle
      const aiResponse = response.data.reply || response.data.message || response.data;
      setChatHistory([...newHistory, { role: 'assistant', text: aiResponse }]);

    } catch (error) {
      Alert.alert("Erreur", "Connexion à MANI impossible.");
      setChatHistory([...newHistory, { role: 'assistant', text: "Désolé, je rencontre une erreur technique." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {/* TABS SELECTOR */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'suggestions' && styles.activeTab]} 
          onPress={() => setActiveTab('suggestions')}
        >
          <Text style={[styles.tabText, activeTab === 'suggestions' && styles.activeTabText]}>Suggestions</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]} 
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>Chat MANI</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'suggestions' ? (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Analyses de l'IA</Text>
          {aiInsights.length === 0 ? (
            <Text style={styles.emptyText}>Analyse proactive en cours...</Text>
          ) : (
            aiInsights.map((insight: any, i) => (
              <View key={i} style={styles.insightCard}>
                <View style={[styles.indicator, 
                  { backgroundColor: insight.type === 'danger' ? '#ef4444' : insight.type === 'warning' ? '#f59e0b' : '#10b981' }
                ]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightContent}>{insight.message}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <View style={styles.chatWrapper}>
          <ScrollView 
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            style={styles.messagesArea}
          >
            {chatHistory.map((msg, index) => (
              <View key={index} style={[styles.msg, msg.role === 'user' ? styles.msgUser : styles.msgAssistant]}>
                <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
                  {msg.text === '...' ? (
                    <ActivityIndicator size="small" color="#2a2f4f" />
                  ) : (
                    <Text style={msg.role === 'user' ? styles.textUser : styles.textAssistant}>{msg.text}</Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* QUICK ACTIONS */}
          {!loading && chatHistory.length < 4 && (
            <View style={styles.quickActionsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {["Résumé de la situation", "Projets en retard ?", "Analyse des dépenses"].map((action, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={styles.quickActionBtn}
                    onPress={() => sendMessage(action)}
                  >
                    <Text style={styles.quickActionText}>{action}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* INPUT AREA */}
          <View style={styles.inputArea}>
            <TextInput 
              style={styles.input}
              placeholder="Posez une question..."
              value={userMessage}
              onChangeText={setUserMessage}
              editable={!loading}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, loading && { opacity: 0.5 }]} 
              onPress={() => sendMessage()}
              disabled={loading}
            >
              <Text style={styles.sendBtnText}>{loading ? '...' : 'Envoyer'}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 85 }} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 5, 
    margin: 15, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#2a2f4f' },
  tabText: { color: '#64748b', fontWeight: '600' },
  activeTabText: { color: '#fff' },

  // Styles Suggestions
  content: { paddingHorizontal: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  insightCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10,
    alignItems: 'center',
    elevation: 1
  },
  indicator: { width: 4, height: '100%', borderRadius: 2, marginRight: 15 },
  insightTitle: { fontSize: 15, fontWeight: '700', color: '#334155' },
  insightContent: { fontSize: 13, color: '#64748b', marginTop: 2 },

  // Styles Chat
  // Cette partie est CRUCIALE pour l'affichage
  chatWrapper: { 
    flex: 1, // Prend tout l'espace disponible sous les onglets
    flexDirection: 'column',
    justifyContent: 'flex-end', // Pousse l'input vers le bas
  },
  
  messagesArea: { 
    flex: 1, // La liste des messages prend tout l'espace restant
  },
/*
  inputArea: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    // Pour s'assurer que l'input ne soit pas caché par la barre de navigation Android
    marginBottom: Platform.OS === 'android' ? 5 : 0 
  },
  
  input: { 
    flex: 1, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    height: 45, // Taille confortable pour le pouce
    color: '#1e293b'
  },

  sendBtn: { 
    marginLeft: 10, 
    backgroundColor: '#2a2f4f', 
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20 
  },
  sendBtnText: { color: '#fff', fontWeight: 'bold' },*/
  msg: { width: '100%', marginBottom: 10, flexDirection: 'row' },
  msgUser: { justifyContent: 'flex-end' },
  msgAssistant: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 18 },
  bubbleUser: { backgroundColor: '#2a2f4f', borderBottomRightRadius: 2 },
  bubbleAssistant: { backgroundColor: '#e2e8f0', borderBottomLeftRadius: 2 },
  textUser: { color: '#fff' },
  textAssistant: { color: '#1e293b' },

  inputArea: { 
    padding: 15, 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0',
    marginBottom: Platform.OS === 'android' ? 5 : 0  
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 50,
  },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 15, height: 40 },
  sendBtn: { marginLeft: 10, justifyContent: 'center', paddingHorizontal: 15, backgroundColor: '#2a2f4f', borderRadius: 20 },
  sendBtnText: { color: '#fff', fontWeight: 'bold' },
  quickActionsContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  quickActionBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickActionText: {
    fontSize: 12,
    color: '#2a2f4f',
    fontWeight: '600',
  },
});
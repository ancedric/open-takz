import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { userStore } from '@/store/index';
import { useRouter } from 'expo-router';
import supabase from '@/service/supabase';

const DefaultAvatar = require('@/assets/images/Default-avatar.png');

export default function ProfileScreen() {
  const { user, employe, company } = userStore?.user || {} as any;
  const navigation = useRouter()
  const [ tasks, setTasks ] = useState([]);

  const handleLogout = async () => {
    await userStore.logout();
    navigation.replace('/Login');
  };

  const getTasks = async () => {
    try{
      const {data, error} = await supabase
      .from('assignments')
      .select('*, task:taskref(status)')
      .eq('userref', user?.userref);

      if(error) throw error;

      setTasks(data);
      return data;
    }catch(err){
      console.error("Erreur lors de la récupération des tâches:", err);
    }
  }

  useEffect(() => {
    getTasks()
  }, [])

  return (
    <ScrollView style={styles.container}>
      {/* Header avec Avatar */}
      <View style={styles.header}>
        <Image 
          source={user?.profilephotourl ? { uri: user.profilephotourl } : DefaultAvatar} 
          style={styles.avatar} 
        />
        <Text style={styles.userName}>{user?.firstname} {user?.lastname}</Text>
        <Text style={styles.userRole}>{employe?.position || 'Employé'}</Text>
      </View>

      {/* Statistiques rapides (Similaires à ton Home.vue) */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}> {tasks.length} </Text>
          <Text style={styles.statLabel}>Missions</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{tasks.filter((t) => t.task.status === 'ongoing').length}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
      </View>

      {/* Informations Professionnelles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ma Compagnie</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Entreprise</Text>
          <Text style={styles.infoValue}>{company?.companyname || 'Non assigné'}</Text>
          
          <Text style={[styles.infoLabel, {marginTop: 10}]}>Secteur</Text>
          <Text style={styles.infoValue}>{company?.activity || 'Non assigné'}</Text>
        </View>
      </View>

      {/* Coordonnées */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations Personnelles</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Téléphone</Text>
            <Text style={styles.infoValue}>{user?.phone || 'Non renseigné'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pays</Text>
            <Text style={styles.infoValue}>{user?.country}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
      
      <Text style={styles.version}>Corevia Mobile v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    backgroundColor: '#2a2f4f', 
    paddingVertical: 40, 
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff', marginBottom: 15 },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  userRole: { fontSize: 14, color: '#9da6e0', marginTop: 5 },
  
  statsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: -30, 
    marginHorizontal: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#004581' },
  statLabel: { fontSize: 12, color: '#64748b' },

  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 10, marginLeft: 5 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, elevation: 1 },
  infoRow: { marginBottom: 12 },
  infoLabel: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' },
  infoValue: { fontSize: 15, color: '#334155', fontWeight: '500', marginTop: 2 },

  logoutBtn: { 
    marginHorizontal: 20, 
    marginTop: 40, 
    backgroundColor: '#fee2e2', 
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  logoutText: { color: '#ef4444', fontWeight: 'bold' },
  version: { textAlign: 'center', color: '#94a3b8', fontSize: 10, marginVertical: 20 }
});
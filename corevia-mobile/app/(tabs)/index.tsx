import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Modal, TouchableOpacity, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import Card from '@/components/Card';
import supabase from '@/service/supabase'; // Ton client
import { userStore } from '@/store/index';

const DefaultCompany = require('@/assets/images/company.png');

interface Post {
  jobref: string;
  author: string;
  title: string;
  description: string;
  created_at: string;
  location: string;
}

interface Job extends Post {
  type: string;
  file_url: string;
  company: {
    logo_url: string | null;
    companyname: string;
  }
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);

  const [formApp, setFormApp] = useState({
  firstname: '',
  lastname: '',
  email: '',
  resume_url: ''
});

  const handleOpenDetails = (job: Job): void => {
    setSelectedJob(job);
    setShowModal(true);
  };

  // Fonction pour charger les données (Similaire à ta logique Vue)
  const loadFeed = async () => {
    setLoading(true);
    try {
      // On simule ou on va chercher les projets/annonces
      // Pour l'instant on garde une structure proche de ta liste 'posts'
      const { data, error } = await supabase
        .from('jobs')
        .select('*, company:companyref (*)')
        //.gt('deadline', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
  
        setPosts(data);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const submitApplication = async () => {
    setSubmittingApp(true);
                        
    try {
        const appRef = 'APP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        // 1. Insertion dans la table applications
        const { error: appError } = await supabase.from('applications').insert({
            appref: appRef,
            candidate_ref: userStore.user.user.userref,
            jobref: selectedJob.jobref,
            ...formApp,
            status: 'pending'
        });

        if (appError) throw appError;

        // 2. Insertion dans ta table notifications existante
        const notifRef = 'NOTIF-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        await supabase.from('notifications').insert({
            notifref: notifRef,
            title: "Nouvelle Candidature",
            content: `${formApp.firstname} a postulé pour : ${selectedJob.title}`,
            isread: false,
            userref: selectedJob.created_by,
            createdat: new Date().toISOString()
        });

        // --- AUTOMATISATION : Sauvegarder le job  ---
        await supabase.from('saved_jobs').insert({ 
                userref: userStore.user?.user?.userref, 
                jobref: selectedJob.jobref 
            });
        // Simulation de l'envoi (comme ton handleSubmitApplication)
        setTimeout(() => {
          setSubmittingApp(false);
          setHasApplied(true);
          setSelectedJob(null);
        }, 1500);

    } catch (err) {
        console.log("Erreur lors de l'envoi", err);
    }
};

  useEffect(() => {
    loadFeed();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentCtn}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          loadFeed();
        }} />
      }
    >
      <Text style={styles.title}>Actualités et offres</Text>
      
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#2a2f4f" style={{ marginTop: 20 }} />
      ) : (
        posts.map(post => (<Card key={post.jobref} post={post} onOpenDetails={handleOpenDetails} />))
      )}

      {!loading && posts.length === 0 && (
        <Text style={styles.empty}>Aucune actualité pour le moment.</Text>
      )}
    </ScrollView>
    {/* LA MODALE DE DÉTAILS */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Bouton fermer (Close-X dans ton Vue) */}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowModal(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            {selectedJob && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Image 
                    source={selectedJob.company.logo_url ? { uri: selectedJob.company.logo_url } : DefaultCompany} 
                    style={styles.modalLogo} 
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{selectedJob.title}</Text>
                    <Text style={styles.modalAuthor}>{selectedJob.company?.companyname}</Text>
                  </View>
                </View>

                <View style={styles.modalTags}>
                  <View style={styles.tag}><Text style={styles.tagText}>{selectedJob.type}</Text></View>
                  <View style={styles.tag}><Text style={styles.tagText}>{selectedJob.location}</Text></View>
                </View>

                <View style={styles.detailsBody}>
                  {selectedJob.file_url && (<Image
                    source={{ uri: selectedJob.file_url }} 
                    style={styles.image} 
                  />)}
                  <Text style={styles.sectionTitle}>Description du poste</Text>
                  <Text style={styles.descriptionText}>{selectedJob.description}</Text>
                </View>

                {/* Section Action : Postuler ou Confirmation */}
                {!hasApplied ? (
                  <View style={styles.applySection}>
                    <Text style={styles.infoText}>
                      En cliquant sur le bouton, vos informations de profil (Nom, Email, CV) seront transmises à {selectedJob.company?.companyname}.
                    </Text>
                    <TouchableOpacity 
                      style={styles.applyBtn} 
                      onPress={submitApplication}
                    >
                      {submittingApp ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.applyBtnText}>Envoyer ma candidature</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>✓ Candidature envoyée avec succès !</Text>
                    <TouchableOpacity onPress={() => setShowModal(false)}>
                      <Text style={{ color: '#004581', marginTop: 10, fontWeight: '600' }}>Fermer</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentCtn: { alignItems: 'center', paddingVertical: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 20, marginLeft: '5%', alignSelf: 'flex-start' },
  
  // Styles de la Modale
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', // Apparaît du bas
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    height: '80%', // Hauteur comme dans ton design
  },
  closeBtn: { alignSelf: 'flex-end', padding: 10 },
  closeText: { fontSize: 20, color: '#94a3b8' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalLogo: { width: 60, height: 60, borderRadius: 10, marginRight: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#004581' },
  modalAuthor: { fontSize: 16, color: '#64748b' },
  modalTags: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  tag: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  detailsBody: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 10 },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#e2e8f0',
  },
  descriptionText: { fontSize: 15, color: '#334155', lineHeight: 24 },
  applyBtn: { backgroundColor: '#2a2f4f', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  empty: { fontSize: 16, color: '#94a3b8', textAlign: 'center', marginTop: 20 },
  applySection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 20,
    marginTop: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  successBox: {
    backgroundColor: '#ecfdf5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  successText: {
    color: '#065f46',
    fontWeight: '700',
    fontSize: 16,
  },
});
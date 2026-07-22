import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, Image } from 'react-native';
import { userStore } from '@/store/index';
import supabase from '@/service/supabase';
import QRScanner from '@/components/QRScanner';

export default function EmployeePortal() {
  const { user, employe, company } = userStore.user || {};
  
  // États pour les données réelles
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [myPayroll, setMyPayroll] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  
  // États UI
  const [showScanner, setShowScanner] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [leaveData, setLeaveData] = useState({
    type: 'annuel',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchPortalData();
    checkTodayAttendance();
    
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const empId = employe.id;
      const userRef = user.userref;

      // 1. Récupérer la Paie
      const { data: payroll } = await supabase
        .from('payroll_history')
        .select('*')
        .eq('employee_id', empId)
        .order('created_at', { ascending: false });
      setMyPayroll(payroll || []);

      // 2. Récupérer les Missions (Assignments)
      const { data: tasks } = await supabase
        .from('assignments')
        .select('*, tasks:taskref(*, project: projectref(projectname))')
        .eq('userref', userRef);
      setMyTasks(tasks || []);

      // 3. Récupérer les Projets via Collaborator
      const { data: teamMemberships } = await supabase
        .from('collaborator')
        .select('userref, role, team:teamref(projectref)')
        .eq('userref', userRef);

      if (teamMemberships?.length > 0) {
        const projectRefs = teamMemberships.map(t => t.team.projectref);
        const { data: projectsData } = await supabase
          .from('project')
          .select('*')
          .in('projectref', projectRefs);
        setMyProjects(projectsData || []);
      }

    } catch (err) {
      console.error("Erreur de chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkTodayAttendance = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employe.id)
      .eq('date', today)
      .maybeSingle();
    
    if (data) setAttendanceRecord(data);
  };

  const handlePunch = async (scannedCompanyRef: string) => {
    if (scannedCompanyRef !== company.companyref) {
      Alert.alert("Erreur", "QR Code invalide pour cette entreprise.");
      return;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    try {
      if (!attendanceRecord) {
        // POINTAGE ARRIVÉE (Check-in)
        const limitTime = 8;
        const isLate = now.getHours() >= limitTime && now.getMinutes() > 0;
        
        const { data, error } = await supabase.from('attendance').insert([{
          employee_id: employe.id,
          companyref: company.companyref,
          date: today,
          check_in: now.toISOString(),
          status: isLate ? 'retard' : 'present'
        }]).select().single();

        if (error) throw error;
        setAttendanceRecord(data);
        Alert.alert("Bienvenue", "Pointage d'arrivée enregistré.");
      } else {
        // POINTAGE DÉPART (Check-out)
        if (attendanceRecord.check_out) {
          Alert.alert("Info", "Journée terminée. A demain!");
          const { data, error } = await supabase.from('attendance')
            .update({ check_out: now.toISOString() })
            .eq('id', attendanceRecord.id)
            .select().single();
          if (!error) setAttendanceRecord(data);
        }

        const { data, error } = await supabase.from('attendance')
          .update({ check_out: now.toISOString() })
          .eq('id', attendanceRecord.id)
          .select().single();

        if (error) throw error;
        setAttendanceRecord(data);
        Alert.alert("Au revoir", "Pointage de départ enregistré.");
      }
      setShowScanner(false);
    } catch (err) {
      Alert.alert("Erreur", "Impossible de mettre à jour le pointage.");
    }
  };

  const submitLeaveRequest = async () => {
    if (!leaveData.startDate || !leaveData.endDate) {
      Alert.alert("Erreur", "Veuillez saisir les dates.");
      return;
    }

    setIsSubmittingLeave(true);
    try {
      const { error } = await supabase.from('leave_requests').insert([{
        request_ref: `LEAV-${Date.now()}`,
        employee_id: employe.id,
        employee_name: `${user.firstname} ${user.lastname}`,
        companyref: company.companyref,
        type: leaveData.type,
        start_date: leaveData.startDate,
        end_date: leaveData.endDate,
        reason: leaveData.reason,
        status: 'pending'
      }]);

      if (error) throw error;
      Alert.alert("Succès", "Demande de congé envoyée.");
      setShowLeaveModal(false);
    } catch (err) {
      Alert.alert("Erreur", "Échec de l'envoi de la demande.");
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2a2f4f" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Bonjour, {user?.firstname}</Text>
        <Text style={styles.jobInfo}>{employe?.position} • {company?.companyname}</Text>
      </View>

      {/* SECTION POINTAGE */}
      <View style={styles.punchCard}>
        <Text style={styles.liveTime}>{currentTime}</Text>
        <Text style={styles.dateLabel}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        
        {attendanceRecord?.check_out ? (
            <View style={styles.completedDay}>
                <Text style={styles.completedText}>✅ Journée terminée</Text>
            </View>
        ) : (
            attendanceRecord ? (
            <TouchableOpacity 
                style={[styles.punchBtn, styles.btnOut]}
                onPress={() => handlePunch(company.companyref)}
            >
                <Text style={styles.punchBtnText}>
                    Enregistrer mon départ
                </Text>
            </TouchableOpacity>
          ) : (<TouchableOpacity 
                style={[styles.punchBtn, styles.btnIn]}
                onPress={() => setShowScanner(true)}
            >
                <Text style={styles.punchBtnText}>
                    Scanner pour Arriver
                </Text>
            </TouchableOpacity>) 
        )}
      </View>

      {/* MISSIONS & TÂCHES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes Missions</Text>
        {myTasks.length === 0 ? <Text style={styles.empty}>Aucune tâche assignée</Text> : 
          myTasks.map((item: any) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.tasks?.taskname}</Text>
              <Text style={styles.itemSubtitle}>{item.tasks?.project?.projectname}</Text>
              <View style={[styles.statusBadge, {backgroundColor: item.tasks?.status === 'completed' ? '#dcfce7' : '#fee2e2'}]}>
                 <Text style={{color: item.tasks?.status === 'completed' ? '#16a34a' : '#ef4444', fontSize: 10}}>{item.tasks?.status}</Text>
              </View>
            </View>
          ))
        }
      </View>

      {/* ACTIONS RH */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gestion RH</Text>
        <TouchableOpacity style={styles.leaveBtn} onPress={() => setShowLeaveModal(true)}>
          <Text style={styles.leaveBtnText}>+ Demander un congé</Text>
        </TouchableOpacity>
      </View>

      {/* PAIE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Derniers Bulletins</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {myPayroll.map((pay: any) => (
            <View key={pay.id} style={styles.payrollCard}>
              <Text style={styles.payMonth}>{pay.month}</Text>
              <Text style={styles.payAmount}>{pay.net_salary.toLocaleString()} XAF</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* MODALES (Scanner & Congés) */}
      {showScanner && (
        <Modal animationType="fade">
          <QRScanner onClose={() => setShowScanner(false)} onScanSuccess={handlePunch} />
        </Modal>
      )}

      <Modal visible={showLeaveModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Demande de congé</Text>
            <TextInput placeholder="Date début (YYYY-MM-DD)" style={styles.modalInput} onChangeText={(t) => setLeaveData({...leaveData, startDate: t})} />
            <TextInput placeholder="Date fin (YYYY-MM-DD)" style={styles.modalInput} onChangeText={(t) => setLeaveData({...leaveData, endDate: t})} />
            <TextInput placeholder="Motif" multiline style={[styles.modalInput, {height: 80}]} onChangeText={(t) => setLeaveData({...leaveData, reason: t})} />
            
            <TouchableOpacity style={styles.submitLeaveBtn} onPress={submitLeaveRequest} disabled={isSubmittingLeave}>
              <Text style={styles.submitLeaveText}>{isSubmittingLeave ? 'Envoi...' : 'Soumettre'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowLeaveModal(false)}><Text style={styles.cancelLink}>Annuler</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 25, paddingTop: 60, backgroundColor: '#fff' },
  welcome: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  jobInfo: { color: '#64748b', fontSize: 14, marginTop: 4 },
  punchCard: { margin: 20, padding: 25, backgroundColor: '#fff', borderRadius: 20, alignItems: 'center', elevation: 3 },
  liveTime: { fontSize: 36, fontWeight: '800', color: '#1e293b' },
  dateLabel: { color: '#94a3b8', marginBottom: 20 },
  punchBtn: { width: '100%', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnIn: { backgroundColor: '#10b981' },
  btnOut: { backgroundColor: '#ef4444' },
  punchBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  completedDay: { padding: 15, backgroundColor: '#f0fdf4', borderRadius: 10, width: '100%', alignItems: 'center' },
  completedText: { color: '#16a34a', fontWeight: 'bold' },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  itemCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#2a2f4f' },
  itemTitle: { fontSize: 15, fontWeight: '600' },
  itemSubtitle: { fontSize: 12, color: '#94a3b8' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 5 },
  payrollCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginRight: 15, width: 150, borderWidth: 1, borderColor: '#e2e8f0' },
  payMonth: { fontSize: 12, color: '#64748b' },
  payAmount: { fontSize: 14, fontWeight: 'bold' },
  leaveBtn: { padding: 15, backgroundColor: '#fff', borderStyle: 'dashed', borderWidth: 1, borderColor: '#2a2f4f', borderRadius: 12, alignItems: 'center' },
  leaveBtnText: { color: '#2a2f4f', fontWeight: 'bold' },
  empty: { color: '#94a3b8', fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  modalInput: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, marginBottom: 10 },
  submitLeaveBtn: { backgroundColor: '#2a2f4f', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitLeaveText: { color: '#fff', fontWeight: 'bold' },
  cancelLink: { textAlign: 'center', marginTop: 15, color: '#94a3b8' }
});
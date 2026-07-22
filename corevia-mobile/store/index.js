import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from '@/service/supabase';

const mockUser = {
    // Correspond à la table 'user'
    user: {
        userref: 'u123-abc-456',
        firstname: 'Cedric',
        lastname: 'Fullstack',
        email: 'cedric@corevia.cm',
        phone: '+237 600 000 000',
        country: 'Cameroon',
        role: 'employee',
        avatar_url: null, // Sera remplacé par l'image par défaut
    },
    
    // Correspond à la table 'employe'
    employe: {
        employeref: 'emp-789',
        userref: 'u123-abc-456',
        deptref: 'dept-btp-01', // Pour filtrer les projets plus tard
        job_title: 'Ingénieur de Chantier Principal',
        salary: 250000,
        hired_at: '2023-01-15',
        status: 'active'
    },
    
    // Correspond à la table 'company' (jointe dans ton code Vue)
    company: {
        companyref: 'comp-corevia-001',
        name: 'SGC BTP Cameroon',
        logo_url: null,
        address: 'Bonanjo, Douala',
        sector: 'Construction & BTP',
        website: 'https://corevia.cm'
    }
  };

export const userStore = {
  user: null,
  projects: [],
  isAuthenticated: false,

  // Équivalent de ton action authenticate dans index.js
  async authenticate(email, password) {
    /*const sessionData = { user: mockUser.user, employe: mockUser.employe, company: mockUser.company };
    this.user = sessionData;
    this.isAuthenticated = true;*/
    console.log("Authenticating with email:", email);
    try {
      // 1. Auth Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;
      // 2. Récupération données User
      const { data: userData, error: dbError } = await supabase
        .from('user')
        .select('*')
        .eq('userref', authData.user.id)
        .single();

      if (dbError) throw dbError;
      // 3. Récupération Employé et Company
      const { data: empData } = await supabase
        .from('employe')
        .select('*, company:companyref (*)')
        .eq('userref', userData.userref)
        .single();

      console.log("Authenticated User:", userData);
      console.log("Authenticated Employe:", empData);
      console.log("Authenticated Company:", empData.company);

      this.isAuthenticated = true;
      this.user = { user: userData, employe: empData, company: empData.company };

      // 4. Stockage local
      await AsyncStorage.setItem('user', JSON.stringify(this.user));

    } catch (error) {
      console.error("Erreur de connexion", error.message);
    }
  },

  // Action pour charger les projets (inspirée de ton getProjects)
  async fetchUserProjects() {
    /*try {
      if (!this.user?.employe?.deptref) return;

      const { data, error } = await supabase
        .from('project')
        .select(`*, task (*), team (*)`)
        .eq('deptref', this.user.employe.deptref);

      if (!error) this.projects = data;
    } catch (err) {
      console.error("Erreur projets:", err);
    }*/
    console.log("fetchUserProjects called, but it's currently a placeholder.");
  },
  async logout() {
    this.user = null;
    this.isAuthenticated = false;
    await AsyncStorage.removeItem('user');
    await supabase.auth.signOut();
  }
};
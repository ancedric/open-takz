import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useRouter } from 'expo-router';
//import { supabase } from '../supabase';
import { userStore } from '../store/index';

type RootStackParamList = {
  Home: undefined;
  Register: undefined;
};

type LoginNavigationProp = NavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }
    setSubmitting(true);
    await userStore.authenticate(email, password);
    if(userStore.isAuthenticated) {
      Alert.alert("Succès", "Connexion réussie");
      setSubmitting(false);
      router.replace('/(tabs)');
    } else {
      Alert.alert("Erreur", "Échec de la connexion");
      setSubmitting(false);
    }    
  };

  return (
    <View style={styles.container}>
      <View style={styles.authCtn}>
        <Text style={styles.title}>Sign In</Text>
        
        <View style={styles.inputCtn}>
          <Text style={styles.label}>Email address</Text>
          <TextInput 
            style={styles.input} 
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputCtn}>
          <Text style={styles.label}>Password</Text>
          <TextInput 
            style={styles.input} 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry={!showPassword}
          />
        </View>

        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.hideOrShow}>{showPassword ? 'Hide' : 'Show'} password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.authBtn} onPress={handleLogin} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.switchText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 20 },
  authCtn: { width: '100%', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2a2f4f', marginBottom: 30 },
  inputCtn: { width: '100%', marginBottom: 20, position: 'relative' },
  label: { position: 'absolute', top: -10, left: 15, backgroundColor: '#fff', paddingHorizontal: 5, zIndex: 1, fontSize: 12, color: '#9da6e0' },
  input: { height: 50, borderWidth: 1, borderColor: '#9da6e0', borderRadius: 10, paddingHorizontal: 15, fontSize: 16, color: '#2a2f4f' },
  hideOrShow: { alignSelf: 'flex-end', color: '#9da6e0', fontSize: 12, marginBottom: 20 },
  authBtn: { backgroundColor: '#2a2f4f', width: '100%', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchText: { marginTop: 20, color: '#666', fontSize: 14 },
});
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, ActivityIndicator, Alert 
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
//import { supabase } from '../supabase';
//import { userStore } from '../store/userStore';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [accountType, setAccountType] = useState('employee');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Cameroon'); // Pays par défaut
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !firstname || !lastname) {
      Alert.alert("Erreur", "Veuillez remplir les champs obligatoires");
      return;
    }

    setSubmitting(true);
    /*try {
      // 1. Inscription Auth Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Création du profil dans la table 'user'
      const { error: profileError } = await supabase.from('user').insert([
        {
          userref: authData.user.id,
          firstname,
          lastname,
          email,
          phone,
          country,
          role: accountType,
          created_at: new Date(),
        }
      ]);

      if (profileError) throw profileError;

      Alert.alert("Succès", "Compte créé ! Veuillez vérifier votre email.");
      navigation.navigate('Login');

    } catch (error) {
      Alert.alert("Erreur d'inscription", error.message);
    } finally {
      setSubmitting(false);
    }*/
    console.log("Sign up attempted with email:", email, "and password:", password);
    setSubmitting(false);
    navigation.navigate('Login');

  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.authCtn}>
        <Text style={styles.title}>SIGN UP</Text>

        {/* Type de compte */}
        <View style={styles.inputCtn}>
          <Text style={styles.label}>Type de compte</Text>
          <View style={styles.pickerSimulated}>
             <TouchableOpacity onPress={() => setAccountType('owner')}>
                <Text style={accountType === 'owner' ? styles.activeType : styles.inactiveType}>Chef d'entreprise</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={() => setAccountType('employee')}>
                <Text style={accountType === 'employee' ? styles.activeType : styles.inactiveType}>Employé</Text>
             </TouchableOpacity>
          </View>
        </View>

        {/* Champs texte */}
        {[
          { label: 'First Name', value: firstname, setter: setFirstname, type: undefined as any },
          { label: 'Last Name', value: lastname, setter: setLastname, type: undefined as any },
          { label: 'Email address', value: email, setter: setEmail, type: 'email-address' },
          { label: 'Phone number', value: phone, setter: setPhone, type: 'phone-pad' }
        ].map((item, index) => (
          <View key={index} style={styles.inputCtn}>
            <Text style={styles.label}>{item.label}</Text>
            <TextInput 
              style={styles.input} 
              value={item.value} 
              onChangeText={item.setter} 
              keyboardType={item.type}
              autoCapitalize={item.type === 'email-address' ? 'none' : 'words'}
            />
          </View>
        ))}

        {/* Password */}
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

        {/* Sélecteur de pays simplifié */}
        <View style={styles.inputCtn}>
          <Text style={styles.label}>Country</Text>
          <TextInput style={styles.input} value={country} onChangeText={setCountry} />
        </View>

        <TouchableOpacity style={styles.authBtn} onPress={handleSignUp} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign Up</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.switchText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  authCtn: { width: '100%', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2a2f4f', marginBottom: 30 },
  inputCtn: { width: '100%', marginBottom: 20, position: 'relative' },
  label: { position: 'absolute', top: -10, left: 15, backgroundColor: '#fff', paddingHorizontal: 5, zIndex: 1, fontSize: 12, color: '#9da6e0' },
  input: { height: 50, borderWidth: 1, borderColor: '#9da6e0', borderRadius: 10, paddingHorizontal: 15, fontSize: 16 },
  pickerSimulated: { flexDirection: 'row', justifyContent: 'space-around', height: 50, alignItems: 'center', borderWidth: 1, borderColor: '#9da6e0', borderRadius: 10 },
  activeType: { color: '#2a2f4f', fontWeight: 'bold' },
  inactiveType: { color: '#9da6e0' },
  hideOrShow: { alignSelf: 'flex-end', color: '#9da6e0', fontSize: 12, marginBottom: 20 },
  authBtn: { backgroundColor: '#2a2f4f', width: '100%', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchText: { marginTop: 20, color: '#666', fontSize: 14, textAlign: 'center' }
});
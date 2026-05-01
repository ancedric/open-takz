// app/index.tsx
import { Redirect } from 'expo-router';
import { userStore } from '@/store/index';

export default function Index() {
  // Si l'utilisateur n'est PAS connecté, on le force vers le login
  if (!userStore.isAuthenticated) {
    return <Redirect href="/Onboarding" />;
  }

  // Sinon, on l'envoie vers l'accueil
  return <Redirect href="/(tabs)" />;
}
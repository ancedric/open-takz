// src/axios.js
import axios from 'axios';
import { useUserStore } from '../store/index.js'

// Intercepteur pour ajouter le token dans l'en-tête de chaque requête
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('user-token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses 401/403
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Le token est invalide ou a expiré
      const userStore = useUserStore();
      userStore.logout();
      window.location.href = '/auth'; // Redirection vers la page de connexion
    }
    return Promise.reject(error);
  }
);

export default axios;
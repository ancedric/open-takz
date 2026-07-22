import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import fr from './locales/fr.json'

const i18n = createI18n({
  legacy: false, // On utilise l'API Composition (indispensable pour Vue 3)
  locale: navigator.language.split('-')[0] || 'en', // Détection auto du navigateur
  fallbackLocale: 'en',
  messages: {
    en,
    fr
  }
})

export default i18n
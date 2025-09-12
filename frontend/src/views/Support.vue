<template>
    <Header/>
    <div class="support">
      <h1>Support</h1>
      <p>Besoin d'aide ? Nous sommes là pour vous aider !</p>
      <div class="support-options">
        <div class="support-option">
          <h2>Contactez-nous</h2>
          <p>Adresse e-mail : <a href="mailto:cedric.ananga@yahoo.com">support@opentask.com</a></p>
          <p>Téléphone : +237 655 583 365</p>
        </div>
        <div class="support-option">
          <h2>FAQ</h2>
          <div class="faq-section">
            <div class="faq-question" v-for="(faq, index) in faqs" :key="index">
              <h3>{{ faq.question }}</h3>
              <div class="faq-answer" :class="{ 'show': faq.show }">
                <p>{{ faq.answer }}</p>
              </div>
              <button class="faq-toggle" @click="toggleAnswer(faq)">Voir la réponse</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

<script setup>
import { ref } from 'vue';
import Header from '../components/Header.vue'

const faqs = ref([
  {
    question: 'Comment créer un compte ?',
    answer: 'Pour créer un compte, cliquez sur le bouton "Sign Up" en haut à droite de la page d\'accueil.',
    show: false,
  },
  {
    question: 'Comment réinitialiser mon mot de passe ?',
    answer: 'Pour réinitialiser votre mot de passe, cliquez sur le lien "Mot de passe oublié" en bas de la page de connexion.',
    show: false,
  },
  {
    question: 'Comment utiliser la fonctionnalité X ?',
    answer: 'Pour utiliser la fonctionnalité X, cliquez sur le bouton "X" en haut à gauche de la page.',
    show: false,
  },
]);

function toggleAnswer(faq) {
  faq.show = !faq.show;
}
</script>

  <style scoped>
  .support {
    padding-top: 70px;
  margin: 40px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.support h1 {
  font-size: 24px;
  margin-bottom: 10px;
}

.support p {
  margin-bottom: 20px;
}

.support-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.support-option {
  margin: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: calc(33.33% - 20px);
}

.faq-section {
  margin-top: 20px;
}

.faq-question {
  margin-bottom: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.faq-question h3 {
  font-size: 16px;
  margin-bottom: 10px;
}

.faq-answer {
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  display: none;
}

.faq-answer.show {
  display: block;
}

.faq-toggle {
  background-color: #4CAF50;
  color: #fff;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

.faq-toggle:hover {
  background-color: #3e8e41;
}

.faq-answer p {
  font-size: 14px;
  margin-bottom: 20px;
}

.faq-answer ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.faq-answer li {
  margin-bottom: 10px;
}

.faq-answer a {
  text-decoration: none;
  color: #337ab7;
}

.faq-answer a:hover {
  color: #23527c;
}

/* Styles responsives */

@media screen and (max-width: 1024px) {
  .support {
    max-width: 700px;
    margin: 30px auto;
    padding: 15px;
  }
  .support-option {
    width: calc(50% - 20px);
  }
}

@media screen and (max-width: 768px) {
  .support {
    max-width: 600px;
    margin: 20px auto;
    padding: 10px;
  }
  .support-option {
    width: 100%;
    margin: 10px 0;
  }
  .faq-question {
    padding: 15px;
  }
  .faq-answer {
    padding: 15px;
  }
}

@media screen and (max-width: 480px) {
  .support {
    max-width: 100%;
    margin: 10px auto;
    padding: 5px;
  }
  .support-option {
    margin: 5px 0;
  }
  .faq-question {
    padding: 10px;
  }
  .faq-answer {
    padding: 10px;
  }
  .faq-toggle {
    padding: 5px 10px;
    font-size: 14px;
  }
}

@media screen and (max-width: 360px) {
  .support {
    padding: 0;
  }
  .support-option {
    margin: 0;
  }
  .faq-question {
    padding: 5px;
  }
  .faq-answer {
    padding: 5px;
  }
  .faq-toggle {
    padding: 3px 5px;
    font-size: 12px;
  }
}
</style>
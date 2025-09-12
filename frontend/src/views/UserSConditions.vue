<template>
    <Header />
    <div class="conditions">
      <h1>Conditions d'utilisation</h1>
      <p>En utilisant OpenTask, vous acceptez les conditions d'utilisation ci-dessous.</p>
      <h2>1. Définitions</h2>
      <ul>
        <li>"OpenTask" désigne l'application et ses services.</li>
        <li>"Utilisateur" désigne toute personne utilisant OpenTask.</li>
        <li>"Données" désigne les informations collectées par OpenTask.</li>
      </ul>
      <h2>2. Collecte et utilisation des données</h2>
      <p>OpenTask collecte des données pour fournir et améliorer ses services.</p>
      <h2>3. Confidentialité</h2>
      <p>OpenTask s'engage à protéger la confidentialité des utilisateurs.</p>
      <h2>4. Sécurité</h2>
      <p>OpenTask prend des mesures pour protéger les données contre l'accès non autorisé.</p>
      <h2>5. Responsabilité</h2>
      <p>L'utilisateur est responsable de la sécurité de ses informations de connexion.</p>
      <h2>6. Modification des conditions</h2>
      <p>OpenTask se réserve le droit de modifier ces conditions à tout moment.</p>
      <h2>7. Loi applicable</h2>
      <p>Ces conditions sont régies par la loi du Cameroun.</p>
      <h2>8. Acceptation</h2>
      <p>En utilisant OpenTask, vous acceptez ces conditions.</p>
      <h2>9. Contact</h2>
      <p>Pour toute question ou préoccupation, veuillez <a href="mailto:cedric.ananga@yahoo.com">nous contacter</a>.</p>
      <p>Date de mise à jour : 06/11/2024</p>
    </div>
  </template>
  
  <script>
  
  import Header from '../components/Header.vue'
  export default {
    name: 'Conditions',
    data() {
      return {};
    },
  };
  </script>
  
  <style scoped>
  .conditions {
    padding-top: 70px;
  margin: 40px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.conditions h1 {
  font-size: 24px;
  margin-bottom: 10px;
}

.conditions h2 {
  font-size: 18px;
  margin-bottom: 10px;
}

.conditions ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.conditions li {
  margin-bottom: 10px;
}

.conditions p {
  margin-bottom: 20px;
}

/* Responsive */

@media screen and (max-width: 1024px) {
  .conditions {
    max-width: 700px;
  }
}

@media screen and (max-width: 860px) {
  .conditions {
    max-width: 600px;
  }
}

@media screen and (max-width: 480px) {
  .conditions {
    max-width: 90%;
    padding: 10px;
  }
  .conditions h1 {
    font-size: 20px;
  }
  .conditions h2 {
    font-size: 16px;
  }
}

@media screen and (max-width: 320px) {
  .conditions {
    max-width: 80%;
    padding: 5px;
  }
  .conditions h1 {
    font-size: 18px;
  }
  .conditions h2 {
    font-size: 14px;
  }
}
  </style>
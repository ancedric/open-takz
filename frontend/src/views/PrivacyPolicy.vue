<template>
    <div class="politique-confidentialite">
        <router-link to="/home">Home</router-link>
      <h1>Politique de Confidentialité</h1>
      <p>OpenTask est engagé à protéger la confidentialité et la sécurité des informations personnelles de ses utilisateurs.</p>
      <h2>1. Collecte des informations</h2>
      <ul>
        <li>Nom et prénom</li>
        <li>Adresse e-mail</li>
        <li>Mot de passe (haché)</li>
        <li>Informations de connexion (adresse IP, navigateur, etc.)</li>
        <li>Historique d'utilisation</li>
      </ul>
      <h2>2. Utilisation des informations</h2>
      <p>Nous utilisons les informations collectées pour fournir les services, améliorer la sécurité, personnaliser l'expérience utilisateur et envoyer des notifications et des mises à jour.</p>
      <h2>3. Partage des informations</h2>
      <p>Nous ne partageons pas les informations personnelles avec des tiers sans consentement explicite.</p>
      <h2>4. Sécurité</h2>
      <p>Nous prenons des mesures pour protéger les informations contre l'accès non autorisé, la perte, l'altération ou la destruction.</p>
      <h2>5. Droits des utilisateurs</h2>
      <ul>
        <li>Accéder à leurs informations personnelles</li>
        <li>Modifier leurs informations personnelles</li>
        <li>Supprimer leurs informations personnelles</li>
        <li>S'opposer au traitement de leurs informations personnelles</li>
      </ul>
      <h2>6. Modification de la politique</h2>
      <p>Nous nous réservons le droit de modifier cette politique à tout moment.</p>
      <h2>7. Contact</h2>
      <p>Pour toute question ou préoccupation, veuillez contacter <a href="mailto:contact@opentask.com">contact@opentask.com</a>.</p>
      <button @click="downloadPdf()">Télécharger au format PDF</button>
      <button @click="printPage()">Imprimer la page</button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'PolitiqueConfidentialite',
    data() {
      return {};
    },
    methods: {
      // Méthode pour télécharger la politique de confidentialité au format PDF
      downloadPdf() {
        const link = document.createElement('a');
        link.href = 'politique-confidentialite.pdf';
        link.download = 'politique-confidentialite.pdf';
        link.click();
      },
      // Méthode pour imprimer la page
      printPage() {
        window.print();
      },
    },
  };
  </script>
  
  <style scoped>
  .politique-confidentialite {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.politique-confidentialite h1 {
  font-size: 24px;
  margin-bottom: 10px;
}

.politique-confidentialite h2 {
  font-size: 18px;
  margin-bottom: 10px;
}

.politique-confidentialite ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.politique-confidentialite li {
  margin-bottom: 10px;
}

.politique-confidentialite p {
  margin-bottom: 20px;
}

.politique-confidentialite a {
  text-decoration: none;
  color: #337ab7;
}

.politique-confidentialite a:hover {
  color: #23527c;
}

button {
  background-color: #4CAF50;
  color: #fff;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

button:hover {
  background-color: #3e8e41;
}

/* Styles responsives */

@media screen and (max-width: 1024px) {
  .politique-confidentialite {
    max-width: 700px;
    margin: 30px auto;
    padding: 15px;
  }
  .politique-confidentialite h1 {
    font-size: 20px;
  }
  .politique-confidentialite h2 {
    font-size: 16px;
  }
  button {
    padding: 8px 15px;
    font-size: 14px;
  }
}

@media screen and (max-width: 768px) {
  .politique-confidentialite {
    max-width: 600px;
    margin: 20px auto;
    padding: 10px;
  }
  .politique-confidentialite h1 {
    font-size: 18px;
  }
  .politique-confidentialite h2 {
    font-size: 14px;
  }
  button {
    padding: 6px 12px;
    font-size: 12px;
  }
}

@media screen and (max-width: 480px) {
  .politique-confidentialite {
    max-width: 100%;
    margin: 10px auto;
    padding: 5px;
  }
  .politique-confidentialite h1 {
    font-size: 16px;
  }
  .politique-confidentialite h2 {
    font-size: 12px;
  }
  button {
    padding: 4px 8px;
    font-size: 10px;
  }
}
  </style>
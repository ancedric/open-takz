<template>
    <Header />
    <div class="mentions-legales">
      <h1>Mentions Légales</h1>
      <p>OpenTask est un service en ligne édité par <strong>The G Code</strong>, société de services Internet ayant son siège social à Beedi Douala.</p>
      <h2>Éditeur</h2>
      <p>The G Code, société de services Internet</p>
      <p>Adresse : Beedi Douala</p>
      <p>Téléphone : +237 655 583 365</p>
      <p>E-mail : ceric.ananga@yahoo.com</p>
      <h2>Hébergeur</h2>
      <p>Render, www.render.com</p>
      <h2>Directeur de la publication</h2>
      <p>Cédric ananga, CEO</p>
      <h2>Protection des données personnelles</h2>
      <p>OpenTask s'engage à protéger les données personnelles de ses utilisateurs.</p>
      <h2>Propriété intellectuelle</h2>
      <p>Tous les contenus du site sont la propriété exclusive de The G Code.</p>
      <h2>Responsabilité</h2>
      <p>OpenTask ne peut être tenu responsable des dommages résultant de l'utilisation de son service.</p>
      <h2>Droit applicable</h2>
      <p>Les présentes mentions légales sont régies par la loi [loi applicable].</p>
      <h2>Contact</h2>
      <p>Pour toute question ou préoccupation, veuillez contacter <a href="mailto:cedric.ananga@yahoo.com">contact@opentask.com</a>.</p>
    </div>
</template>

<script setup>
  import Header from '../components/Header.vue'
</script>

<style scoped>
    .mentions-legales {
  padding-top: 70px;
  margin: 40px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.mentions-legales h1 {
  font-size: 24px;
  margin-bottom: 10px;
}

.mentions-legales h2 {
  font-size: 18px;
  margin-bottom: 10px;
}

.mentions-legales p {
  margin-bottom: 20px;
}

.mentions-legales a {
  text-decoration: none;
  color: #337ab7;
}

.mentions-legales a:hover {
  color: #23527c;
}

/* Styles responsives */

@media screen and (max-width: 1024px) {
  .mentions-legales {
    max-width: 700px;
    margin: 30px auto;
    padding: 15px;
  }
  .mentions-legales h1 {
    font-size: 20px;
  }
  .mentions-legales h2 {
    font-size: 16px;
  }
}

@media screen and (max-width: 768px) {
  .mentions-legales {
    max-width: 600px;
    margin: 20px auto;
    padding: 10px;
  }
  .mentions-legales h1 {
    font-size: 18px;
  }
  .mentions-legales h2 {
    font-size: 14px;
  }
}

@media screen and (max-width: 480px) {
  .mentions-legales {
    max-width: 100%;
    margin: 10px auto;
    padding: 5px;
  }
  .mentions-legales h1 {
    font-size: 16px;
  }
  .mentions-legales h2 {
    font-size: 12px;
  }
  .mentions-legales p {
    margin-bottom: 15px;
  }
}

@media screen and (max-width: 360px) {
  .mentions-legales {
    padding: 0;
  }
  .mentions-legales h1 {
    font-size: 14px;
  }
  .mentions-legales h2 {
    font-size: 10px;
  }
  .mentions-legales p {
    margin-bottom: 10px;
  }
}

@media screen and (max-width: 280px) {
  .mentions-legales {
    font-size: 12px;
  }
  .mentions-legales h1 {
    font-size: 12px;
  }
  .mentions-legales h2 {
    font-size: 9px;
  }
  .mentions-legales p {
    margin-bottom: 5px;
  }
}
</style>
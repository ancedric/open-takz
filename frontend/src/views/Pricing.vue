<template>
    <div class="pricing-page">
      <h1>Tarifs</h1>
      <div class="plans">
        <div class="plan free">
          <h2>Plan Free</h2>
          <ul>
            <li>5 utilisateurs maximum</li>
            <li>100 tâches par mois</li>
            <li>1 GB de stockage</li>
            <li>Support par e-mail</li>
          </ul>
          <p class="price">Gratuit</p>
          <button><router-link to="/register">S'inscrire</router-link></button>
        </div>
        <div class="plan pro">
          <h2>Plan Pro</h2>
          <ul>
            <li>20 utilisateurs maximum</li>
            <li>500 tâches par mois</li>
            <li>10 GB de stockage</li>
            <li>Support par téléphone et e-mail</li>
            <li>Intégration avec Google Calendar et Slack</li>
            <li>Rapports personnalisés</li>
          </ul>
          <p class="price">$9.99/mois (facturé annuellement) ou $12.99/mois (facturé mensuellement)</p>
          <button><router-link to="/register">S'abonner</router-link></button>
        </div>
        <div class="plan enterprise">
          <h2>Plan Entreprise</h2>
          <ul>
            <li>Nombre d'utilisateurs illimité</li>
            <li>10 000 tâches par mois</li>
            <li>100 GB de stockage</li>
            <li>Support par téléphone, e-mail et ticket</li>
            <li>Intégration avec Active Directory et SAML</li>
            <li>Rapports personnalisés et analytiques avancées</li>
          </ul>
          <p class="price">Sur demande</p>
          <button><router-link to="/contact">Nous contacter</router-link></button>
        </div>
      </div>
      <div class="comparison">
        <h2>Comparaison des plans</h2>
        <table>
          <tr>
            <th>Fonctionnalité</th>
            <th>Plan Free</th>
            <th>Plan Pro</th>
            <th>Plan Entreprise</th>
          </tr>
          <tr>
            <td>Nombre d'utilisateurs</td>
            <td>5</td>
            <td>20</td>
            <td>Illimité</td>
          </tr>
          <tr>
            <td>Tâches par mois</td>
            <td>100</td>
            <td>500</td>
            <td>10 000</td>
          </tr>
          <tr>
            <td>Stockage</td>
            <td>1 GB</td>
            <td>10 GB</td>
            <td>100 GB</td>
          </tr>
          <tr>
            <td>Support</td>
            <td>E-mail</td>
            <td>Téléphone et e-mail</td>
            <td>Téléphone et e-mail </td>
          </tr>
        </table>
      </div>
      <div class="faq">
        <h2>FAQ</h2>
        <ul>
          <li>
            <p>Qu'est-ce que la période d'essai ?</p>
            <p>Notre période d'essai est de 14 jours pour le plan Pro.</p>
          </li>
          <li>
            <p>Puis-je annuler mon abonnement à tout moment ?</p>
            <p>Oui, vous pouvez annuler votre abonnement à tout moment.</p>
          </li>
          <li>
            <p>Quels sont les moyens de paiement acceptés ?</p>
            <p>Nous acceptons les cartes de crédit et les virements bancaires.</p>
          </li>
        </ul>
      </div>
    </div>
  </template>
  
  
  <style scoped>
  .pricing-page {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.plans {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.plan {
  margin: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: calc(33.33% - 20px);
}

.plan.free {
  background-color: #dff0d8;
}

.plan.pro {
  background-color: #f7f7f7;
}

.plan.enterprise {
  background-color: #f0f0f0;
}

.plan h2 {
  font-size: 18px;
  margin-bottom: 10px;
}

.plan ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plan li {
  margin-bottom: 10px;
}

.plan .price {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.plan button {
  background-color: #4CAF50;
  color: #fff;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

.plan button:hover {
  background-color: #3e8e41;
}

.comparison {
  margin-top: 40px;
}

.comparison table {
  border-collapse: collapse;
  width: 100%;
}

.comparison th, .comparison td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}

.comparison th {
  background-color: #f0f0f0;
}

.faq {
  margin-top: 40px;
}

.faq ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.faq li {
  margin-bottom: 20px;
}

.faq p {
  margin-bottom: 10px;
}

/* Styles responsives */

@media screen and (max-width: 1024px) {
  .pricing-page {
    max-width: 700px;
    margin: 30px auto;
    padding: 15px;
  }
  .plan {
    width: calc(50% - 20px);
  }
}

@media screen and (max-width: 768px) {
  .pricing-page {
    max-width: 600px;
    margin: 20px auto;
    padding: 10px;
  }
  .plan {
    width: 100%;
    margin: 10px 0;
  }
  .comparison table {
    font-size: 14px;
  }
}

@media screen and (max-width: 480px) {
  .pricing-page {
    max-width: 100%;
    margin: 10px auto;
    padding: 5px;
  }
  .plan {
    margin: 5px 0;
  }
  .comparison table {
    font-size: 12px;
  }
  .faq li {
    margin-bottom: 15px;
  }
}

@media screen and (max-width: 360px) {
  .pricing-page {
    padding: 0;
  }
  .plan {
    margin: 0;
  }
  .comparison table {
    font-size: 10px;
  }
  .faq li {
    margin-bottom: 10px;
  }
}
</style>
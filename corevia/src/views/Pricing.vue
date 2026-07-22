<template>
  <header>
        <router-link to='/' ><img src="../assets/images/logo-2.png" alt="Corevia Logo" class="logo"></router-link>
        <nav>
          <ul class="menu-list">
            <li><router-link to='/docs' class="menuLink">Docs</router-link></li>
            <li><router-link to='/pricing' class="menuLink">Pricing</router-link></li>
          </ul>
          <router-link to='/auth' class="navLink1">Log in</router-link>
          <router-link to='/register' class="navLink2">Sign up</router-link>
        </nav>
      </header>
    <div class="pricing-page">
      <div class="page-head"><h1>Pricing</h1></div>
      <div class="plans">
        <div class="plans-grid">
          <div class="plan-card">
              <h3>Free</h3>
              <div class="price">Free<span> for 1 month</span></div>
              <ul>
                  <li>Limited acces to modules</li>
                  <li>Limited support</li>
              </ul>
          </div>
          <div class="plan-card">
              <h3>Monthly</h3>
              <div class="price">29€<span>/mois</span></div>
              <ul>
                  <li>Illimited access to modules</li>
                  <li>Priority Support</li>
                  <li>Stock management module included</li>
              </ul>
          </div>

          <div class="plan-card popular">
              <div class="badge">Save 20%</div>
              <h3>Annual</h3>
              <div class="price">290€<span>/year</span></div>
              <ul>
                  <li>2 free months offer</li>
                  <li>Beta Functionalities</li>
                  <li>Multi-entreprises</li>
              </ul>
          </div>
        </div>
      </div>  
      <div class="comparison">
        <h2>Plans Comparison</h2>
        <table>
          <tr>
            <th>Fonctionnalities</th>
            <th>Free</th>
            <th>Month</th>
            <th>Annual</th>
          </tr>
          <tr>
            <td>Modules access</td>
            <td>Limited</td>
            <td>Total</td>
            <td>Total</td>
          </tr>
          <tr>
            <td>Support</td>
            <td>Limited</td>
            <td>Priority</td>
            <td>Priority</td>
          </tr>
          <tr>
            <td>Beta Functionalities</td>
            <td>/</td>
            <td>/</td>
            <td>Access</td>
          </tr>
          <tr>
            <td>Multi enterprises</td>
            <td>/</td>
            <td>/</td>
            <td>Access </td>
          </tr>
        </table>
      </div>
      <div class="faq">
        <h2>FAQ</h2>
        <ul>
          <li>
            <p>What is the trial period ?</p>
            <p>Our trial period is for 1 Month.</p>
          </li>
          <li>
            <p>Can i cancel my subscription at any moment ?</p>
            <p>Yes, you cancel your subscription at any moment.</p>
          </li>
          <li>
            <p>What are the accepted payment solutions ?</p>
            <p>We accept debit cards et bank transfers.</p>
          </li>
        </ul>
      </div>
    </div>
  </template>
  
  <script setup>
  import Header from '../components/Header.vue';
</script>
  
  <style scoped>
  header {
      position: fixed;
      top: 0;
      left: 0;display: flex;
      justify-content: space-around;
      align-items: center;
      width: 100%;
      height: 50px;
      background-color: #1e293b;
      color: #fff;
      padding: 10px;
      text-align: center;
      z-index: 100;

      .logo{
        width: 120px;
        height: auto;
        object-fit: contain;
        margin-right: 20px;

        @media (max-width: 400px){
          width: 100px;
        }
      }

      nav{
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        width: auto;

        .menu-list{
          display: flex;
          list-style: none;
          gap: 20px;
          margin: 0;
          padding: 0;

          @media (max-width: 600px){
            display: none;
            
          }

          li{
            cursor: pointer;
            &:hover{
              text-decoration: underline;
            }
            
            .menuLink{
              text-decoration: none;
              color: #eee;
              font-size: 1rem;
              transition: all .3s ease;
              &:hover{
                color: #61f8a5;
              }
            }
          }
        }
        .navLink1, .navLink2{
          text-decoration: none;
          color: #eee;
          border: 2px solid;
          width: 70px;
          margin: 10px;
          padding: 5px;
          border-radius: 5px;
          cursor: pointer;
          transition: all .3s ease;
          &:hover{
            background-color: #eeeeee65;
            color:#eee;
          }

          @media (max-width: 400px){
            width: 60px;
            font-size: 0.8rem;
            padding: 3px;
            margin: 5px;
            border: 1px solid;
            border-radius: 3px;
          }
        }
        .navLink1{
          color: #333;
          background-color: #eee;
        }
      }
    }
  .pricing-page {
    margin: 40px auto;
    padding: 20px;
    background-color: #f9f9f9;

    .page-head{
      text-align: center;
      margin-bottom: 30px;
      width: 100%;
      height: 100px;
      padding: 20px;
      background-color: #a9b6f0;
      h1{
        font-size: 2.5rem;
        font-weight: bold;
        color: #333;
      }
    }
    .plans{
      display: flex;
      justify-content: center;
      width: 100%;

      @media(max-width: 768px) {
        flex-direction: column;
        align-items: center;
      }

      .plans-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin: 40px 0;
          .plan-card {
            border: 2px solid #e2e8f0;
            padding: 30px;
            border-radius: 16px;
            transition: all 0.3s ease;
            .badge {
              position: absolute;
              top: -12px;
              left: 50%;
              transform: translateX(-50%);
              background: #f59e0b;
              color: white;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
            }

            .price {
                font-size: 32px;
                font-weight: 800;
                margin: 20px 0;
            }

            .price span {
                font-size: 16px;
                color: #64748b;
            }
          }
          .plan-card.popular {
            border-color: #f59e0b;
            position: relative;
            transform: scale(1.05);
          }
      }
    }
    
}



.plan 
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
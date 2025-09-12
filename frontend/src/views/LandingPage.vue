<template>
    <div class="landing-page">
      <header>
        <nav>
          <router-link to='/auth' class="navLink1">Log in</router-link>
          <router-link to='/register' class="navLink2">Sign up</router-link>
        </nav>
      </header>
      <main>
        <section class="hero">
          <h1>OpenTask</h1>
          <p>Manage yours projects efficiently</p>
          <p class="italic">Organise the work in your organization simply</p>
          <button class="action"><router-link to='/register' class="subsc">Get In today</router-link></button>
        </section>
        <div class="landing-body">
          <section class="features">
            <h2>Features</h2>
            <ul>
              <li>
                <i class="fas fa-check"></i>
                Create custom tasks
              </li>
              <li>
                <i class="fas fa-clock"></i>
                Define your deadlines
              </li>
              <li>
                <i class="fas fa-list"></i>
                Manage tasks evolution
              </li>
              <li>
                <i class="fas fa-users"></i>
                Idéal for professionals businesses 
              </li>
            </ul>
          </section>
          <section class="benefits">
            <h2>Benefits</h2>
            <ul>
              <li>
                <i class="fas fa-rocket"></i>
                Encrease your productivity
              </li>
              <li>
                <i class="fas fa-cog"></i>
                Simplify your tasks management
              </li>
              <li>
                <i class="fas fa-chart-line"></i>
                Follow your progress in real time
              </li>
            </ul>
          </section>
        </div>
        
        <section class="call-to-action">
          <h2>Join OpenTask community</h2>
          <button class="action"><router-link to='/register' class="link">Inscrivez-vous maintenant</router-link></button>
        </section>
        <footer>
          <p>copyright© OpenTask, 2024, All rights reserved</p>
        </footer>
      </main>
    </div>
  </template>

  <style scoped>
    .landing-page, main {
      display: flex; 
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: #f0f0f0;
      padding: 0;
      margin: 0;
      width: 100%;
      overflow-x: hidden;
    }

    header {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 50px;
      background-color: #333;
      color: #fff;
      padding: 10px;
      text-align: center;
    }

    header nav {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
    }

    header nav .navLink1,
    header nav .navLink2{
      text-decoration: none;
      color: #eee;
      border: 2px solid;
      width: 70px;
      margin: 10px;
      padding: 5px;
    }
    header nav .navLink1{
      color: #333;
      background-color: #eee;
    }
    .hero {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100vh;
      margin: 0;
      background-image: linear-gradient(to bottom, #004581, #042e52);
      color: #fff;;
      text-align: center;
    }

    .hero h1 {
        font-size: 1.2rem;
        }
    .action{
          width: 300px;
          height:50px;
          border: 3px solid #eee;
          background: transparent;
          transition: all .3s ease;
          color: #eee;
          cursor: pointer;
          &:hover{
            background-color: #eee;
            .subsc{
              color:#555;
            }
          }
          
    }
        .hero .italic{
          font-style: italic;
          font-size: 0.7rem;
        }
        
        .action .subsc{
          text-decoration: none;
          color: #eee;
        }

    .landing-body{
      display: flex;
      justify-content: center;
      gap: 10px;
      width: 100%;
      margin: 10px;
    }
    .features,
    .benefits{
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        width: 40%;
        border: 1px solid #ddd;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        margin: 10px;
      }

    li {
        margin: 10px;
        padding: 10px;
        
        }

    i {
        margin-right: 10px;
      }

    .call-to-action {
        background-color: #333;
        color: #fff;
        padding: 20px;
        text-align: center;
        width: 100%;
        }

    .call-to-action button {
        background-color: #555;
        color: #fff;
        border: none;
        padding: 10px 20px;
        font-size: 16px;
        cursor: pointer;
        }

    .call-to-action button:hover {
        background-color: #666;
    }
    footer{
      width: 100%;
      background-color: #666;
      color: #eee;
      font-size: 0.7rem;
      text-align: center;
    }
    
    .link{
      text-decoration: none;
      color: #eee;
      margin: 10px;
      padding: 5px;
    }
    /* Styles responsives */

@media screen and (max-width: 1024px) {
  header {
    padding: 5px;
  }
  .hero {
    padding: 30px;
  }
  .features, .benefits {
    flex-direction: column;
  }
  li {
    margin: 5px;
    padding: 5px;
  }
}

@media screen and (max-width: 860px) {
  header {
    padding: 3px;
  }
  .hero {
    padding: 20px;
  }
  .hero h1 {
    font-size: 22px;
  }
  .landing-body{
      flex-direction: column;
      align-items: center;
    }
    .features,
    .benefits{
      width: 80%;
      padding: 5px;
    }
  li {
    margin: 3px;
    padding: 3px;
  }
  .call-to-action {
    padding: 15px;
  }
  .call-to-action button {
    padding: 5px 10px;
    font-size: 14px;
  }
  footer{
      font-size: 0.6rem;
  }
}

@media screen and (max-width: 480px) {
  header {
    padding: 2px;
  }
  .hero {
    padding: 15px;
  }
  .hero h1 {
    font-size: 18px;
  }
  li {
    margin: 2px;
    padding: 2px;
  }
  .call-to-action {
    padding: 10px;
  }
  .call-to-action button {
    padding: 3px 5px;
    font-size: 12px;
  }
  footer{
      font-size: 0.5rem;
  }
}

@media screen and (max-width: 360px) {
  header {
    padding: 1px;
  }
  .hero {
    padding: 10px;
  }
  .hero h1 {
    font-size: 16px;
  }
  li {
    margin: 1px;
    padding: 1px;
  }
  .call-to-action {
    padding: 5px;
  }
  .call-to-action button {
    padding: 2px 3px;
    font-size: 10px;
  }
}

@media screen and (max-width: 280px) {
  header {
    padding: 0;
  }
  .hero {
    padding: 5px;
  }
  .hero h1 {
    font-size: 14px;
  }
  li {
    margin: 0;
    padding: 0;
  }
  .call-to-action {
    padding: 0;
  }
  .call-to-action button {
    padding: 1px 2px;
    font-size: 9px;
  }
}
</style>

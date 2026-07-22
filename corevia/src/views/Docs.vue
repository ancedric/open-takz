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
    <div>
        <h2>Documentation</h2>
        <h4>	COREVIA OVERVIEW</h4>

        <p>Corevia is a company management system that helps industries to optimize their productivity.<br>
        Corevia centralize all operations that companies share between many softwares, wich causes a lack of time and productivity,<br> 
        and can easily become heavy for employees. Moreover, it centralize datas that companies share between many remote servers.<br> 
        Using that solution facilitates the management, and automatize operations that spend much time in the enterprise.</p>

        <h4>AVAILABLE MODULES</h4>
            <ul>
                <li>Human Ressources</li>
                <li>Accounting</li>
                <li>Finances and payrolls</li>
                <li>Marketing</li>
                <li>customized departments</li>
            </ul>
            
        <h4>A-HUMAN RESSOURCES</h4>
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
</style>
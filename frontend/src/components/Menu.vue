<script setup>
import { useUserStore } from '../store/index';

const userStore = useUserStore()
</script>

<template>
  <nav class="sidebar">
    <div class="module-switcher">
      <h3>Mon Entreprise</h3>
    </div>
    <ul class="nav-links">
      <li><router-link to="/app/projects">📁 Projets</router-link></li>
      <li><router-link to="/app/hr">👥 Ressources Humaines</router-link></li>
      <li><router-link to="/app/finance">💰 Finance</router-link></li>
    </ul>
  </nav>
</template>

<style scoped>
    .menu-ctn{
        width: 100%;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        padding: 20px 0;
        @media screen and (max-width: 860px){
            width: 40px;
            height:40px;
        }

        .menu-list{
            display: flex;
            justify-content: space-around;
            align-items: center;
            gap: 20px;
            list-style: none;
            padding: 0;
            margin: 0;

            .link{
                position: relative;
                text-decoration: none;
                color: #505181;
                font-size: 1rem;
                font-weight: 400;
                padding: 5px 20px;
                border-bottom:2px solid #505181;
                transition: all 0.3s ease-in-out;

                &:hover{
                    background-color: transparent;
                    color: #8296ce;
                    border-bottom: 10px solid #505181;
                }
                @media screen and (max-width: 860px){
                    font-size: 0.8rem;
                    padding: 5px 10px;
                }
            }
        }
    }
</style>
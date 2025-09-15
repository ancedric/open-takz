<script setup>
import { useUserStore } from '../store/index';

const userStore = useUserStore()
</script>

<template>
    <div class="menu-ctn">
        <ul class="menu-list">
            <li class="list-item"><router-link :to="`/project/${userStore.user.userref}`" class="link">Projects</router-link></li>
        </ul>
    </div>
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
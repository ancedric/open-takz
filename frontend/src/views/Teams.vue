<template>
    <div class="teams-ctn">
        <Header/>
        <div class="teams" v-if="!isLoading">
            <Spinner />
        </div>
        <div class="teams" v-else>
            <h3>Your Teams</h3>
        </div>
    </div>
</template>

<script setup>
    import { ref } from 'vue'
    import Header from '../components/Header.vue'
    import Spinner from '../components/Spinner.vue'

    const isLoading = ref(false)
</script>

<style scoped>
</style>
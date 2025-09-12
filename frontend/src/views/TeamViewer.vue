<template>
    <div class="team-viewer">
        <h1>Team Viewer</h1>
        <p>Welcome to the Team Viewer page. Here you can manage and view your team members.</p>
        <ul>
            <li v-for="member in teamMembers" :key="member.id">
                {{ member.name }} - {{ member.role }}
            </li>
        </ul>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const teamMembers = ref([
    { id: 1, name: 'Alice', role: 'Developer' },
    { id: 2, name: 'Bob', role: 'Designer' },
    { id: 3, name: 'Charlie', role: 'Project Manager' },
]);
</script>

<style scoped>
.team-viewer {
    font-family: Arial, sans-serif;
    padding: 20px;
}

.team-viewer h1 {
    color: #333;
}

.team-viewer ul {
    list-style-type: none;
    padding: 0;
}

.team-viewer li {
    margin: 5px 0;
}
</style>
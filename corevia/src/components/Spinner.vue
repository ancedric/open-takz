<template>
    <div class="loader"></div>
    <p>Please Wait...</p>
</template>

<style scoped>
    .loader {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 30px;
        height: 30px;
        margin-left: 20px;
        border: 5px solid #f3f3f3; /* Couleur de fond */
        border-top: 5px solid #3498db; /* Couleur animée */
        border-radius: 50%;
        animation: spin 1s linear infinite; /* Animation */
    }
    p{
        width: 80px;
        text-align: center;
        font-size:  0.6rem;
        color: #3498db; /* Couleur du texte */
        margin-top: 10px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>
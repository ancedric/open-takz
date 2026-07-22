<script setup>
    const props = defineProps({
        percent: Number
    })
</script>

<template>
    <div class="bar-ctn">
        <div class="progression" :style="{width: props.percent + '%'}"></div>
    </div>
    
</template>

<style scoped>
    .bar-ctn{
        width: 80%;
        height: 10px;
        background-color: #eee;
        border-radius: 50px;
        z-index: 2;
        position: relative;
    }
    .progression{
        position: absolute;
        top: 0;
        left: 0;
        height: 10px;
        background-color: #3cf20f;
        border-radius: 50px;
    }
</style>
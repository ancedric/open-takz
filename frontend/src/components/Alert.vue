<template>
    <div :class="{alertCtn:true, danger: isDanger, success:isSuccess}"
    >
        <p> {{ message }} </p>
    </div>
</template>

<script setup>
    import { ref } from 'vue';

    const props = defineProps({
        type: String,
        action: String,
        message: String
    })

    const isDanger = ref(false)
    const isSuccess = ref(false)
    const isVisible = ref(false)
    const message = ref(props.message)

    if (props.type === 'danger'){
        isDanger.value = true
        isSuccess.value = false
        
        setTimeout(() => isDanger.value = false, 5000)
    } else if (props.type === 'success'){
        isDanger.value = false
        isSuccess.value = true
        
        setTimeout(() => isSuccess.value = false, 5000)
    }
</script>
<style scoped>
    .alertCtn{
        opacity: 0;
        position: absolute;
        left: 100px;
        bottom: 100px;
        width: 400px;
        height: 40px;
        font-size :0.8rem;
        text-align: center;
        border-radius: 10px;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);
        z-index: 99;
    }
    .alertCtn.danger{
        opacity: 1;
        color:#af0f04;
        background-color:#f3b1ac;
        border: 1px solid #af0f04;
    }
    .alertCtn.success{
        opacity: 1;
        background-color: #a8f3ae;
        color:#04af12;
        border: 1px solid #04af12;
    }
</style>
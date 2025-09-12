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
        action: String
    })

    const isDanger = ref(false)
    const isSuccess = ref(false)
    const isVisible = ref(false)
    const message = ref('')

    if (props.type === 'danger'){
        isDanger.value = true
        isSuccess.value = false
        if(props.action === 'emptyField' ){
            message.value = 'Please fill all form fields before continuing'
        }
        else if(props.action === 'error'){
            message.value = 'An error occured when processing the operation'
        }
        

        setTimeout(() => isDanger.value = false, 5000)
    } else if (props.type === 'success'){
        isDanger.value = false
        isSuccess.value = true
        
        if(props.action === 'loggedIn'){
            message.value = 'Successfully logged in'
        }
        else if(props.action === 'modified'){
            message.value = 'Modification succeed'
        }else if(props.action === 'added'){
            message.value = 'Successfully added'
        }

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
    }
    .alertCtn.danger{
        opacity: 1;
        color:#af0f04;
        background-color:#f3b1ac;
        border: 3px solid #af0f04;
    }
    .alertCtn.success{
        opacity: 1;
        background-color: #a8f3ae;
        color:#04af12;
        border: 3px solid #04af12;
    }
</style>
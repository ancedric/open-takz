import { ref } from 'vue';
export const toast = ref({ show: false, message: '', type: 'success' });

export const triggerToast = (message, type) => {      
    toast.value = { show: true, message, type };
      setTimeout(() => {
          toast.value.show = false;
      }, 4000);
};
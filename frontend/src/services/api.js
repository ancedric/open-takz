import axios from 'axios';

const baseUrl = "http://localhost:5000"

export const api = axios.create({
    baseURL: baseUrl, 
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        if(config.url.includes('/user/login') || config.url.includes('/user/signup')){
            return config;
        }
        const session = localStorage.getItem('user');
        
        if (session) {
            try{
                const token = JSON.parse(session)?.token
                if(token){
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch(e){
                console.error("Erreur de parsing du token ", e);
            }
            
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
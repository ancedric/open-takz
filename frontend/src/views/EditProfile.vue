<template>
    <section class="page">
        <div class="profile-ctn">
            <div class="user">
                <p class="link" @click="backHome">Home</p>            
                <div v-if="userStore.user === undefined">
                    No user connected...
                </div>
                <div v-else class="sum-ctn">
                    <form action="" @submit.prevent="handleSubmit">
                        <div class="profile-sum">
                            <div class="profile-photo">
                                <img v-if="imageUrl" :src="imageUrl" :alt="imageUrl">
                            </div>
                            <div class="input-ctn">
                                <div class="label">Profile Photo</div>
                                <input class="set-input-file" type="file" name="profile-photo" @change="onFileSelected">
                            </div>
                            <div class="input-ctn">
                                <div class="label" for="firstName">first Name</div>
                                <input class="set-input" type="text" name="firstName" v-model="firstName" :placeholder='firstName'>
                            </div>
                            <div class="input-ctn">
                                <div class="label">Last Name</div>
                                <input class="set-input" type="text" name="lastName" v-model="lastName" :placeHolder='lastName'>
                            </div>
                            <div class="input-ctn">
                                <div class="label">Email Address</div>
                                <input class="set-input" type="email" name="email" v-model="email" :placeHolder="email">
                            </div>
                        </div>
                        <div class="profile-details"> 
                            <div class="input-ctn">
                                <div class="label">Company</div>
                                <input class="set-input" type="text" name="company" v-model="company" :placeHolder="company">
                            </div>
                            <div class="input-ctn">
                                <div class="label">City</div>
                                <input class="set-input" type="text" name="city" v-model="city" :placeHolder="city">
                            </div>
                            <div class="input-ctn">
                                <div class="label">Country</div>
                                <select class="set-input" name="country" v-model="country" :placeHolder="country">
                                    <option value="Algeria">Algeria</option>
                                    <option value="Cameroon">Cameroon</option>
                                    <option value="France">France</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="United States">United States</option>
                                </select>
                            </div>
                            <div class="user-plan">
                            <div class="input-ctn">
                                <div class="label">Choose your plan</div>
                                <select class="set-input" name="plan" v-model="plan" :placeHolder="plan">
                                    <option value="free">Free</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">EnterPrises</option>
                                </select>
                            </div>
                        </div>
                        <router-link to="/pricing" class="link">See Pricing details</router-link>
                        <button type="submit" class="save-btn">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </section>
    <Alert type="danger" action="emptyField" v-if="notFilled"/>
    <Alert type="danger" action="error" v-if="errors"/>
    <Alert type="success" action="loggedIn" v-if="success"/>
</template>

<script setup>
    import {ref, computed} from 'vue'
    import {useRouter} from "vue-router" 
    import { useUserStore } from '../store/index'
    import { useProfileStore } from '../store/profile'
    import supabase from '../services/supabaseConfig'
    import Alert from '../components/Alert.vue'

    const router = useRouter()
    const userStore = useUserStore()
    const profileStore = useProfileStore()

    const imageUrl = ref(profileStore.profile.profileImage)
    const firstName = ref(profileStore.profile.firstName)
    const lastName = ref(profileStore.profile.lastName)
    const email = ref(profileStore.profile.email)
    const company = ref(profileStore.profile.company)
    const country = ref(profileStore.profile.country)
    const city = ref(profileStore.profile.city)
    const plan = ref(profileStore.profile.plan)
    const errors = ref( false )
    const success= ref(false)
    const notFilled = ref(false)

    if(userStore.user === null || userStore.user === undefined){
        router.push('/auth')
    }

    const onFileSelected = async (event) => {
        const file = event.target.files[0]

        const { data, error } = await supabase.storage
        .from('user-profile-images')//nom du bucket dans le storage de supabase
        .upload(`avatars/$file.name`, file, {
            contentType: file.type,
        })

        if(error){
            console.error('Erreur lors du téléchargement :', error)
        }
        if(data){
            imageUrl.value = data.publicUrl
        }
    }

    const handleSubmit = async () =>{
        if(imageUrl.value === '' || 
            userfirstName.value === '' ||
            userlastName.value === '' ||
            useremail.value === '' ||
            usercompany.value === '' ||
            usercountry.value ==='' ||
            usercity.value ==='' ||
            userplan.value === ''
        ){
            notFilled.value = true  
            errors.value = false
            success.value = false

            setTimeout(() => notFilled.value = false , 3000)
        }else{
            const { data, error } = await supabase
                .from('Profile')
                .update({
                firstName: firstName.value,
                lastName: lastName.value,
                email: email.value,
                company: company.value,
                country: country.value,
                city: city.value,
                plan: plan.value,
                imageUrl: imageUrl.value
                })
                .eq('id', profile.userId)

                if(error){
                    console.log("Error during modification of the profile :", error)
                    errors.value = true

                    setTimeout(() => errors.value = false , 3000)
                }

                if(data){
                    success.value = true
                    router.push('/home')

                    setTimeout(() => success.value = false , 3000)
                }
        }
    }

const backHome = () =>{
    router.push({path: "/home"})
}
</script>

<style scoped>
    .link{
        font-family: Inter;
        font-size: 0.8rem;
        font-weight: 400;
        text-decoration: none;
        color: #004581;
        cursor: pointer;
    }
    .profile-ctn{
        display: flex;
        justify-content: space-between;
        align-items: start;
        width: 70vw;
        height: 80%;
        background-color: #eee;
        border-radius: 50px;
        box-shadow: 1px 1px 50px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        @media screen and (max-width: 860px){
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: start;
            width: 95vw;
            height: 95vh;
            padding: 0;
        }
    }
    .user{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    background-color : #eee;
    @media screen and (max-width: 860px){
            width: 100%;
            height: 50%;
        }
    }
    .user .sum-ctn{
        height: 85%;
        width: 90%;
        @media screen and (max-width : 860px){
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
        }
    }
    .profile-sum{
        padding-left: 20px;
        color: #505181;
        height: 100%;
        width: 50%;
        @media screen and (max-width: 860px){
            height: 100%;
            gap:20px;
        }
    }
    .set-input{
        height: 33px;
        width: 200px;
        border-radius: 10px;
        background-color: #eee;
        color: #9da6e0;
        font-family: Poppins;
        padding-left: 20px;
        border: 1px solid;
    }
    .set-input-file{
        height: 43px;
        width: 200px;
        border-radius: 10px;
        background-color: #eee;
        color: #9da6e0;
        font-family: Poppins;
        padding-left: 20px;
        padding-top: 10px;
        border: 1px solid;
    }
    .input-ctn{
        height: 43px;
        width: 200px;
        color: #9da6e0;
        margin-top: 20px;
        font-family: Poppins;
        padding-left: 20px;
        position: relative;
    }
    .input-ctn .label{
        position: absolute;
        top: -5px;
        left: 30px;
        font-size: 0.8rem;
        background-color: #eee;
        padding-left: 5px;
        padding-right: 5px;
        z-index: 1;
    }
    .profile-sum .profile-photo{
        width: 100px;
        height: 100px;
        margin-left: 20%;
        border: 6px solid #fff;
        border-radius: 50%;
        overflow: hidden;
    @media screen and (max-width:860px){
            width: 80px;
            height: 80px;
        }
    }
    .profile-sum .profile-photo img{
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .profile-details{
        width: 50%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #6b3e26;
        font-family: Inter;
        @media screen and (max-width: 860px){
            justify-content: flex-start;
            align-items: start;
            width: 100%;
            font-size: 0.8rem;
            padding-left: 70px;
        }
    }

    .save-btn{
        display: flex;
        justify-content: center;
        align-items: center;
        height: 40px;
        width: 80px;
        border: none;
        border-radius: 10px;
        background-color: #2a2f4f;
        color: #eee;
        font-family: Poppins;
        font-weight: 600;
        cursor: pointer;
        margin-top: 10px;
    }
</style>
<template>
    <div class="credits-ctn">
        <Header/>
        <div class="teams" v-if="!isLoading">
            <div class="page-head"><h1>Credits</h1></div>
                <router-link to="/">Home</router-link>
            <div class="credit">
                <h3>Images</h3>
                <h4>Icons8</h4>
                <div class="links">
                    <a target="_blank" href="https://icons8.com/icon/12776/calendar">Calendar</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
                    <a target="_blank" href="https://icons8.com/icon/102055/stopwatch">Chrono</a> icon by <a target="_blank" href="https://icons8.com">Icons8</
                    <a target="_blank" href="https://icons8.com/icon/0FpPU7mnnMD0/chart-increasing">Chart</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a><a target="_blank" href="https://icons8.com/icon/sz8cPVwzLrMP/check-mark">Check</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
                    <a target="_blank" href="https://icons8.com/icon/108335/conference-foreground-selected-skin-type-7">Team</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
                    <a target="_blank" href="https://icons8.com/icon/13912/facebook">Facebook</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
                    <a target="_blank" href="https://icons8.com/icon/6Fsj3rv2DCmG/x">X</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
                    <a target="_blank" href="https://icons8.com/icon/13930/linkedin">LinkedIn</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
                    <a target="_blank" href="https://icons8.com/icon/19318/youtube">YouTube</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import Header from '../components/Header.vue'

    const calendar = import.meta.env.CALENDAR_ICON
    const chrono = import.meta.env.CHRONO_ICON
    const chart = import.meta.env.CHART_ICON
    const check = import.meta.env.CHECK_ICON
    const team = import.meta.env.TEAM_ICON
    const facebook = import.meta.env.FACEBOOK_ICON
    const x = import.meta.env.X_ICON
    const linkedin = import.meta.env.LINKEDIN_ICON
    const youtube = import.meta.env.YOUTUBE_ICON

</script>

<style scoped>
    .credits-ctn{
        width: 100%;
        text-align: center;

        .page-head{
            text-align: center;
            margin-bottom: 30px;
            width: 100%;
            height: 100px;
            padding: 20px;
            background-color: #a9b6f0;
            h1{
                font-size: 2.5rem;
                font-weight: bold;
                color: #333;
            }
        }

        .teams{
            display: flex;
            flex-direction: column;

            .links{
                display: flex;
                flex-direction: column;
                text-align: left;
                padding: 50px;
            }
        }
         
        a{
            text-decoration: none;
        }
    }
</style>
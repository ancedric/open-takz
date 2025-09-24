<template>
    <div class="landing-page">
      <header>
        <h1>OpenTaskz</h1>
        <nav>
          <ul class="menu-list">
            <li><router-link to='/' class="menuLink">Features</router-link></li>
            <li><router-link to='/pricing' class="menuLink">Pricing</router-link></li>
          </ul>
          <router-link to='/auth' class="navLink1">Log in</router-link>
          <router-link to='/register' class="navLink2">Sign up</router-link>
        </nav>
      </header>
      <main>
        <section class="hero">
          <div class="left">
            <div class="accroche">Revolutionize your productivity with <b>OpenTaskz</b></div>
            <div class="sub-text">
              <p>We empower your Business by keeping everyone accountable for their work<br>
              Join thousands of professionals who trust OpenTaskz to manage their projects</p>
              <button @click="navigate" class="action">Get Started for Free</button>
            </div>
          </div>
          <div class="right">
            <div class="hero-img">
              <img src="../assets/images/femme-entrepreneure.png" alt="" />
            </div>
            <div class="img-diagram">
              <img src="../assets/images/home-screen.png" alt="" />
              <div class="float">
                <div class="circle-ctn">
                  <div class="circle">
                    <img src="../assets/icons/check-96.png" class="check">
                  </div>
                </div>
                  <p>The change begins HERE</p>
              </div>
            </div>
          </div>
        </section>
        <div class="landing-body">
          <section class="features">
            <div class="feat-header">
              <h2>Manage your timeline with <br> unparalleled efficiency</h2>
              <p>Experience the ultmate task management solution designed to suit all style of work, with an all-in-one tool that streamlines your workflow and simplifies your daily tasks.</p>
            </div>
            <div class="feat-ctn">
              <div class="feat-card">
                <div class="img-icon">
                  <div class="img">
                    <img src="../assets/icons/chrono-96.png" alt="" />
                  </div>
                  <div class="null"></div>
                </div>
                <div>
                  <h4>Task timeline dashboard</h4>
                  <p>Visualize your tasks and deadlines in a clear and intuitive timeline, allowing you to prioritize and manage your workload effectively.</p>
                </div>
              </div>
              <div class="feat-card">
                <div class="img-icon">
                  <div class="img">
                    <img src="../assets/icons/team-96.png" alt="" />
                  </div>
                  <div class="null"></div>
                </div>
                <div>
                  <h4>Collaboration tools</h4>
                  <p>Facilitate team collaboration with integrated communication tools, allowing you to share updates, files, and feedback in real time.</p>
                </div>
              </div>
              <div class="feat-card">
                <div class="img-icon">
                  <div class="img">
                    <img src="../assets/icons/chart-96.png" alt="" />
                  </div>
                  <div class="null"></div>
                </div>
                <div>
                  <h4>Progress tracking</h4>
                  <p>Monitor the progress of your tasks with visual indicators and reports, helping you stay on track and meet your deadlines.</p>
                </div>
              </div>
            </div>
            <div>
              <div class="target-audience">
                <div class="general">
                  OpenTaskz is a CRM solution that can be adapted to suit the needs of any industry or business
                </div>
                <div class="specific">
                  <ul>
                    <li><div class="dot-img"><img src="../assets/icons/checked.png" alt=""></div>Growing project teams</li>
                    <li><div class="dot-img"><img src="../assets/icons/checked.png" alt=""></div>Freelancers and consultants</li>
                    <li><div class="dot-img"><img src="../assets/icons/checked.png" alt=""></div>Agencies</li>
                    <li><div class="dot-img"><img src="../assets/icons/checked.png" alt=""></div>Devs aand PMs</li>
                    <li><div class="dot-img"><img src="../assets/icons/checked.png" alt=""></div>Startups</li>
                  </ul>
                </div>
              </div>
              <div>
                <div class="gantt-illustration"></div>
                <div class="circle-diagram-illustration"></div>
              </div>
            </div>
          </section>
          <section class="benefits">
            <div class="benefs">
              <div class="b-text">
                <h3>This platform serve as the central location for all your work</h3>
                <p>By using OpenTaskz, you can spend more time on team mangaement and less time on software-related tasks.</p>
              </div>
              <div class="b-list">
                <ul>
                  <li>
                    <img src="../assets/icons/check-96.png">
                    Projects managed in a day
                  </li>
                  <li>
                    <img src="../assets/icons/check-96.png">
                    Fast project planning
                  </li>
                  <li>
                    <img src="../assets/icons/check-96.png">
                    Team collaboration
                  </li>
                  <li>
                    <img src="../assets/icons/check-96.png">
                    Hours saved for your custommers
                  </li>
                  <li>
                    <img src="../assets/icons/check-96.png">
                    Reporting and analytics
                  </li>
                </ul>
              </div>
            </div>
            <div class="b-illustrations">
              <div class="b-illus i1">
                <div class="i-img">
                  <img src="../assets/images/team4.png" alt="">
                </div>
                <div class="i-img"><img src="../assets/images/team3.png" alt=""></div>
                <div class="i-img">
                  <img src="../assets/images/team2.png" alt="">
                </div>
                <div class="i-img">
                  <img src="../assets/images/team1.png" alt="">
                </div>
              </div>
              <div class="b-illus i3">
                <img src="../assets/icons/tasks-list.png" alt="">
              </div>
              <div class="b-illus i2">
                <img src="../assets/icons/projects-list.png" alt="">
              </div>
            </div>
          </section>
        </div>
        
        <section class="call-to-action">
          <h2>Ready to <em>organise</em> your remote work with us</h2>
          <p>Join us today and try the best project management tool in the industry today! Ensure you're spending where you want to be.</p>
          <div><button @click="navigate" class="action">Get Start today </button></div>
        </section>
        <footer>
          <div class="footer-top">
            <div class="footer-branding">
              <div>OpenTaskz</div>
              <div>
                <h5>Email Us at:</h5>
                <p>ancedric55@gmail.com</p>
              </div>
              <div class="social-links">
                <a href="#" class="link"><img src="../assets/icons/facebook-96.png" alt=""></a>
                <a href="#" class="link"><img src="../assets/icons/x-50.png" alt=""></a>
                <a href="#" class="link"><img src="../assets/icons/linkedin-96.png" alt=""></a>
                <a href="#" class="link"><img src="../assets/icons/youtube-96.png" alt=""></a>
              </div>
            </div>
            <div class="footer-links-ctn">
              <div class="footer-links">
                <h5>About</h5>
                <a href="#" class="link">Company</a>
                <router-link to="support" class="link">Support Team</router-link>
              </div>
              <div class="footer-links">
                <h5>Company</h5>
                <router-link to="/usersConditions" class="link">Terms of Use</router-link>
                <router-link to="privacyPolicy" class="link">Privacy Policy</router-link>
                <router-link to="legalNotice" class="link">Legal Notice</router-link>
                <router-link to="#" class="link">FAQs</router-link>
                <router-link to="credits" class="link">Credits</router-link>
                <p class="link">Béedi, Douala Cameroon</p>
              </div>
            </div>
          </div>
          <div class="footer-bottom">
            <p>copyright© OpenTask, {{ currentYear }} All rights reserved</p>
          </div>
        </footer>
      </main>
    </div>
  </template>

  <script setup>
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const currentYear = new Date().getFullYear()

  const navigate = () => {
    router.push('/register')
  }
  </script>

  <style scoped>
    .landing-page, main {
      display: flex; 
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: #f0f0f0;
      padding: 0;
      margin: 0;
      width: 100%;
      overflow-x: hidden;
    }

    header {
      position: fixed;
      top: 0;
      left: 0;display: flex;
      justify-content: space-around;
      align-items: center;
      width: 100%;
      height: 50px;
      background-color: #333;
      color: #fff;
      padding: 10px;
      text-align: center;
      z-index: 100;

      h1{
        font-size: 1.5rem;
        font-weight: bold;
        margin: 0;
      }

      nav{
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        width: auto;

        .menu-list{
          display: flex;
          list-style: none;
          gap: 20px;
          margin: 0;
          padding: 0;

          @media (max-width: 600px){
            display: none;
            
          }

          li{
            cursor: pointer;
            &:hover{
              text-decoration: underline;
            }
            
            .menuLink{
              text-decoration: none;
              color: #eee;
              font-size: 1rem;
              transition: all .3s ease;
              &:hover{
                color: #61f8a5;
              }
            }
          }
        }
        .navLink1, .navLink2{
          text-decoration: none;
          color: #eee;
          border: 2px solid;
          width: 70px;
          margin: 10px;
          padding: 5px;
          border-radius: 5px;
          cursor: pointer;
          transition: all .3s ease;
          &:hover{
            background-color: #eeeeee65;
            color:#eee;
          }

          @media (max-width: 400px){
            width: 60px;
            font-size: 0.8rem;
            padding: 3px;
            margin: 5px;
            border: 1px solid;
            border-radius: 3px;
          }
        }
        .navLink1{
          color: #333;
          background-color: #eee;
        }
      }
    }
    .hero {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100vh;
      margin: 0;
      margin-top: 50px;
      background-image: linear-gradient(to bottom, #c9e5fd, #135ea0);
      box-sizing: border-box;
      padding-bottom: 50px;
      padding-top: 50px;

      @media(max-width: 768px){
        flex-direction: column;
        height: auto;
      }

      .left, .right{
        width: 50%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: left;
        padding: 20px;
        padding-left: 50px;

        @media(max-width: 768px){
          width: 100%;
        }

        .accroche{
          font-size: 2rem;
          color: #fff;
          margin-bottom: 20px;
          font-weight: bold;

          @media(max-width: 768px){
            font-size: 1.5rem;
            text-align: center;
            padding: 0 20px;
          }
        }
        .sub-text p{
          color: #eee;
          margin-bottom: 10px;
          font-size: 1rem;

          @media(max-width: 768px){
            text-align: center;
            font-size: 0.9rem;
            padding: 0 10px;
          }
        }
        .action{
          width: 250px;
          height:60px;
          border: 2px solid #eee;
          background: transparent;
          background-color: #eee;
          transition: all .3s ease;
          color: #555;
          font-size: 1rem;
          font-weight: bold;
          border-radius: 5px;
          cursor: pointer;
          &:hover{
            background-color: #eeeeee65;
              color:#555;
          }

          @media(max-width: 768px){
            width: 200px;
            height: 50px;
            font-size: 0.9rem;
            margin-left:15%;
          }
        }

        .hero-img{
          position: relative;
          width: 100%;
          height: 50%;

          img{
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 10;
          }
        }
        .img-diagram{
          position: relative;
          width: 80%;
          height: 100%;
          box-shadow: 0 4px 30px rgba(0,0,0, .32);

          img{
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 10px;
            overflow: hidden;
          }

          .float{
            position: absolute;
            top: -50%;
            right: 10%;
            width: 80px;
            height: 120px;
            display: flex;
            flex-direction: column;
            align-items: center;
            background-color: rgba(255, 255, 255, 0.8);
            padding: 10px;
            border-radius: 10px;
            box-shadow: 0 4px 30px rgba(0,0,0,0.2);
            z-index: 10;

            p{
              margin: 0;
              font-size: 0.8rem;
              color: #333;
              font-weight: bold;
            }

            .circle-ctn{
              display: flex;
              justify-content: center;
              align-items: center;
              width: 40px;
              height: 40px;
              background-color: #61f8a5;
              border-radius: 50%;
              margin-bottom: 5px;

              .circle{
                display: flex;
                justify-content: center;
                align-items: center;
                width: 30px;
                height: 30px;
                background-color: #fff;
                border-radius: 50%;

                i{
                  color: #61f8a5;
                }
              }
            }
          }
        }
      }
    }

    .landing-body{
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 10px;
      width: 100%;
      margin: 50px;

      @media (max-width: 768px){
        margin: 20px;
      }

      .features{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        margin: 50px;

        .feat-header{
          text-align: center;
          margin: 20px;

          h2{
            margin-bottom: 10px;
          }

          p{
            color: #555;
            font-size: 1rem;
            width: 80%;
            margin: 0 auto;
          }
        }

        .feat-ctn{
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin: 20px;

          @media (max-width: 768px){
            flex-direction: column;
            align-items: center;
          }

          .feat-card{
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 300px;
            height: auto;
            background-color: #fff;
            border-radius: 10px;
            padding: 20px;
            text-align: center;

            &:hover{
              box-shadow: 0 4px 30px rgba(0,0,0, .32);
              transform: translateY(-5px);
              transition: all .3s ease;
            }

            @media (max-width: 400px){
              width: 90%;
              padding: 10px;
            }

            .img-icon{
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 10px;
              width: 100%;
              margin-bottom: 10px;

              .img{
                width: 60px;
                height: 60px;
                border-bottom: 4px solid #4aff90;

                img{
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                }
              }

              .null{
                width: 96px;
                height: 96px;
              }
            }

            h4{
              margin-bottom: 10px;
              color: #333;
            }

            p{
              color: #555;
              font-size: 0.9rem;
            }
          }
        }

        .target-audience{
          display: flex;
          justify-content: space-around;
          align-items: center;
          width: 100%;
          margin: 20px 0;
          background-color: #090229;
          color: #fff;
          padding: 20px;

          @media (max-width: 768px){
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .general{
            font-weight: bold;
            font-size: 1.2rem;
            width: 60%;
            padding: 50px;

            @media (max-width: 768px){
              width: 100;
              margin-bottom: 20px;
            }
          }

          .specific{
            width: 40%;

            @media(max-width: 768px){
              width: 100%;
            }
            ul{
              list-style: none;
              padding: 0;

              li{
                display: flex;
                align-items: center;
                margin-bottom: 10px;
                font-size: 0.8rem;

                .dot-img{
                  width: 20px;
                  height: 20px;
                  margin-right: 10px;
                  border-radius: 50%;
                  overflow: hidden;

                  img{
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                  }
                }
              }
            }
          }
        }
      }
    }
    
    .benefits{
        display: flex;
        justify-content: center;
        width: 100%;
        padding: 20px;

        @media(max-width: 768px){
          flex-direction: column;
          align-items: center;
        }

        .benefs{
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 50%;
            padding: 20px;

            @media (max-width: 768px){
              width: 100%;
            }

            .b-text{
                text-align: left;
                margin-bottom: 20px;
                @media(max-width:768px){
                  text-align: center;
                  padding: 0 20px;
                }

                h3{
                    margin-bottom: 10px;
                }

                p{
                    color: #555;
                    font-size: 1rem;
                    width: 80%;
                    margin: 0 auto;
                }
            }

            .b-list{
                ul{
                    list-style: none;
                    padding: 0;

                    li{
                        display: flex;
                        align-items: center;
                        margin-bottom: 10px;
                        font-size: 0.9rem;

                        img{
                            width: 20px;
                            height: 20px;
                            margin-right: 10px;
                        }
                    }
                }
            }
        }

        .b-illustrations{
            position: relative;
            width: 50%;

            @media (max-width: 768px){
              display: none;
            }

            .b-illus{
                position: absolute;
                background-color: #fff;
                border-radius: 10px;
                box-shadow: 0 4px 30px rgba(0,0,0, .32);
                overflow: hidden;

                &.i1{
                    top: 0;
                    left: 0;
                    width: 48%;
                    height: 100px;
                    display: flex;
                    justify-content: space-around;
                    align-items: center;

                    .i-img{
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        overflow: hidden;

                        img{
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                        }
                    }
                }

                &.i2{
                    top: 10%;
                    right: 40px;
                    width: 40%;
                    height: 350px;

                    img{
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                    }
                }
                &.i3{
                    bottom: -100px;
                    left: 0;
                    width: 95%;
                    height: 250px;

                    img{
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                    }
                }
            }
        }
      }

    .call-to-action {
        position: relative;
        background-image: url('../assets/images/team.jpg');
        background-size: cover;
        background-position: center;
        color: #fff;
        padding: 20px;
        margin: 50px;
        margin-top: 100px;
        text-align: center;
        width: 80%;
        border-radius: 50px;
        overflow: hidden;

        &::before{
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: #0902688e;
        }

        h2 {
            font-size: 2rem;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;

            em{
              color: #61f8a5;
            }
        }
        p {
            font-size: 1rem;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
        }
        div{
          position: relative;
          z-index: 1;
          .action{
            width: 250px;
            height:60px;
            border: 2px solid #eee;
            background-color: #eee;
            transition: all .3s ease;
            color: #555;
            font-size: 1rem;
            font-weight: bold;
            border-radius: 5px;
            cursor: pointer;
            &:hover{
              background-color: #eeeeee65;
              color:#555;
            }

            @media(max-width: 768px){
              width: 200px;
              height: 50px;
              font-size: 0.9rem;
              margin-left:15%;
            }
          }
        }
        
    }

    footer{
      width: 100%;
      background-color: #9fc9c0;
      color: #5f5f5f;
      padding: 20px 50px;
      margin-top: 20px;

      .footer-top{
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 20px;
        border-bottom: 1px solid #ccc;

        @media(max-width: 768px){
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .footer-branding{
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 10px 50px;

          div:first-child{
            font-size: 1.5rem;
            font-weight: bold;
            color:#090229;
          }

          .social-links{
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;

            a{
              width: 30px;
              height: 30px;
              overflow: hidden;

              img{
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
            }
          }
        }

        .footer-links-ctn{
          display: flex;
          justify-content: center;
          align-items: flex-start;
          gap: 50px;
          padding: 10px 50px;

          @media(max-width: 768px){
            flex-direction: column;
            align-items: center;
            margin-top: 20px;
            gap: 20px;
          }

          .footer-links{
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: space-around;

            @media(max-width: 768px){
              align-items: center;
              margin-top: 20px;
            }

            h5{
              margin-bottom: 10px;
              font-size: 1.2rem;
            }

            .link{
              display: block;
              margin-bottom: 5px;
              text-decoration: none;
              color: inherit;
            }
          }
        }
      }
    }
    .footer-bottom{
      text-align: center;
      padding: 10px;
      font-size: 0.9rem;
      color: #333;
    }
</style>

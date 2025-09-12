// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC8UWLyg4ko_Q7U5ViVu3rrhfbRjo8DHaU",
  authDomain: "opentask-a9334.firebaseapp.com",
  projectId: "opentask-a9334",
  storageBucket: "opentask-a9334.appspot.com",
  messagingSenderId: "741918411191",
  appId: "1:741918411191:web:796a4fe9074e1fcfe44032",
  measurementId: "G-L9EEDG8N3D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };

/*import firebase from "firebase/app";
import "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://support.google.com/firebase/answer/7015592
const firebaseConfig = {
  apiKey: "AIzaSyC8UWLyg4ko_Q7U5ViVu3rrhfbRjo8DHaU",
  authDomain: "opentask-a9334.firebaseapp.com",
  projectId: "opentask-a9334",
  storageBucket: "opentask-a9334.appspot.com",
  messagingSenderId: "741918411191",
  appId: "1:741918411191:web:796a4fe9074e1fcfe44032",
  measurementId: "G-L9EEDG8N3D"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);


// Initialize Cloud Firestore and get a reference to the service
const db = firebase.firestore();*/
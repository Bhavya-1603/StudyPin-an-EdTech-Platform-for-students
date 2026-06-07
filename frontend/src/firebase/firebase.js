// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVT7o-9-C2zQZJP0mJJguANw8Yv2Q4FyM",
  authDomain: "studypin-498608.firebaseapp.com",
  projectId: "studypin-498608",
  storageBucket: "studypin-498608.firebasestorage.app",
  messagingSenderId: "235883357796",
  appId: "1:235883357796:web:b82f1b15124a44fdf36171",
  measurementId: "G-TEXMNRJJN5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
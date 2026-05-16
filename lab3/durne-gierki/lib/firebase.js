// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCOgFtmh63LZbniuB4NFXb21KmS-ToUOxw",
  authDomain: "durne-gierki.firebaseapp.com",
  projectId: "durne-gierki",
  storageBucket: "durne-gierki.firebasestorage.app",
  messagingSenderId: "764965657972",
  appId: "1:764965657972:web:b30112d88bcd6ac135a021",
  measurementId: "G-8EYZ7WNHK7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
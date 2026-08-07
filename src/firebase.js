import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDVip4sUndIaFc1xBExz7bTrXmNkMFXdFE",
  authDomain: "bhangdiya-portal.firebaseapp.com",
  projectId: "bhangdiya-portal",
  storageBucket: "bhangdiya-portal.firebasestorage.app",
  messagingSenderId: "995001116788",
  appId: "1:995001116788:web:84b212dc77a35208cb4921",
  measurementId: "G-0396QRR36M"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
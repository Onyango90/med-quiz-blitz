import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBXA2-tlOIJyOWeUvj0CkhN3YKduIEp37s",
  authDomain: "medblitz-9c4e7.firebaseapp.com",
  projectId: "medblitz-9c4e7",
  storageBucket: "medblitz-9c4e7.firebasestorage.app",
  messagingSenderId: "87079197909",
  appId: "1:87079197909:web:8eecf9503b2fe057c2565c",
  measurementId: "G-MBFJVWWZLZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
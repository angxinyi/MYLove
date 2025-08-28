import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA7JHhihKz8zVel2N6y24eIBX6hNELU2cM",
  authDomain: "mylove-12345.firebaseapp.com",
  projectId: "mylove-12345",
  storageBucket: "mylove-12345.firebasestorage.app",
  messagingSenderId: "564300186286",
  appId: "1:564300186286:web:ef8f2998c076a43f8ba33f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

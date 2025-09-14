// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

// // Your Firebase config
// const firebaseConfig = {
//   apiKey: "AIzaSyA7JHhihKz8zVel2N6y24eIBX6hNELU2cM",
//   authDomain: "mylove-12345.firebaseapp.com",
//   projectId: "mylove-12345",
//   storageBucket: "mylove-12345.firebasestorage.app",
//   messagingSenderId: "564300186286",
//   appId: "1:564300186286:web:ef8f2998c076a43f8ba33f",
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Initialize Auth
// export const auth = getAuth(app);

// // Initialize Firestore
// export const db = getFirestore(app);

// firebase/config.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA7JHhihKz8zVel2N6y24eIBX6hNELU2cM",
  authDomain: "mylove-12345.firebaseapp.com",
  projectId: "mylove-12345",
  storageBucket: "mylove-12345.firebasestorage.app",
  messagingSenderId: "564300186286",
  appId: "1:564300186286:web:ef8f2998c076a43f8ba33f",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Use RN persistence so each device has its own session storage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Functions
export const functions = getFunctions(app);

// Connect to emulators in development
if (false) { // Temporarily disabled - change to __DEV__ to re-enable
  // Connect to Firestore emulator
  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8081);
  } catch (error) {
    // Already connected
    console.log('Firestore emulator already connected');
  }
  
  // Connect to Functions emulator
  try {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  } catch (error) {
    // Already connected
    console.log('Functions emulator already connected');
  }
}

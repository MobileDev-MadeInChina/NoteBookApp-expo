// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBK_nOSZAjBbArgIKC254HhmToD-ZfTJKg",
  authDomain: "notebookapp-expo.firebaseapp.com",
  projectId: "notebookapp-expo",
  storageBucket: "notebookapp-expo.appspot.com",
  messagingSenderId: "397166190315",
  appId: "1:397166190315:web:fdb6d893b38c53ba66e8ae",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getFirestore(app);
export { app, database };
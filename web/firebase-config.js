// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAxG4sI_RO6IN8kItCTeXJkFb9zFeEnQ_M",
  authDomain: "spaktok-e7866.firebaseapp.com",
  projectId: "spaktok-e7866",
  storageBucket: "spaktok-e7866.firebasestorage.app",
  messagingSenderId: "603021639103",
  appId: "1:603021639103:web:c18ace07125da11a5ab50a",
  measurementId: "G-1DTF6R1ZBB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


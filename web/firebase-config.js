// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// Optional: import analytics only when available
let getAnalytics;
try {
  // Dynamically import to avoid issues in non-browser envs
  ({ getAnalytics } = await import("firebase/analytics"));
} catch (_) {}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Read from environment when served via hosting proxy; fallback to placeholders
const firebaseConfig = {
  apiKey: import.meta?.env?.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta?.env?.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta?.env?.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta?.env?.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta?.env?.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta?.env?.VITE_FIREBASE_MEASUREMENT_ID || undefined
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
if (typeof window !== "undefined" && getAnalytics) {
  try { getAnalytics(app); } catch (_) {}
}


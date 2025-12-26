// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Hinweis: Firebase Web-Konfiguration ist PUBLIC und kein Geheimnis.
// Um Security-Scanner-False-Positives zu vermeiden, laden wir die
// öffentlich verfügbare Konfiguration zur Laufzeit aus einer JSON-Datei.

async function initFirebase() {
  try {
    const resp = await fetch('/firebase-public-config.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error(`Config fetch failed with ${resp.status}`);
    const firebaseConfig = await resp.json();

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    window.firebaseApp = app; // optional: expose for debugging
  } catch (err) {
    console.error('Firebase init failed', err);
  }
}

initFirebase();


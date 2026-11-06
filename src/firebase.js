import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

// Local testing (npm run dev:local) uses a fake "demo-" project on this computer only.
export const usingEmulators = import.meta.env.VITE_USE_EMULATORS === "true";

// These values are public by design. Security comes from firestore.rules.
const firebaseConfig = {
  apiKey: "AIzaSyDVip4sUndIaFc1xBExz7bTrXmNkMFXdFE",
  authDomain: "bhangdiya-portal.firebaseapp.com",
  projectId: usingEmulators ? "demo-bhangdiya" : "bhangdiya-portal",
  appId: "1:995001116788:web:84b212dc77a35208cb4921",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
auth.languageCode = "en";

if (usingEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

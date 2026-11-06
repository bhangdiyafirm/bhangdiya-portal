import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

// Local testing (npm run dev:local) uses a fake "demo-" project on this computer only.
export const usingEmulators = import.meta.env.VITE_USE_EMULATORS === "true";

// On the live site the Google sign-in pages are served through our own address
// (worker/index.js forwards /__/auth/ to Firebase). Phone browsers block sign-in
// across two different sites, so this keeps it working everywhere.
const onLiveSite =
  !usingEmulators && !["localhost", "127.0.0.1"].includes(window.location.hostname);

// These values are public by design. Security comes from firestore.rules.
const firebaseConfig = {
  apiKey: "AIzaSyDVip4sUndIaFc1xBExz7bTrXmNkMFXdFE",
  authDomain: onLiveSite ? window.location.host : "bhangdiya-portal.firebaseapp.com",
  projectId: usingEmulators ? "demo-bhangdiya" : "bhangdiya-portal",
  appId: "1:995001116788:web:84b212dc77a35208cb4921",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
auth.languageCode = "en";

if (usingEmulators) {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase is optional. This file must not throw when it is not configured.
 *
 * It used to call `getAuth()` at module scope unconditionally. With no .env
 * present that throws `auth/invalid-api-key` — and because this module is
 * statically imported by authStore, collections, auth, LoginScreen and
 * HowToPlay, the throw happened before React mounted. A fresh clone rendered
 * a blank white page with one console error, even though VITE_USE_FIREBASE
 * defaults to false and the app does not need Firebase to run at all.
 *
 * So initialisation is now conditional on BOTH the feature flag and a real
 * API key being present. When it is off, the exports are inert placeholders:
 * every call site is already behind a `USE_FIREBASE` check, so nothing
 * touches them, and the local-state prototype runs with no configuration.
 */

const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY ?? '';

export const firebaseEnabled = USE_FIREBASE && apiKey.length > 0;

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

if (firebaseEnabled) {
  _app = initializeApp(firebaseConfig);
  _auth = getAuth(_app);
  _db = getFirestore(_app);
} else if (USE_FIREBASE) {
  // Flag on but unconfigured — say so, rather than failing at the first call.
  console.warn(
    '[firebase] VITE_USE_FIREBASE=true but VITE_FIREBASE_API_KEY is empty. ' +
      'Running without Firebase; see .env.example.'
  );
}

/*
 * Cast rather than a stub object.
 *
 * A hand-written stub would need to satisfy the whole Auth / Firestore
 * surface, and any method it missed would fail in a confusing way at the call
 * site. A null cast fails loudly and obviously instead — and only if someone
 * adds a call that is not behind a USE_FIREBASE check, which is the bug worth
 * surfacing.
 */
export const auth = _auth as Auth;
export const db = _db as Firestore;
export default _app as FirebaseApp;
